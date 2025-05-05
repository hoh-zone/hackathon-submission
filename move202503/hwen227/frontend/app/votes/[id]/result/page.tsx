"use client";

import VoteResult from "@/app/votes/[id]/components/VoteResult";
import { useState, use, useEffect, useCallback } from "react";
import { EncryptedInputVotePool } from "@/types";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getVotePoolById } from "@/contracts/query";
import { SuiResponseVotePool } from "@/types";
import { SessionKey } from "@mysten/seal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { networkConfig } from "@/contracts";
import { getRemainingTime } from "@/lib/utils";
import Link from "next/link";
import VoteDecryptedDetails from "../components/VoteDecryptedDetails";
import PublicVoteDetails from "../components/PublicVoteDetails";

export default function VoteResultPage({ params }: { params: { id: string } }) {

    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;
    const currentAccount = useCurrentAccount();
    const [voteNotFound, setVoteNotFound] = useState(false);
    const [votePoolObjectData, setVotePoolObjectData] = useState<SuiResponseVotePool | null>(null);
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
    const { mutate: signPersonalMessage } = useSignPersonalMessage();
    const [decryptedVotePoolData, setDecryptedVotePoolData] = useState<EncryptedInputVotePool | null>(null);
    const [isAllowlist, setIsAllowlist] = useState(true);

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

    const signSessionKey = useCallback(async () => {
        if (!currentAccount) {
            return;
        }

        try {
            const sessionKey = new SessionKey({
                address: currentAccount?.address || "",
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
                    },
                    onError: (error) => {
                        console.error('签名失败:', error);

                    }
                }
            );
        } catch (error) {
            console.error('签名失败:', error);
        }
    }, [currentAccount, signPersonalMessage]);

    useEffect(() => {
        fetchVoteData();
        setCurrentSessionKey(null);
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

    const handleDecryptSuccess = (decryptedData: EncryptedInputVotePool) => {
        setDecryptedVotePoolData(decryptedData);
    };

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

                {isAllowlist ? (
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


                        {isSessionKeyValid &&
                            votePoolObjectData && decryptedVotePoolData && (
                                <VoteResult
                                    votePool={votePoolObjectData}
                                    options={decryptedVotePoolData.options}
                                    sessionKey={currentSessionKey}
                                />
                            )}


                    </>
                ) : (
                    <>
                        <PublicVoteDetails
                            votePoolObjectData={votePoolObjectData}
                            voteId={voteId}
                        />

                        {isSessionKeyValid &&
                            votePoolObjectData && decryptedVotePoolData && (
                                <VoteResult
                                    votePool={votePoolObjectData}
                                    options={decryptedVotePoolData.options}
                                    sessionKey={currentSessionKey}
                                />
                            )}
                    </>
                )}

                {!isSessionKeyValid && (
                    <div className="container max-w-3xl mx-auto px-4 py-8 text-center">
                        <p className="text-gray-600 mb-4">需要签名才能查看投票结果</p>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onClick={signSessionKey}>
                            签名
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 