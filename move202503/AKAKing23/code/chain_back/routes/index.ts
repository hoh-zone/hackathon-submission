import Router from "koa-router";
import { Context } from "koa";
import { CozeAPI } from "@coze/api";
import cors from "@koa/cors";

const router = new Router();

// 使用内存Map临时存储问题数据
// 注意：这只适合开发环境，实际生产环境应该使用数据库或Redis
const questionsStore = new Map<string, any[]>();

const base64EncodedString =
  "cGF0X2RnUVRqSTRSNlR2T3ZHcHVLMkZ0NEQxT2dCOWg0YjVNVHRRZDZQckFPTndmZ2ljM3dEem9FUWVMR0JOb2VHQk4="; // "Hello world!" 的Base64编码

const decodedBuffer = Buffer.from(base64EncodedString, "base64");
const decodedString = decodedBuffer.toString("utf-8");

const apiClient = new CozeAPI({
  token: decodedString,
  baseURL: "https://api.coze.cn",
});

// 添加CORS中间件
router.use(
  cors({
    origin: "*", // 允许所有来源访问
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  })
);

// 基本 GET 请求示例
router.get("/", async (ctx: Context) => {
  ctx.body = {
    status: "success",
    message: "欢迎使用 LearnChain-X API",
  };
});

// POST 接口示例
router.post("/api/submit", async (ctx: Context) => {
  try {
    const data = ctx.request.body;

    // 这里可以添加数据验证逻辑
    if (!data) {
      ctx.status = 400;
      ctx.body = {
        status: "error",
        message: "请提供有效的数据",
      };
      return;
    }

    // 这里可以添加数据处理逻辑
    // 例如：保存到数据库、调用其他服务等

    // 返回处理结果
    ctx.status = 200;
    ctx.body = {
      status: "success",
      message: "数据提交成功",
      data: data,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      status: "error",
      message: "服务器内部错误",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
});

// Coze API调用封装成POST请求
router.post("/api/coze", async (ctx: Context) => {
  try {
    const requestBody = ctx.request.body as any;
    const input = requestBody?.input || "";
    const userId = requestBody?.userId || "default"; // 用于区分不同用户的会话

    if (!input) {
      ctx.status = 400;
      ctx.body = {
        status: "error",
        message: "请提供输入内容",
      };
      return;
    }

    const res = await apiClient.workflows.runs.create({
      workflow_id: "7494156103493287945",
      parameters: {
        input: input,
      },
    });

    // 从响应中提取题目数据并格式化
    let formattedData;
    try {
      // 尝试解析返回的数据
      const rawData = res.data as any;
      
      // 如果返回的是字符串，直接尝试解析
      let jsonData;
      if (typeof rawData === 'string') {
        try {
          jsonData = JSON.parse(rawData);
        } catch (e) {
          // 如果不是合法的JSON字符串，尝试从字符串中提取JSON
          const jsonMatch = rawData.match(/```json([\s\S]*?)```/) || 
                           rawData.match(/\[([\s\S]*?)\]/);
          
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[1].trim());
          } else {
            throw new Error("无法从字符串中提取JSON");
          }
        }
      } else if (rawData && typeof rawData === 'object') {
        // 如果是对象，检查reply字段
        const reply = rawData.reply || '';
        const jsonMatch = reply ? (reply.match(/```json([\s\S]*?)```/) || 
                        reply.match(/\[([\s\S]*?)\]/)) : null;
        
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[1].trim());
        } else if (typeof rawData.output === 'string') {
          // 有些情况下可能直接返回输出字符串
          try {
            jsonData = JSON.parse(rawData.output);
          } catch {
            jsonData = rawData;
          }
        } else {
          jsonData = rawData;
        }
      } else {
        throw new Error("无法解析返回的数据");
      }
      
      // 处理解析后的数据
      const questionsWithAnswers = Array.isArray(jsonData) ? jsonData : 
                                 (jsonData.output && Array.isArray(jsonData.output) ? jsonData.output : []);
      
      // 存储问题数据到Map
      questionsStore.set(userId, questionsWithAnswers);
      
      // 去除答案字段
      const questionsWithoutAnswers = questionsWithAnswers.map((q: any) => {
        const { answer, ...questionWithoutAnswer } = q;
        return questionWithoutAnswer;
      });
      
      formattedData = {
        output: questionsWithoutAnswers
      };
    } catch (error) {
      console.error("格式化数据失败", error);
      formattedData = { output: [] }; // 如果解析失败，返回空数组
    }

    ctx.status = 200;
    ctx.body = {
      status: "success",
      message: "Coze API调用成功",
      data: formattedData,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      status: "error",
      message: "调用Coze API失败",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
});

