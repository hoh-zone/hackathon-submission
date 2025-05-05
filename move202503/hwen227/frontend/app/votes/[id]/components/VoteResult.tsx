"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";

import { queryVoteBox } from "@/contracts/query";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SuiResponseVotePool, VoteOption } from "@/types";
import { MoveCallConstructor, test_decrptedVoteBox } from "@/contracts/seal";
import { SessionKey } from "@mysten/seal";
import { networkConfig } from "@/contracts";
import { fromHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

interface VoteResultProps {
    votePool: SuiResponseVotePool;
    options: VoteOption[];
    sessionKey: SessionKey;
}

export default function VoteResult({ votePool, options, sessionKey }: VoteResultProps) {
    const [decryptedVoteResults, setDecryptedVoteResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDecrypted, setIsDecrypted] = useState(false);
    // 添加ref来跟踪解密状态，防止重复执行
    const isDecrypting = useRef(false);

    const currentAccount = useCurrentAccount();

    const constructMoveCall = (voteboxId: string, end: number): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::votebox::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(voteboxId),
                    tx.pure.u64(end),
                    tx.object('0x6')
                ]
            })
        }
    }

    // 定义解密函数
    const downloadAndDecryptVoteData = useCallback(async () => {
        // 防止重复执行
        if (isDecrypting.current) {
            console.log("已有解密任务在执行中，跳过");
            return;
        }

        if (!votePool || !currentAccount || !sessionKey) {
            console.error('Vote pool object data is null, user not connected, or no session key');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        isDecrypting.current = true;

        try {
            console.log("开始解密投票结果");
            // 使用提供的会话密钥
            const moveCall = constructMoveCall(votePool.votebox_id, votePool.end);
            const encryptedVoteBoxData = await queryVoteBox(votePool.votebox_id);
            const results = await test_decrptedVoteBox(sessionKey, encryptedVoteBoxData, moveCall);

            if (results && results.length > 0) {
                setDecryptedVoteResults(results);
                setIsDecrypted(true);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('解密失败:', error);
            setIsLoading(false);
        } finally {
            isDecrypting.current = false;
        }
    }, [currentAccount, sessionKey, votePool]);

    // 当组件加载或依赖项变化时自动执行解密
    useEffect(() => {
        if (
            currentAccount &&
            sessionKey &&
            !isDecrypted &&
            !isDecrypting.current
        ) {
            console.log("触发解密流程");
            downloadAndDecryptVoteData();
        }
    }, [currentAccount, downloadAndDecryptVoteData, sessionKey, isDecrypted]);

    useEffect(() => {
        // 当账户切换时，重置所有相关状态
        setDecryptedVoteResults([]);
        setIsLoading(true);
        setIsDecrypted(false);
    }, [currentAccount]);

    if (!currentAccount) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="mt-4 text-lg">请先连接钱包后继续操作</p>
            </div>
        );
    }

    // 计算每个选项的投票数
    const calculateVoteCounts = () => {
        const voteCounts = new Map<string, number>();

        // 初始化所有选项的计数为0
        options.forEach(option => {
            voteCounts.set(option.id, 0);
        });

        // 统计每个选项的投票数
        decryptedVoteResults.forEach(voteIndex => {
            // voteIndex是选项的索引，我们需要找到对应的选项
            // 根据选项id的格式 xxx_n 查找索引n匹配的选项
            const matchedOption = options.find(opt => {
                return opt.id === voteIndex;
            });

            if (matchedOption) {
                const currentCount = voteCounts.get(matchedOption.id) || 0;
                voteCounts.set(matchedOption.id, currentCount + 1);
            }
        });

        // 将投票数附加到选项上
        return options.map(option => ({
            ...option,
            voteCount: voteCounts.get(option.id) || 0
        }));
    };

    const optionsWithVotes = isDecrypted ? calculateVoteCounts() : [];
    const totalVotes = decryptedVoteResults.length;

    return (
        <div className="container max-w-3xl mx-auto px-4 py-8">

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                    <div className="mb-4">
                        <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-200 border-l-blue-200 border-r-blue-200 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-600">正在加载投票结果...</p>
                </div>
            ) : !isDecrypted ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
                    <p className="text-gray-600 mb-4">解密失败，您暂无权限查看投票结果</p>
                    <Button
                        onClick={downloadAndDecryptVoteData}
                        disabled={isLoading || isDecrypting.current}
                    >
                        {isLoading ? '处理中...' : '重新解密'}
                    </Button>
                </div>
            ) : (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">投票结果 ({totalVotes} 票)</h3>
                    <div className="space-y-4">
                        {optionsWithVotes.map((option) => {
                            const percentage = totalVotes > 0 ? Math.round((option.voteCount! / totalVotes) * 100) : 0;

                            return (
                                <div key={option.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{option.text}</span>
                                        <span className="text-sm text-gray-500">{option.voteCount} 票 ({percentage}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}