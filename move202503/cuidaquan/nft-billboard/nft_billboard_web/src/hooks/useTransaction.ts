import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { message } from 'antd';
import { 
  getTransactionId, 
  handleTransactionError, 
  waitForTransactionConfirmation 
} from '../utils/transaction-helper';
import { SuiClient } from '@mysten/sui/client';

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseTransactionOptions {
  onSuccess?: (txId: string) => void;
  onError?: (error: unknown) => void;
  successMessage?: string;
  loadingMessage?: string;
  successMessageKey?: string;
  loadingMessageKey?: string;
  waitForConfirmation?: boolean;
  // 是否自动清除消息
  autoDismissMessage?: boolean;
}

/**
 * 交易处理钩子
 * 简化交易创建、执行和状态管理
 */
export function useTransaction(suiClient?: SuiClient, options?: UseTransactionOptions) {
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const {
    onSuccess,
    onError,
    successMessage = '交易成功',
    loadingMessage = '正在处理交易...',
    successMessageKey = 'tx_success',
    loadingMessageKey = 'tx_loading',
    waitForConfirmation = false,
    autoDismissMessage = true
  } = options || {};
  
  // 执行交易
  const executeTransaction = async (
    transaction: Transaction,
    localOptions?: Partial<UseTransactionOptions>
  ) => {
    const finalOptions = { ...options, ...localOptions };
    
    try {
      setStatus('pending');
      setError(null);
      
      // 显示加载消息
      const loadingKey = finalOptions.loadingMessageKey || loadingMessageKey;
      message.loading({
        content: finalOptions.loadingMessage || loadingMessage,
        key: loadingKey,
        duration: 0
      });
      
      // 执行交易
      const result = await signAndExecute({
        transaction
      });
      
      // 从结果中获取交易ID
      const transactionId = getTransactionId(result);
      setTxId(transactionId);
      
      if (!transactionId) {
        throw new Error('无法获取交易ID');
      }
      
      // 可选：等待交易确认
      if (waitForConfirmation && suiClient) {
        const confirmed = await waitForTransactionConfirmation(
          suiClient,
          transactionId
        );
        
        if (!confirmed) {
          console.warn('交易已提交但未能确认', transactionId);
        }
      }
      
      // 设置成功状态
      setStatus('success');
      
      // 显示成功消息
      const successKey = finalOptions.successMessageKey || successMessageKey;
      message.success({
        content: finalOptions.successMessage || successMessage,
        key: successKey,
        duration: autoDismissMessage ? 2 : 0
      });
      
      // 调用成功回调
      if (finalOptions.onSuccess) {
        finalOptions.onSuccess(transactionId);
      }
      
      return { txId: transactionId, success: true };
    } catch (err) {
      setStatus('error');
      
      // 提取错误信息
      const errorMessage = handleTransactionError(err);
      setError(errorMessage);
      
      // 显示错误消息
      message.error(errorMessage);
      
      // 调用错误回调
      if (finalOptions.onError) {
        finalOptions.onError(err);
      }
      
      console.error('交易执行失败:', err);
      return { txId: null, success: false, error: errorMessage };
    }
  };
  
  // 重置状态
  const reset = () => {
    setStatus('idle');
    setError(null);
    setTxId(null);
  };
  
  return {
    executeTransaction,
    status,
    error,
    txId,
    reset,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
} 