// 添加验证答案的接口
router.post("/api/verify-answer", async (ctx: Context) => {
  try {
    const requestBody = ctx.request.body as any;
    const { questionIndex, selectedOption } = requestBody;
    const userId = requestBody?.userId || "default"; // 用于获取对应用户的问题数据
    
    // 获取之前存储的问题数据
    const questions = questionsStore.get(userId);
    
    if (!questions || !questions[questionIndex]) {
      ctx.status = 400;
      ctx.body = {
        status: "error",
        message: "问题不存在或会话已过期",
      };
      return;
    }
    
    const question = questions[questionIndex];
    
    // 处理不同格式的答案
    let correctAnswer;
    let correctOptionLetter = "";
    let isCorrect = false;
    
    if (question.answer !== undefined) {
      correctAnswer = question.answer;
      
      // 如果答案是数字
      if (typeof correctAnswer === 'number') {
        isCorrect = selectedOption === correctAnswer;
        correctOptionLetter = String.fromCharCode(65 + correctAnswer); // 将数字转换为A,B,C,D
      } 
      // 如果答案是以选项前缀开头的字符串，如"A. 正确答案"，或"B. 选项内容"
      else if (typeof correctAnswer === 'string') {
        // 检查是否以字母前缀开头 (如 A. B. C. 等)
        if (/^[A-D]\.?\s/.test(correctAnswer)) {
          const letterIndex = correctAnswer.charCodeAt(0) - 65; // 'A' 的 ASCII 码是 65
          isCorrect = selectedOption === letterIndex;
          correctOptionLetter = correctAnswer.charAt(0);
        } 
        // 直接匹配选项内容
        else {
          let foundIndex = -1;
          for (let i = 0; i < question.options.length; i++) {
            const optionContent = question.options[i].replace(/^[A-D]\.?\s/, '');
            if (optionContent.includes(correctAnswer) || correctAnswer.includes(optionContent)) {
              foundIndex = i;
              break;
            }
          }
          
          if (foundIndex !== -1) {
            isCorrect = selectedOption === foundIndex;
            correctOptionLetter = String.fromCharCode(65 + foundIndex);
          }
        }
      }
    }
    
    // 对所有ABCD字母答案进行通用处理
    if (typeof correctAnswer === 'string') {
      // 直接处理单个字母答案 (A, B, C, D)
      if (/^[A-D]$/.test(correctAnswer)) {
        const letterIndex = correctAnswer.charCodeAt(0) - 65; // 'A'的ASCII码是65
        isCorrect = selectedOption === letterIndex;
        correctOptionLetter = correctAnswer;
      }
      // 处理带点格式 (A., B., C., D.)
      else if (/^[A-D]\.$/.test(correctAnswer)) {
        const letterIndex = correctAnswer.charCodeAt(0) - 65;
        isCorrect = selectedOption === letterIndex;
        correctOptionLetter = correctAnswer.charAt(0);
      }
      // 处理带空格格式 (A xxx, B xxx, C xxx, D xxx)
      else if (/^[A-D] /.test(correctAnswer)) {
        const letterIndex = correctAnswer.charCodeAt(0) - 65;
        isCorrect = selectedOption === letterIndex;
        correctOptionLetter = correctAnswer.charAt(0);
      }
    }
    
    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: {
        isCorrect,
        correctAnswer: correctAnswer || "",
        correctOptionLetter: correctOptionLetter, // 添加ABCD格式的正确答案
        explanation: question.explanation || ""
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      status: "error",
      message: "验证答案失败",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
});

// 获取问题答案与解析的接口
router.get("/api/question-solution", async (ctx: Context) => {
  try {
    const questionIndex = ctx.query.questionIndex ? parseInt(ctx.query.questionIndex as string) : undefined;
    const userId = ctx.query.userId as string || "default"; // 用于获取对应用户的问题数据
    
    if (questionIndex === undefined) {
      ctx.status = 400;
      ctx.body = {
        status: "error",
        message: "请提供问题索引",
      };
      return;
    }
    
    // 获取之前存储的问题数据
    const questions = questionsStore.get(userId);
    
    if (!questions || !questions[questionIndex]) {
      ctx.status = 404;
      ctx.body = {
        status: "error",
        message: "问题不存在或会话已过期",
      };
      return;
    }
    
    const question = questions[questionIndex];
    
    // 计算正确答案的字母表示（A、B、C、D）
    let correctOptionLetter = "";
    if (question.answer !== undefined) {
      const correctAnswer = question.answer;
      
      if (typeof correctAnswer === 'number') {
        correctOptionLetter = String.fromCharCode(65 + correctAnswer);
      } else if (typeof correctAnswer === 'string') {
        if (/^[A-D]\.?\s/.test(correctAnswer)) {
          correctOptionLetter = correctAnswer.charAt(0);
        } else {
          let foundIndex = -1;
          for (let i = 0; i < question.options.length; i++) {
            const optionContent = question.options[i].replace(/^[A-D]\.?\s/, '');
            if (optionContent.includes(correctAnswer) || correctAnswer.includes(optionContent)) {
              foundIndex = i;
              break;
            }
          }
          
          if (foundIndex !== -1) {
            correctOptionLetter = String.fromCharCode(65 + foundIndex);
          }
        }
      }
    }
    
    ctx.status = 200;
    ctx.body = {
      status: "success",
      data: {
        question: question.question,
        options: question.options,
        answer: question.answer,
        correctOptionLetter: correctOptionLetter, // 添加ABCD格式的正确答案
        explanation: question.explanation || "暂无解析"
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      status: "error",
      message: "获取答案解析失败",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
});

export default router;
