import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { encryptUserVote } from "@/contracts/seal";
import { castVoteTx as defaultCastVoteTx } from "@/contracts/transaction";
import { suiClient } from "@/contracts";
import { EncryptedInputVotePool } from "@/types";
import { Transaction } from "@mysten/sui/transactions";

// 创建简易toast通知组件
const showToast = (type: 'error' | 'success', message: string) => {
    alert(`${type === 'error' ? '错误' : '成功'}: ${message}`);
    console[type === 'error' ? 'error' : 'log'](message);
};

interface VoteCastProps {
    voteId: string;
    voteBoxId: string;
    decryptedVotePoolData: EncryptedInputVotePool;
    customCastVoteTx?: (votePoolId: string, votebox: string, vote: Uint8Array) => Promise<Transaction>;
}

export default function VoteCast({
    voteId,
    voteBoxId,
    decryptedVotePoolData,
    customCastVoteTx
}: VoteCastProps) {
    const [selectedOption, setSelectedOption] = useState<string>("");

    const { mutate: signAndExecute } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await suiClient.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showRawEffects: true,
                    showEffects: true,
                },
            }),
    });

    const handleSubmitVote = async () => {
        if (!selectedOption) {
            showToast('error', '请选择一个选项');
            return;
        }

        try {
            const encryptedVote = await encryptUserVote(selectedOption, voteBoxId);

            if (voteBoxId) {
                // 使用自定义的castVoteTx函数或默认的castVoteTx函数
                const castVoteTxFunc = customCastVoteTx || defaultCastVoteTx;
                const tx = await castVoteTxFunc(voteId, voteBoxId, encryptedVote);

                signAndExecute({
                    transaction: tx.serialize(),
                }, {
                    onSuccess: (result) => {
                        console.log('交易成功:', result);
                        showToast('success', '投票成功!');
                        // router.push(`/votes/${voteId}/submit?option=${selectedOption}`);
                    },
                    onError: (error) => {
                        console.error('交易失败:', error);
                        showToast('error', '交易失败: ' + error.message);
                    },
                });
            } else {
                showToast('error', '投票箱ID不存在');
            }
        } catch (error) {
            console.error('提交投票失败:', error);
            showToast('error', '提交投票失败');
        }
    };

    return (
        <>
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">请选择您支持的选项:</h3>

                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    <div className="space-y-3">
                        {(decryptedVotePoolData?.options || []).map((option) => {
                            const optionId = option.id;
                            return (
                                <div
                                    key={optionId}
                                    className="flex items-start space-x-2 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedOption(optionId)}
                                >
                                    <RadioGroupItem
                                        value={optionId}
                                        id={optionId}
                                        className="mt-1"
                                    />
                                    <Label
                                        htmlFor={optionId}
                                        className="flex-1 cursor-pointer"
                                    >
                                        {option.text}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                </RadioGroup>
            </div>

            <div className="flex justify-center">
                <Button
                    onClick={handleSubmitVote}
                    disabled={!selectedOption}
                    className="w-full md:w-auto"
                >
                    <i className="fas fa-paper-plane mr-2"></i> 提交投票
                </Button>
            </div>
        </>
    );
} 