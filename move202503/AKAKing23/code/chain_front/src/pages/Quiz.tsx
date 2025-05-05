// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  sendMessageToCoze,
  verifyAnswer,
  getQuestionSolution,
} from "../api/coze";
import {
  createDirectRewardParams,
  createViewSolutionSimpleTransaction,
  createAddSimpleQuestionParams,
  createSelfMintSBTParams,
  CONTRACT_ADDRESS,
} from "../api/sui";
import "../styles/Quiz.css";
import { TESTNET_QUIZMANAGER_ID, TESTNET_REGISTRY_ID,TESTNET_COUNTER_PACKAGE_ID } from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  encryptAndUploadToWalrus,
  createPublishBlobTransaction,
} from "@/api/walrus";
import { Transaction } from "@mysten/sui/transactions";

interface QuizQuestion {
  id?: number;
  question: string;
  options: string[];
  explanation?: string;
}

const Quiz: React.FC = () => {
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get("difficulty") || "primary";
  const [loading, setLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string | number;
    correctOptionLetter?: string;
    explanation?: string;
  } | null>(null);
  const [sbtAwarded, setSbtAwarded] = useState<boolean>(false);
  const [encryptingQuestions, setEncryptingQuestions] =
    useState<boolean>(false);
  const [questionsEncrypted, setQuestionsEncrypted] = useState<boolean>(false);
  const [walrusBlobId, setWalrusBlobId] = useState<string>("");
  const [suiWalrusUrl, setSuiWalrusUrl] = useState<string>("");

  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  // userCoinId已经不再用于查看解析功能，但仍保留用于获取和显示代币余额
  const [userCoinId, setUserCoinId] = useState<string | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState<string>("0");

  // 使用useRef创建一个引用，用于跟踪函数是否已被调用
  const encryptionAttemptedRef = useRef<boolean>(false);

  // 获取用户代币ID和余额的函数
  const getUserCoinId = async (address: string) => {
    try {
      if (!address) return null;

      // 获取用户拥有的所有代币
      const coins = await suiClient.getCoins({
        owner: address,
        coinType: `${CONTRACT_ADDRESS}::point_token::POINT_TOKEN`,
      });
      console.log(coins, "coins----");

      // 如果用户有代币，返回第一个代币的ID
      if (coins && coins.data && coins.data.length > 0) {
        // 计算总余额
        let totalBalance = 0n;
        for (const coin of coins.data) {
          if (coin.balance) {
            totalBalance += BigInt(coin.balance);
          }
        }

        // 更新余额状态（转换为可读格式，假设代币有9位小数）
        const formattedBalance = formatTokenBalance(totalBalance);
        setUserTokenBalance(formattedBalance);

        return coins.data[0].coinObjectId;
      }

      return null;
    } catch (error) {
      console.error("获取用户代币失败:", error);
      return null;
    }
  };

  // 格式化代币余额的辅助函数
  const formatTokenBalance = (balance: bigint): string => {
    const decimals = 9; // 假设代币有9位小数
    const divisor = BigInt(10 ** decimals);

    if (balance === 0n) return "0";

    const integerPart = balance / divisor;
    const fractionalPart = balance % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    // 确保小数部分有正确的前导零
    let fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    // 移除尾部的0
    fractionalStr = fractionalStr.replace(/0+$/, "");

    return `${integerPart}.${fractionalStr}`;
  };

  // 手动刷新代币余额
  const refreshTokenBalance = async () => {
    if (currentAccount) {
      await getUserCoinId(currentAccount.address);
    }
  };

  // 在组件挂载和用户账户变更时获取用户代币ID和余额
  useEffect(() => {
    if (currentAccount) {
      getUserCoinId(currentAccount.address).then((coinId) => {
        setUserCoinId(coinId);
      });
    } else {
      setUserTokenBalance("0"); // 重置余额
      setUserCoinId(null);
    }
  }, [currentAccount]);

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        // 从localStorage检查是否已经缓存了题目
        const cachedQuestions = localStorage.getItem(
          `quizQuestions_${difficulty}`
        );
        // 生成或获取用户ID
        const userId =
          localStorage.getItem("userId") ||
          `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("userId", userId);

        if (cachedQuestions) {
          const parsedQuestions = JSON.parse(cachedQuestions);
          setQuestions(parsedQuestions);
          setLoading(false);

          // 加载缓存题目后，自动加密并上传到Walrus
          if (
            currentAccount &&
            parsedQuestions.length > 0 &&
            !questionsEncrypted
          ) {
            setTimeout(() => {
              // 将parsedQuestions作为参数传递
              encryptQuestionsToWalrus(parsedQuestions);
            }, 1000);
          }
        } else {
          // 如果没有缓存，则调用API获取题目
          // 根据难度级别调整提示词
          let prompt = "";
          switch (difficulty) {
            case "primary":
              prompt =
                "请生成3道初级Move语言相关的选择题，每道题有4个选项，格式为JSON数组";
              break;
            case "intermediate":
              prompt =
                "请生成3道中级Move语言相关的选择题，每道题有4个选项，格式为JSON数组";
              break;
            case "advanced":
              prompt =
                "请生成3道高级Move语言相关的选择题，每道题有4个选项，格式为JSON数组";
              break;
            default:
              prompt =
                "请生成3道初级Move语言相关的选择题，每道题有4个选项，格式为JSON数组";
          }

          const response = await sendMessageToCoze({
            input: prompt,
            userId: userId,
          });

          // 处理返回的数据
          if (response.status === "success") {
            let questions = [];

            // 尝试从不同位置提取题目数据
            if (response.data?.output && Array.isArray(response.data.output)) {
              // 标准格式
              questions = response.data.output;
            } else if (typeof response.data === "string") {
              // 如果data是字符串，尝试解析
              try {
                const parsedData = JSON.parse(response.data);
                questions = Array.isArray(parsedData)
                  ? parsedData
                  : parsedData.output && Array.isArray(parsedData.output)
                  ? parsedData.output
                  : [];
              } catch (e) {
                console.error("解析字符串数据失败", e);
              }
            }
            console.log(questions.length, "questions.length--");

            if (questions.length > 0) {
              setQuestions(questions);
              // 缓存到localStorage，包含难度信息
              localStorage.setItem(
                `quizQuestions_${difficulty}`,
                JSON.stringify(questions)
              );

              // 加载新题目后，如果用户已登录，自动加密并上传到Walrus
              if (currentAccount) {
                setTimeout(() => {
                  encryptQuestionsToWalrus(questions);
                }, 1000);
              }
            } else {
              // 如果未能提取到题目数据，使用默认题目
              const defaultQuestions = getDefaultQuestions();
              setQuestions(defaultQuestions);

              // 如果用户已登录，自动加密并上传默认题目到Walrus
              if (currentAccount) {
                setTimeout(() => {
                  encryptQuestionsToWalrus(defaultQuestions);
                }, 1000);
              }
            }
          } else {
            // 如果返回数据格式不正确，使用默认题目
            const defaultQuestions = getDefaultQuestions();
            setQuestions(defaultQuestions);

            // 如果用户已登录，自动加密并上传默认题目到Walrus
            if (currentAccount) {
              setTimeout(() => {
                encryptQuestionsToWalrus(defaultQuestions);
              }, 1000);
            }
          }

          // 模拟加载时间，给loading动画一些展示时间
          setTimeout(() => {
            setLoading(false);
          }, 1000);
        }
      } catch (error) {
        console.error("获取题目失败", error);
        const defaultQuestions = getDefaultQuestions();
        setQuestions(defaultQuestions);
        setLoading(false);

        // 如果用户已登录，加载失败时也尝试加密并上传默认题目到Walrus
        if (currentAccount) {
          setTimeout(() => {
            encryptQuestionsToWalrus(defaultQuestions);
          }, 1000);
        }
      }
    };

    fetchQuizQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, currentAccount]); // 移除 questionsEncrypted 作为依赖项

  const getDefaultQuestions = (): QuizQuestion[] => {
    return [
      {
        explanation:
          "Move语言是由Facebook的子公司Novi Financial开发的，用于其数字货币项目Diem（原Libra）的智能合约编程语言。",
        options: ["A. Google", "B. Facebook", "C. Microsoft", "D. Apple"],
        question: "Move语言是由哪个组织开发的？",
      },
      {
        explanation:
          "Move语言是一种静态类型的编程语言，它强调类型安全性和资源管理，特别适合编写智能合约。",
        options: ["A. 面向对象", "B. 静态类型", "C. 动态类型", "D. 过程式"],
        question: "Move语言的主要特点是什么？",
      },
      {
        explanation:
          "在Move语言中，使用关键字'resource'来声明资源，资源是一种特殊的结构体，它代表在Move中具有持久存在的数据。",
        options: ["A. struct", "B. resource", "C. module", "D. fun"],
        question: "在Move语言中，以下哪个关键字用于声明资源？",
      },
    ];
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    // 重置答案状态
    setShowAnswer(false);
    setSelectedOption(null);
    setAnswerResult(null);

    // 移动到下一题或完成测验
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
      // 检查是否所有题目都回答正确，尝试发放SBT
      if (score === questions.length && currentAccount) {
        mintAchievementSBT();
      }
    }
  };

  const handleCheckAnswer = async () => {
    if (selectedOption === null) return;
    try {
      const userId = localStorage.getItem("userId") || "default";
      const result = await verifyAnswer({
        questionIndex: currentQuestionIndex,
        selectedOption: selectedOption,
        userId: userId,
      });

      if (result.status === "success") {
        setAnswerResult(result.data);
        setShowAnswer(true);

        // 如果答案正确，增加分数并调用合约奖励用户
        if (result.data.isCorrect && currentAccount) {
          setScore(score + 1);

          try {
            // 奖励积分数量
            const rewardAmount = 1000000000;

            // 使用useSignAndExecuteTransaction的mutate方法执行交易
            signAndExecuteTransaction(
              createDirectRewardParams(
                TESTNET_QUIZMANAGER_ID,
                currentAccount.address,
                rewardAmount
              ),
              {
                onSuccess: (result) => {
                  console.log("奖励积分成功!", result);
                  setTimeout(() => {
                    refreshTokenBalance();
                  }, 1000);
                },
                onError: (error) => {
                  console.error("奖励积分失败:", error);
                },
              }
            );
          } catch (walletError) {
            console.error("调用钱包或合约失败:", walletError);
          }
        }
      }
    } catch (error) {
      console.error("验证答案失败", error);
      setShowAnswer(true);
    }
  };

  const handleViewSolution = async () => {
    try {
      const userId = localStorage.getItem("userId") || "default";
      const result = await getQuestionSolution({
        questionIndex: currentQuestionIndex,
        userId: userId,
      });

      if (result.status === "success") {
        // 如果用户已登录且有代币，调用合约查看解析
        if (currentAccount && userCoinId) {
          try {
            // 使用新的简化方法，设置销毁的代币数量
            // const amount = 100000000; // 1 POINT (考虑小数位数)
            const amount = 50000000;

            // 创建交易，使用简化的方法
            const transaction = createViewSolutionSimpleTransaction(
              TESTNET_QUIZMANAGER_ID,
              userCoinId,
              amount
            );

            // 执行交易
            signAndExecuteTransaction(
              { transaction },
              {
                onSuccess: () => {
                  // 刷新代币余额
                  setTimeout(() => {
                    refreshTokenBalance();
                  }, 1000);

                  // 设置答案结果
                  setAnswerResult({
                    isCorrect:
                      selectedOption !== null &&
                      isCorrectOption(
                        result.data.answer,
                        selectedOption,
                        result.data.correctOptionLetter
                      ),
                    correctAnswer: result.data.answer,
                    correctOptionLetter: result.data.correctOptionLetter,
                    explanation: result.data.explanation,
                  });
                  setShowAnswer(true);
                },
                onError: (error) => {
                  console.error("查看解析失败:", error);
                },
              }
            );
          } catch (error) {
            alert("缺少积分代币");
            console.error("调用合约查看解析失败:", error);
          }
        } else if (currentAccount) {
          alert("暂无积分代币");
          // 如果用户已登录但没有代币，使用直接奖励方法
          // try {
          //   // 创建直接奖励交易
          //   signAndExecuteTransaction(
          //     createDirectRewardParams(
          //       TESTNET_QUIZMANAGER_ID,
          //       currentAccount.address,
          //       1000000 // 奖励1个代币
          //     ),
          //     {
          //       onSuccess: (result) => {
          //         console.log("查看解析成功(使用直接奖励)!", result);
          //         // 刷新代币余额
          //         refreshTokenBalance();
          //       },
          //       onError: (error) => {
          //         console.error("查看解析失败:", error);
          //       },
          //     }
          //   );
          // } catch (error) {
          //   console.error("调用合约查看解析失败:", error);
          // }
        }
      }
    } catch (error) {
      console.error("获取答案解析失败", error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizCompleted(false);
    setShowAnswer(false);
    setAnswerResult(null);
    setSbtAwarded(false);
  };

  // 添加简化问题到链上的示例函数
  const handleAddSimpleQuestion = async () => {
    if (!currentAccount) {
      console.error("用户未登录");
      return;
    }

    try {
      // 这里应该获取问题注册表ID
      const registryId = TESTNET_REGISTRY_ID; // 使用测试网络的注册表ID

      // 创建一个问题示例
      const question = {
        content:
          "Move语言中，以下哪个关键字用于声明模块？\nA. struct\nB. resource\nC. module\nD. function",
      };

      // 使用签名执行交易的mutate方法来添加问题
      signAndExecuteTransaction(
        createAddSimpleQuestionParams(registryId, question.content),
        {
          onSuccess: (result) => {
            console.log("简化问题添加成功!", result);
            // 这里可以解析返回的结果获取问题ID
            // 前端自己存储选项和正确答案，不上传到链上
          },
          onError: (error) => {
            console.error("简化问题添加失败:", error);
          },
        }
      );
    } catch (error) {
      console.error("添加简化问题失败:", error);
    }
  };

  // 铸造成就SBT奖励
  const mintAchievementSBT = async () => {
    if (!currentAccount || sbtAwarded) return;

    try {
      // 根据难度级别设置不同的SBT信息
      let sbtName, sbtDescription, sbtUrl;

      switch (difficulty) {
        case "primary":
          sbtName = "LearnChain-X 初级答题达人";
          sbtDescription =
            "恭喜完成LearnChain-X初级难度的所有问题并答对全部题目，获得初级答题达人成就！";
          // sbtUrl = primaryBadge; // 使用导入的初级徽章图片
          sbtUrl = "https://learnchainx.netlify.app/primary.png"; // 使用导入的初级徽章图片

          break;
        case "intermediate":
          sbtName = "LearnChain-X 中级答题达人";
          sbtDescription =
            "恭喜完成LearnChain-X中级难度的所有问题并答对全部题目，获得中级答题达人成就！";
          sbtUrl = "https://learnchainx.netlify.app/intermediate.png"; // 使用导入的中级徽章图片
          break;
        case "advanced":
          sbtName = "LearnChain-X 高级答题达人";
          sbtDescription =
            "恭喜完成LearnChain-X高级难度的所有问题并答对全部题目，获得高级答题达人成就！这证明了您在Move语言方面的专业知识！";
          sbtUrl = "https://learnchainx.netlify.app/advanced.png"; // 使用导入的中级徽章图片
          break;
        default:
          sbtName = "LearnChain-X 答题达人";
          sbtDescription =
            "恭喜完成LearnChain-X所有问题并答对全部题目，赢得此成就徽章！";
          sbtUrl = "https://learnchainx.netlify.app/primary.png"; // 使用导入的初级徽章图片
      }

      // 创建并执行自助铸造SBT的交易
      signAndExecuteTransaction(
        createSelfMintSBTParams(
          sbtName,
          sbtDescription,
          sbtUrl,
          score, // 当前得分
          questions.length // 总题目数
        ),
        {
          onSuccess: (result) => {
            console.log("SBT铸造成功!", result);
            setSbtAwarded(true);
            alert(
              `恭喜您获得「${
                difficulty === "primary"
                  ? "初级"
                  : difficulty === "intermediate"
                  ? "中级"
                  : "高级"
              }答题达人」成就徽章！`
            );
          },
          onError: (error) => {
            console.error("SBT铸造失败:", error);
            alert("SBT铸造失败: " + error.message);
          },
        }
      );
    } catch (error) {
      console.error("创建SBT交易失败:", error);
    }
  };

  // 加密并上传题目到Walrus
  const encryptQuestionsToWalrus = async (questionsToEncrypt = questions) => {
    console.log(questionsToEncrypt, "questionsToEncrypt---");

    // 如果已经尝试过加密，直接返回
    if (encryptionAttemptedRef.current) {
      console.log("已经尝试过加密，不再重复执行");
      return;
    }

    // 标记已尝试加密
    encryptionAttemptedRef.current = true;

    if (
      !currentAccount ||
      !questionsToEncrypt.length ||
      encryptingQuestions ||
      questionsEncrypted
    )
      return;

    try {
      setEncryptingQuestions(true);
      
      // 检查是否已创建白名单或从localStorage获取白名单ID
      let allowlistObjectId = localStorage.getItem("allowlist_object_id");
      
      // 如果没有白名单ID，创建一个新的白名单
      if (!allowlistObjectId) {
        try {
          // 创建白名单交易
          const createAllowlistTx = new Transaction();
          createAllowlistTx.moveCall({
            target: `${TESTNET_COUNTER_PACKAGE_ID}::allowlist::create_allowlist`,
            arguments: []
          });
          
          // 执行创建白名单交易
          const createResult = await new Promise((resolve) => {
            signAndExecuteTransaction(
              { transaction: createAllowlistTx as any },
              {
                onSuccess: (result) => {
                  console.log("白名单创建成功:", result);
                  resolve(result);
                },
                onError: (error) => {
                  console.error("白名单创建失败:", error);
                  resolve(null);
                }
              }
            );
          });
          console.log(createResult,'createResult');
          
          // 从交易结果中提取白名单对象ID
          if (createResult) {
            try {
              console.log("交易结果：", createResult);
              
              // 交易完成后，直接查询用户拥有的Allowlist对象
              const objects = await suiClient.getOwnedObjects({
                owner: currentAccount.address,
                filter: {
                  StructType: `${TESTNET_COUNTER_PACKAGE_ID}::allowlist::Allowlist`
                },
                options: {
                  showContent: true
                }
              });
              
              console.log("找到的白名单对象：", objects);
              
              if (objects && objects.data && objects.data.length > 0) {
                // 获取最新创建的白名单对象ID
                allowlistObjectId = objects.data[0].data?.objectId;
                if (allowlistObjectId) {
                  localStorage.setItem("allowlist_object_id", allowlistObjectId);
                  console.log("已创建白名单并保存ID:", allowlistObjectId);
                }
              }
            } catch (error) {
              console.error("获取白名单对象失败:", error);
            }
          }
        } catch (error) {
          console.error("创建白名单失败:", error);
        }
      }
      
      // 如果已有白名单ID，将当前用户添加到白名单
      if (allowlistObjectId && currentAccount) {
        try {
          // 创建添加用户到白名单的交易
          const addToAllowlistTx = new Transaction();
          addToAllowlistTx.moveCall({
            target: `${TESTNET_COUNTER_PACKAGE_ID}::allowlist::add_to_allowlist`,
            arguments: [
              addToAllowlistTx.object(allowlistObjectId),
              addToAllowlistTx.pure.address(currentAccount.address)
            ]
          });
          
          // 执行添加用户到白名单的交易
          await new Promise((resolve) => {
            signAndExecuteTransaction(
              { transaction: addToAllowlistTx as any },
              {
                onSuccess: (result) => {
                  console.log("用户已添加到白名单:", result);
                  resolve(result);
                },
                onError: (error) => {
                  console.error("添加用户到白名单失败:", error);
                  resolve(null);
                }
              }
            );
          });
        } catch (error) {
          console.error("添加用户到白名单失败:", error);
        }
      }

      // 创建包含题目和答案的数据结构
      const questionsData = {
        questions: questionsToEncrypt,
        difficulty,
        timestamp: Date.now(),
        creator: currentAccount.address,
      };

      // 检查是否已经加密过该难度的题目
      const encryptedKey = `encrypted_${difficulty}_${currentAccount.address}`;
      const hasEncrypted = localStorage.getItem(encryptedKey);

      const encryptedSuiUrl = `encryptedSuiUrl_${difficulty}_${currentAccount.address}`;
      const hasEncryptedSuiUrl = localStorage.getItem(encryptedSuiUrl);

      if (hasEncrypted) {
        console.log(`题目已经加密过，使用缓存的blobId: ${hasEncrypted}`);
        setWalrusBlobId(hasEncrypted);
        setSuiWalrusUrl(hasEncryptedSuiUrl);
        setQuestionsEncrypted(true);
        setEncryptingQuestions(false);
        return;
      }

      // 将题目数据转为JSON并创建Blob
      const jsonData = JSON.stringify(questionsData);
      const blob = new Blob([jsonData], { type: "application/json" });
      const file = new File([blob], `quiz_${difficulty}_${Date.now()}.json`, {
        type: "application/json",
      });

      // 使用Walrus API加密并上传
      const policyObject = currentAccount.address;
      const result = await encryptAndUploadToWalrus(
        file,
        policyObject,
        suiClient as unknown // 使用类型断言解决SuiClient版本兼容问题
      );
      // 保存返回的blobId
      setWalrusBlobId(result.blobId);
      setSuiWalrusUrl(result.suiUrl);
      setQuestionsEncrypted(true);

      // 缓存加密状态到localStorage
      localStorage.setItem(encryptedKey, result.blobId);
      localStorage.setItem(encryptedSuiUrl, result.suiUrl);

      console.log("题目已加密存储到Walrus:", result);

      // 显示加密成功提示
      setTimeout(() => {
        // alert(
        // `${difficulty}难度题目已成功加密存储到Walrus！BlobId: ${result.blobId.substring(
        //   0,
        //   10
        // )}...`;
        // );
        console.log(
          `${difficulty}难度题目已成功加密存储到Walrus！BlobId: ${result.blobId.substring(
            0,
            10
          )}...`
        );
      }, 500);

      // // 可选：将blobId关联到SUI对象
      // const capId =
      //   "0x4bb927a676df9af934ffb8861f340a4fa1042fb1276d061304e273e71dae62b3"; // 示例ID，实际使用时需要传入有效值
      // const packageId = "0x1234"; // 替换为实际的包ID

      try {
        // 使用类型断言解决Transaction版本兼容性问题
        const tx = createPublishBlobTransaction(
          policyObject,
          // capId,
          "seal_quiz_walrus",
          result.blobId,
          TESTNET_COUNTER_PACKAGE_ID,
          difficulty // 传递题目难度级别作为参数
        );

        signAndExecuteTransaction(
          { transaction: tx as any }, // 使用类型断言解决类型兼容性问题
          {
            onSuccess: (result) => {
              console.log("题目blobId已关联到SUI对象", result);
            },
            onError: (error) => {
              console.error("关联题目blobId失败", error);
            },
          }
        );
      } catch (error) {
        console.error("创建关联交易失败", error);
      }
    } catch (error) {
      console.error("加密题目失败:", error);
      // 如果发生错误，重置尝试状态，允许再次尝试
      encryptionAttemptedRef.current = false;
      alert("加密题目失败，请稍后再试");
    } finally {
      setEncryptingQuestions(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <h2 className="loading-text">
          一大波
          {difficulty === "primary"
            ? "初级"
            : difficulty === "intermediate"
            ? "中级"
            : difficulty === "advanced"
            ? "高级"
            : ""}
          题库正在来临...
        </h2>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="quiz-completed">
        <h2>测验完成！</h2>
        <p>
          您的分数: {score} / {questions.length}
        </p>
        {score === questions.length && (
          <div className="achievement-section">
            <h3>🏆 恭喜您答对所有题目！</h3>
            {sbtAwarded ? (
              <p className="achievement-text">
                已获得「
                {difficulty === "primary"
                  ? "初级"
                  : difficulty === "intermediate"
                  ? "中级"
                  : "高级"}
                答题达人」灵魂绑定代币成就徽章！
              </p>
            ) : currentAccount ? (
              <Button onClick={mintAchievementSBT} className="mint-sbt-button">
                领取SBT成就徽章
              </Button>
            ) : (
              <p className="achievement-text">请连接钱包以领取SBT成就徽章</p>
            )}
          </div>
        )}
        <div className="quiz-actions">
          <button onClick={resetQuiz}>重新开始</button>
          <Link to="/dashboard" className="home-link">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // 如果没有题目，显示加载中
  if (!currentQuestion) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <h2 className="loading-text">加载题目中...</h2>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* <WalrusUpload
        policyObject={
          "0x7388618d566871ed19c1df83c480464cf71da2da36fceabe91fa3814d3fe4826"
        }
        cap_id={
          "0x4bb927a676df9af934ffb8861f340a4fa1042fb1276d061304e273e71dae62b3"
        }
        moduleName="allowlist"
      /> */}
      {/* 显示用户代币余额 */}
      {currentAccount && (
        <div className="token-balance">
          <p>
            积分余额: <strong>{userTokenBalance}</strong> POINT
          </p>
          <Button
            onClick={refreshTokenBalance}
            className="reflesh-button"
            size="sm"
          >
            刷新
          </Button>
        </div>
      )}
      <div className="quiz-progress">
        <div
          className="progress-bar"
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        ></div>
      </div>
      <div className="quiz-header">
        <p>
          问题 {currentQuestionIndex + 1} / {questions.length}
        </p>
      </div>
      <div className="quiz-question">
        <h3>{currentQuestion.question}</h3>

        <div className="quiz-options">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`quiz-option ${
                selectedOption === index ? "selected" : ""
              } 
                          ${
                            showAnswer &&
                            answerResult &&
                            isCorrectOption(
                              answerResult.correctAnswer,
                              index,
                              answerResult.correctOptionLetter
                            )
                              ? "correct"
                              : ""
                          } 
                          ${
                            showAnswer &&
                            selectedOption === index &&
                            answerResult &&
                            !answerResult.isCorrect
                              ? "incorrect"
                              : ""
                          }`}
              onClick={() => !showAnswer && handleOptionSelect(index)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
            </div>
          ))}
        </div>

        {showAnswer && answerResult && (
          <div className="answer-explanation">
            <p>{answerResult.isCorrect ? "✓ 回答正确!" : "✗ 回答错误!"}</p>
            {answerResult.correctOptionLetter && (
              <p className="correct-answer">
                正确答案：{answerResult.correctOptionLetter}
              </p>
            )}
            {answerResult.explanation && (
              <p className="explanation-text">{answerResult.explanation}</p>
            )}
          </div>
        )}

        <div className="quiz-actions">
          {selectedOption !== null && !showAnswer && (
            <Button onClick={handleCheckAnswer}>检查答案</Button>
          )}
          <Button onClick={handleViewSolution}>答案与解析</Button>
          {showAnswer && (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1
                ? "下一题"
                : "完成测验"}
            </Button>
          )}
        </div>
      </div>
      {!walrusBlobId && (
        <Button disabled style={{ color: "#000" }}>
          <Loader2 className="animate-spin" />
          正在将题目加密存储
        </Button>
      )}
      {walrusBlobId && (
        <div
          className="blob-info"
          style={{
            marginTop: "10px",
            background: "#f0f8ff",
            padding: "10px",
            borderRadius: "4px",
            width: "100%",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
            题目加密信息:
          </div>
          <p>BlobId: {walrusBlobId}</p>
          <p>难度级别: {difficulty}</p>
          <p>题目数量: {questions.length}</p>
          <p>状态: {questionsEncrypted ? "✅ 已加密存储" : "❌ 未加密"}</p>
          <a
            href={suiWalrusUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
            aria-label="View Sui object details"
          >
            Sui Object
          </a>
        </div>
      )}
      {/* 添加问题按钮，仅在开发环境显示 */}
      {/* {process.env.NODE_ENV === "development" && (
        <div
          className="admin-buttons"
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <Button
              onClick={handleAddSimpleQuestion}
              className="admin-button"
              style={{ background: "#2196F3" }}
            >
              添加简化问题（不含答案和解析）
            </Button>

            <Button
              onClick={encryptQuestionsToWalrus}
              className="admin-button"
              style={{ background: "#9c27b0" }}
              disabled={
                encryptingQuestions || !questions.length || questionsEncrypted
              }
            >
              {encryptingQuestions
                ? "加密中..."
                : questionsEncrypted
                ? "已加密存储"
                : "加密题目到Walrus"}
            </Button>
          </div>

          {walrusBlobId && (
            <div className="blob-info" style={{ marginTop: "10px", background: "#f0f8ff", padding: "10px", borderRadius: "4px", width: "100%" }}>
              <div style={{ fontWeight: "bold", marginBottom: "5px" }}>题目加密信息:</div>
              <p>BlobId: {walrusBlobId}</p>
              <p>难度级别: {difficulty}</p>
              <p>题目数量: {questions.length}</p>
              <p>状态: {questionsEncrypted ? "✅ 已加密存储" : "❌ 未加密"}</p>
            </div>
          )}
        </div>
      )} */}
    </div>
  );
};

// 辅助函数，判断选项是否为正确选项
const isCorrectOption = (
  correctAnswer: string | number,
  optionIndex: number,
  correctOptionLetter?: string
): boolean => {
  // 如果有提供correctOptionLetter，优先使用字母判断
  if (correctOptionLetter) {
    const letterIndex = correctOptionLetter.charCodeAt(0) - 65; // 'A'的ASCII码是65
    return optionIndex === letterIndex;
  }

  // 以下是原有逻辑，作为备选判断方式
  if (typeof correctAnswer === "number") {
    return optionIndex === correctAnswer;
  } else if (typeof correctAnswer === "string") {
    // 检查是否以字母前缀开头 (如 A. B. C. 等)
    if (/^[A-D]\.?\s/.test(correctAnswer)) {
      const letterIndex = correctAnswer.charCodeAt(0) - 65; // 'A' 的 ASCII 码是 65
      return optionIndex === letterIndex;
    }
    // 直接匹配内容
    const optionLetter = String.fromCharCode(65 + optionIndex);
    return (
      correctAnswer.startsWith(optionLetter) ||
      correctAnswer.toLowerCase().includes(optionLetter.toLowerCase())
    );
  }
  return false;
};

export default Quiz;
