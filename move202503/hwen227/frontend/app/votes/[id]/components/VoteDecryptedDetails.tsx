import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SessionKey } from "@mysten/seal";
import { fromHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { useUploadBlob } from "@/hooks/useUploadBlob";
import { decryptVotePool, MoveCallConstructor } from "@/contracts/seal";
import { networkConfig } from "@/contracts";
import { formatAddress } from "@/lib/utils";

interface VoteDecryptedDetailsProps {
    votePoolObjectData: SuiResponseVotePool | null;
    voteId: string;
    sessionKey: SessionKey | null;
    decryptedVotePoolData: EncryptedInputVotePool | null;
    onDecryptSuccess: (decryptedData: EncryptedInputVotePool) => void;
}

export default function VoteDecryptedDetails({
    votePoolObjectData,
    voteId,
    sessionKey,
    decryptedVotePoolData,
    onDecryptSuccess
}: VoteDecryptedDetailsProps) {
    const { downloadBlob } = useUploadBlob();
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    // 添加一个ref来跟踪是否正在解密，防止多次执行
    const isDecrypting = useRef(false);

    const constructMoveCall = (allowlistId: string): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::allowlist::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(allowlistId),
                ]
            });
        };
    };

    const handleDecryptVoteData = useCallback(async () => {
        // 防止重复执行
        if (isDecrypting.current) {
            console.log("已有解密任务在执行中，跳过");
            return;
        }

        if (!votePoolObjectData || !sessionKey) {
            console.error('Vote pool object data is null or no session key');
            setIsLoading(false);
            setHasError(true);
            return;
        }

        setIsLoading(true);
        setHasError(false);
        isDecrypting.current = true;

        console.log("正在执行中");
        try {
            if (!votePoolObjectData.allowlist_id) {
                throw new Error("无效的allowlist_id");
            }
            const moveCall = constructMoveCall(votePoolObjectData.allowlist_id);
            const downloadBytes = await votePoolObjectData.details as Uint8Array;
            const decryptedData = await decryptVotePool(sessionKey, downloadBytes, moveCall);

            if (!decryptedData) {
                throw new Error("解密数据为空，您可能没有权限查看此投票");
            }

            onDecryptSuccess(decryptedData);
            setIsLoading(false);
        } catch (error) {
            console.error('解密失败:', error);
            setHasError(true);
            setIsLoading(false);
        } finally {
            isDecrypting.current = false;
        }
    }, [downloadBlob, onDecryptSuccess, sessionKey, voteId, votePoolObjectData]);

    // 组件加载或依赖项变化时自动执行解密，使用更精确的条件防止重复执行
    useEffect(() => {
        if (
            sessionKey &&
            votePoolObjectData &&
            !decryptedVotePoolData &&
            !isDecrypting.current &&
            !hasError
        ) {
            console.log("开始解密流程");
            handleDecryptVoteData();
        } else if (!sessionKey || !votePoolObjectData) {
            setIsLoading(false);
        }
    }, [sessionKey, votePoolObjectData, decryptedVotePoolData, handleDecryptVoteData, hasError]);

    // 如果尚未解密且正在加载，显示加载状态
    if (isLoading && !decryptedVotePoolData) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg mb-8">
                <div className="mb-4">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-200 border-l-blue-200 border-r-blue-200 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600">正在获取访问权限...</p>
            </div>
        );
    }

    // 如果尚未解密且发生错误，显示重试按钮
    if (!decryptedVotePoolData && hasError) {
        return (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                <p className="text-gray-600 mb-4">解密失败，您可能没有权限查看此投票</p>
                <Button
                    onClick={handleDecryptVoteData}
                    disabled={isLoading || isDecrypting.current}
                >
                    {isLoading ? '处理中...' : '重新解密'}
                </Button>
            </div>
        );
    }

    // 如果尚未解密但无错误和非加载状态，可能是等待sessionKey
    if (!decryptedVotePoolData) {
        return (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                <p className="text-gray-600 mb-4">等待解密...</p>
            </div>
        );
    }

    // 已解密，显示详细信息
    return (
        <div className="mb-8">
            <p className="text-gray-700 mb-4">{decryptedVotePoolData.description}</p>

            <div className="text-sm text-gray-500 space-y-1 mb-6">
                <div><i className="fas fa-user mr-2"></i> 创建者: {formatAddress(votePoolObjectData?.creator || '')}</div>
                <div><i className="fas fa-users mr-2"></i> 已有 {votePoolObjectData?.participantsCount || 0} 人参与</div>
                <div><i className="fas fa-link mr-2"></i> Object ID: {voteId}</div>
            </div>
        </div>
    );
} 