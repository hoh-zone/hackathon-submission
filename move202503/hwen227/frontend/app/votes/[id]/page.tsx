"use client";

import { useState, use, useEffect, useCallback } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getVotePoolById } from "@/contracts/query";
import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { SessionKey } from "@mysten/seal";
import { networkConfig } from "@/contracts";
import VoteDecryptedDetails from "./components/VoteDecryptedDetails";
import PublicVoteDetails from "./components/PublicVoteDetails";
import VoteCast from "./components/VoteCast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getRemainingTime } from "@/lib/utils";
import { castVoteTx_woal } from "@/contracts/transaction";

export default function VoteDetailPage({ params }: { params: { id: string } }) {
    const [votePoolObjectData, setVotePoolObjectData] = useState<SuiResponseVotePool | null>(null);
    const [decryptedVotePoolData, setDecryptedVotePoolData] = useState<EncryptedInputVotePool | null>(null);
    const [voteNotFound, setVoteNotFound] = useState(false);
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
    const [isSigningMessage, setIsSigningMessage] = useState(false);
    const [detail, setDetail] = useState<EncryptedInputVotePool | null>(null)
    const [isAllowlist, setIsAllowlist] = useState(true);

    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;
    const currentAccount = useCurrentAccount();
    const { mutate: signPersonalMessage } = useSignPersonalMessage();

    const fetchVoteData = useCallback(async () => {
        try {
            const [suiVotePoolData, is_allowlist] = await getVotePoolById(voteId);

            if (!suiVotePoolData) {
                setVoteNotFound(true);
            }
            setVotePoolObjectData(suiVotePoolData);
            setIsAllowlist(is_allowlist);
        } catch (error) {
            console.error("Error fetching vote data:", error);
            setVoteNotFound(true);
        }
    }, [voteId]);

    const handleDecryptSuccess = (decryptedData: EncryptedInputVotePool) => {
        setDecryptedVotePoolData(decryptedData);
    };

    const signSessionKey = useCallback(async () => {
        if (!currentAccount) {
            return;
        }

        setIsSigningMessage(true);

        try {
            const sessionKey = new SessionKey({
                address: currentAccount.address,
                packageId: networkConfig.testnet.variables.packageID,
                ttlMin: 10
            });

            signPersonalMessage(
                {
                    message: sessionKey.getPersonalMessage(),
                },
                {
                    onSuccess: async (result: { signature: string }) => {
                        await sessionKey.setPersonalMessageSignature(result.signature);
                        setCurrentSessionKey(sessionKey);
                        setIsSigningMessage(false);
                    },
                    onError: (error) => {
                        console.error('签名失败:', error);
                        setIsSigningMessage(false);
                    }
                }
            );
        } catch (error) {
            console.error('签名失败:', error);
            setIsSigningMessage(false);
        }
    }, [currentAccount, signPersonalMessage]);

    useEffect(() => {
        fetchVoteData();
        // 当账户变化时重置状态
        if (!isAllowlist && votePoolObjectData && typeof votePoolObjectData.details === 'string') {
            // 无需处理，PublicVoteDetails组件内部会解析details
            setDetail(JSON.parse(votePoolObjectData.details as string));
        }
        setCurrentSessionKey(null);
        setDecryptedVotePoolData(null);
    }, [currentAccount, fetchVoteData]);

    if (!currentAccount) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="mt-4 text-lg">请先连接钱包后继续操作</p>
            </div>
        );
    }

    if (voteNotFound) {
        return (
            <div className="container max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center mb-6">
                    <h1 className="text-xl font-medium">投票详情</h1>
                </div>
                <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-xl text-gray-600 mb-4">抱歉，该投票池不存在</p>
                </div>
            </div>
        );
    }

    // 检查sessionKey是否有效
    const isSessionKeyValid = currentSessionKey &&
        !currentSessionKey.isExpired() &&
        currentSessionKey.getAddress() === currentAccount.address;

    return (
        <div className="container max-w-3xl mx-auto px-4 py-8">

            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="mr-4"
                    asChild
                >
                    <Link href="/">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </Button>
                <h1 className="text-xl font-medium">投票详情</h1>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">{votePoolObjectData?.title}</h2>
                <div className="flex items-center mb-4">
                    <Badge variant="success" className="mr-3">进行中</Badge>
                    <span className="text-sm text-gray-500">
                        <i className="fas fa-clock mr-1"></i> {votePoolObjectData?.end ? getRemainingTime(votePoolObjectData.end) : ''}
                    </span>
                </div>

                {/* 根据投票类型决定显示哪种组件 */}
                {isAllowlist ? (
                    // 需要验证的投票
                    <>
                        {isSessionKeyValid && votePoolObjectData && (
                            <VoteDecryptedDetails
                                votePoolObjectData={votePoolObjectData}
                                voteId={voteId}
                                sessionKey={currentSessionKey}
                                decryptedVotePoolData={decryptedVotePoolData}
                                onDecryptSuccess={handleDecryptSuccess}
                            />
                        )}

                        {/* 如果没有有效的会话密钥，显示签名按钮 */}
                        {!isSessionKeyValid && (
                            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                                <p className="text-gray-600 mb-4">该投票需验证身份，请签名以查看投票详情</p>
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    onClick={signSessionKey}
                                    disabled={isSigningMessage}>
                                    {isSigningMessage ? '签名中...' : '签名'}
                                </button>
                            </div>
                        )}

                        {/* 投票选择部分，只在已解密时显示 */}
                        {decryptedVotePoolData && (
                            <VoteCast
                                voteId={voteId}
                                voteBoxId={votePoolObjectData?.votebox_id || ''}
                                decryptedVotePoolData={decryptedVotePoolData}
                                customCastVoteTx={castVoteTx_woal}
                            />
                        )}
                    </>
                ) : (
                    // 公开投票，不需要验证
                    <>
                        <PublicVoteDetails
                            votePoolObjectData={votePoolObjectData}
                            voteId={voteId}
                        />

                        {detail && (
                            <VoteCast
                                voteId={voteId}
                                voteBoxId={votePoolObjectData?.votebox_id || ''}
                                decryptedVotePoolData={detail}
                                customCastVoteTx={castVoteTx_woal}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
} 