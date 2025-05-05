import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SessionKey } from "@mysten/seal";
import { fromHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { useUploadBlob } from "@/hooks/useUploadBlob";
import { decryptVotePool, MoveCallConstructor } from "@/contracts/seal";
import { networkConfig } from "@/contracts";

// 创建简易toast通知组件
const showToast = (type: 'error' | 'success', message: string) => {
    alert(`${type === 'error' ? '错误' : '成功'}: ${message}`);
    console[type === 'error' ? 'error' : 'log'](message);
};

interface VoteDetailsProps {
    votePoolObjectData: SuiResponseVotePool | null;
    voteId: string;
    sessionKey: SessionKey;
    onDecryptSuccess: (decryptedData: EncryptedInputVotePool) => void;
}

export default function DecryptButton({ votePoolObjectData, voteId, sessionKey, onDecryptSuccess }: VoteDetailsProps) {
    const { downloadBlob } = useUploadBlob();
    const [isLoading, setIsLoading] = useState(false);

    const constructMoveCall = (allowlistId: string, voteId: string): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::allowlist::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(allowlistId),
                    tx.object(voteId)
                ]
            });
        };
    };

    const handleDecryptVoteData = async () => {
        if (!votePoolObjectData) {
            console.error('Vote pool object data is null');
            return;
        }

        setIsLoading(true);

        try {
            const moveCall = constructMoveCall(votePoolObjectData.allowlist_id, voteId);
            const downloadBytes = await downloadBlob(votePoolObjectData.blob_id);
            const decryptedData = await decryptVotePool(sessionKey, downloadBytes, moveCall);

            if (!decryptedData) {
                throw new Error("解密数据为空，您可能没有权限查看此投票");
            }

            onDecryptSuccess(decryptedData);
            setIsLoading(false);
        } catch (error) {
            console.error('解密失败:', error);
            showToast('error', '解密失败');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
            <p className="text-gray-600 mb-4">请解密投票详情</p>
            <Button
                onClick={handleDecryptVoteData}
                disabled={isLoading}
            >
                {isLoading ? '处理中...' : '解密投票详情'}
            </Button>
        </div>
    );
} 