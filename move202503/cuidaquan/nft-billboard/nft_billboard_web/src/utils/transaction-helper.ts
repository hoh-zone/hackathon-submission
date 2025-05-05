import { SuiClient } from '@mysten/sui/client';

/**
 * 处理交易错误，提取错误信息
 */
export function handleTransactionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  // 尝试从错误对象中提取有用信息
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }
  
  return '未知错误';
}

/**
 * 从交易响应中提取交易ID
 */
export function getTransactionId(txResponse: any): string | null {
  if (!txResponse) return null;
  
  // 从不同位置尝试获取交易ID
  if (typeof txResponse === 'string') {
    return txResponse;
  }
  
  if (typeof txResponse === 'object') {
    if (txResponse.digest) {
      return txResponse.digest;
    }
    if (txResponse.effects && txResponse.effects.transactionDigest) {
      return txResponse.effects.transactionDigest;
    }
    if (txResponse.hash) {
      return txResponse.hash;
    }
  }
  
  return null;
}

/**
 * 等待交易确认
 */
export async function waitForTransactionConfirmation(
  suiClient: SuiClient,
  digest: string,
  maxAttempts = 5
): Promise<boolean> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const txData = await suiClient.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      
      if (txData) {
        return true;
      }
    } catch (error) {
      console.warn('等待交易确认时出错:', error);
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false;
}

/**
 * 交易状态类型
 */
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * 检查交易是否成功
 */
export function isTransactionSuccessful(txResponse: any): boolean {
  if (!txResponse) return false;
  
  // 直接从响应状态判断成功与否
  if (txResponse.status === 'success') {
    return true;
  }
  
  // 检查交易效果
  if (txResponse.effects && txResponse.effects.status) {
    return txResponse.effects.status.status === 'success';
  }
  
  // 检查是否包含错误
  if (txResponse.error) {
    return false;
  }
  
  // 默认情况下，如果有交易ID，则认为成功
  return !!getTransactionId(txResponse);
} 