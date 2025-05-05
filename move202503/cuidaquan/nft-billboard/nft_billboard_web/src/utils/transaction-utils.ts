import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { message } from 'antd';
import { SuiClient } from '@mysten/sui/client';

/**
 * 执行钱包交易并处理各种状态
 * @param signAndExecute - 来自useSignAndExecuteTransaction的mutate函数
 * @param transaction - 要执行的交易对象
 * @param options - 交易选项
 * @returns 交易结果
 */
export const executeWalletTransaction = async (
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>['mutate'],
  transaction: Transaction,
  options: {
    loadingMessage: string;
    successMessage: string;
    loadingKey: string;
    successKey: string;
    userRejectedMessage: string;
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
    onUserRejected?: () => void;
  }
) => {
  const {
    loadingMessage,
    successMessage,
    loadingKey,
    successKey,
    userRejectedMessage,
    onSuccess,
    onError,
    onUserRejected
  } = options;

  // 显示加载消息
  message.loading({
    content: loadingMessage,
    key: loadingKey,
    duration: 0
  });

  try {
    // 执行交易并等待结果
    const result = await new Promise((resolve, reject) => {
      signAndExecute(
        {
          transaction
        },
        {
          onSuccess: (data) => {
            console.log('交易签名成功:', data);
            resolve(data);
          },
          onError: (error) => {
            console.error('交易签名失败:', error);
            // 检查是否是用户拒绝交易
            if (isUserRejectedError(error)) {
              reject(new Error('用户拒绝交易'));
            } else {
              reject(error);
            }
          }
        }
      );
    });

    // 交易成功
    console.log('交易执行成功:', result);
    
    // 显示成功消息
    message.success({
      content: successMessage,
      key: successKey,
      duration: 2
    });

    // 调用成功回调
    if (onSuccess) {
      onSuccess(result);
    }

    return { success: true, result };
  } catch (error) {
    console.error('交易执行失败:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // 检查是否是用户拒绝交易
    if (errorMsg.includes('用户拒绝交易')) {
      message.info({
        content: userRejectedMessage,
        key: loadingKey,
        duration: 2
      });
      
      // 调用用户拒绝回调
      if (onUserRejected) {
        onUserRejected();
      }
    } else {
      // 其他错误
      message.error({
        content: errorMsg,
        key: loadingKey,
        duration: 2
      });
      
      // 调用错误回调
      if (onError) {
        onError(error);
      }
    }

    return { success: false, error };
  }
};

/**
 * 检查交易是否被用户拒绝
 * @param error - 错误对象
 * @returns 是否被用户拒绝
 */
export const isUserRejectedError = (error: any): boolean => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  return (
    errorMsg.includes('User rejected') || 
    errorMsg.includes('User cancelled') || 
    errorMsg.includes('User denied') ||
    errorMsg.includes('用户拒绝') ||
    errorMsg.includes('用户取消')
  );
};

/**
 * 等待交易确认
 * @param suiClient - Sui客户端
 * @param transactionId - 交易ID
 * @param maxAttempts - 最大尝试次数
 * @returns 是否确认成功
 */
export const waitForTransactionConfirmation = async (
  suiClient: SuiClient,
  transactionId: string,
  maxAttempts: number = 3
): Promise<boolean> => {
  let attempts = 0;
  let success = false;

  while (attempts < maxAttempts && !success) {
    attempts++;
    // 等待时间随尝试次数增加
    const delay = 2000 * attempts;
    console.log(`等待交易确认，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

    // 等待一段时间再获取数据，确保链上数据已更新
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // 从区块链获取交易状态
      const txStatus = await suiClient.getTransactionBlock({
        digest: transactionId,
        options: {
          showEffects: true,
          showInput: true,
          showEvents: true,
        }
      });

      // 检查交易状态
      if (txStatus && txStatus.effects?.status?.status === 'success') {
        success = true;
        console.log('交易确认成功');
      } else {
        console.log('交易尚未确认，状态:', txStatus?.effects?.status);
      }
    } catch (error) {
      console.error(`尝试第 ${attempts} 次获取交易状态失败:`, error);
    }
  }

  return success;
};
