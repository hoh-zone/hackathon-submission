import service from './axios';

// coze接口类型定义
export interface CozeRequestParams {
  input: string;
  userId?: string;
  [key: string]: string | number | boolean | undefined; // 更精确的参数类型
}

export interface CozeResponse {
  reply?: string;
  data?: {
    output?: Array<{
      question: string;
      options: string[];
      explanation?: string;
    }>;
    [key: string]: unknown;
  };
  status: string;
  message: string;
  [key: string]: string | number | boolean | object | undefined; // 更精确的返回类型
}

// 验证答案接口参数
export interface VerifyAnswerParams {
  questionIndex: number;
  selectedOption: number;
  userId?: string;
}

// 验证答案接口返回
export interface VerifyAnswerResponse {
  status: string;
  data: {
    isCorrect: boolean;
    correctAnswer: string | number;
    correctOptionLetter: string;
    explanation?: string;
  };
}

// 查看答案解析接口参数
export interface QuestionSolutionParams {
  questionIndex: number;
  userId?: string;
}

// 查看答案解析接口返回
export interface QuestionSolutionResponse {
  status: string;
  data: {
    question: string;
    options: string[];
    answer: string | number;
    correctOptionLetter: string;
    explanation: string;
  };
}

/**
 * 向coze API发送消息
 * @param params 请求参数
 * @returns Promise<CozeResponse>
 */
export function sendMessageToCoze(params: CozeRequestParams): Promise<CozeResponse> {
  return service({
    url: '/api/coze',
    method: 'post',
    data: params
  });
}

/**
 * 验证答案
 * @param params 验证参数
 * @returns Promise<VerifyAnswerResponse>
 */
export function verifyAnswer(params: VerifyAnswerParams): Promise<VerifyAnswerResponse> {
  return service({
    url: '/api/verify-answer',
    method: 'post',
    data: params
  });
}

/**
 * 获取问题答案与解析
 * @param params 查询参数
 * @returns Promise<QuestionSolutionResponse>
 */
export function getQuestionSolution(params: QuestionSolutionParams): Promise<QuestionSolutionResponse> {
  return service({
    url: '/api/question-solution',
    method: 'get',
    params
  });
}

export default {
  sendMessageToCoze,
  verifyAnswer,
  getQuestionSolution
}; 