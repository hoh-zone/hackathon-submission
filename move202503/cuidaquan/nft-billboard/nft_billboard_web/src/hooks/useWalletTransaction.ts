import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useTranslation } from 'react-i18next';
import { executeWalletTransaction, waitForTransactionConfirmation } from '../utils/transaction-utils';
import { useState } from 'react';

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error' | 'rejected';

/**
 * 钱包交易钩子，用于处理钱包交易的签名和执行
 */
export const useWalletTransaction = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { t } = useTranslation();
  const suiClient = useSuiClient();
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  /**
   * 执行钱包交易
   * @param transaction - 要执行的交易对象
   * @param options - 交易选项
   * @returns 交易结果
   */
  const executeTransaction = async (
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
      waitForConfirmation?: boolean;
      maxConfirmationAttempts?: number;
      onConfirmationSuccess?: (result: any) => void;
      onConfirmationFailure?: () => void;
    }
  ) => {
    setStatus('pending');
    setError(null);

    const result = await executeWalletTransaction(signAndExecute, transaction, {
      ...options,
      onSuccess: async (result) => {
        setStatus('success');
        setTxId(result.digest || null);

        // 如果需要等待确认
        if (options.waitForConfirmation && suiClient) {
          const txId = result.digest;
          if (txId) {
            const confirmed = await waitForTransactionConfirmation(
              suiClient,
              txId,
              options.maxConfirmationAttempts || 3
            );

            if (confirmed) {
              if (options.onConfirmationSuccess) {
                options.onConfirmationSuccess(result);
              }
            } else {
              if (options.onConfirmationFailure) {
                options.onConfirmationFailure();
              }
            }
          }
        }

        if (options.onSuccess) {
          options.onSuccess(result);
        }
      },
      onError: (error) => {
        setStatus('error');
        setError(error instanceof Error ? error.message : String(error));

        if (options.onError) {
          options.onError(error);
        }
      },
      onUserRejected: () => {
        setStatus('rejected');
        setError('用户拒绝交易');

        if (options.onUserRejected) {
          options.onUserRejected();
        }
      }
    });

    return result;
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
    isError: status === 'error',
    isRejected: status === 'rejected'
  };
};
