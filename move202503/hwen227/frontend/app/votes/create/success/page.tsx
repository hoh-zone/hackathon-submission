"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { VoteCreateSuccessType } from "@/types";

// Sui相关URL配置
const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`;      // Sui交易查看URL
const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`; // Sui对象查看URL

export default function VoteCreateSuccessPage() {
    const [copied, setCopied] = useState(false);
    const [copyVoteId, setCopyVoteId] = useState(false);
    const [copyVoteBoxId, setCopyVoteBoxId] = useState(false);
    const [voteData, setVoteData] = useState<VoteCreateSuccessType | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        // 从URL查询参数中获取投票创建成功的数据
        const voteId = searchParams.get("voteId");
        const digest = searchParams.get("digest");

        if (voteId && digest) {
            setVoteData({
                voteId,
                digest
            });
        }
    }, [searchParams]);


    // 添加默认值避免null错误
    const displayData = voteData || {
        voteId: "0x123456789abcdef",
        digest: "0x123456789abcdef"
    };


    const voteUrl = `${SUI_VIEW_OBJECT_URL}/${displayData.voteId}`;
    const digestUrl = `${SUI_VIEW_TX_URL}/${displayData.digest}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(voteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };



    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-check text-green-500 text-2xl"></i>
                </div>
                <h1 className="text-2xl font-semibold mb-2">投票创建成功！</h1>
                <p className="text-gray-600 mb-8">您的匿名投票已成功创建并部署到区块链</p>

                <Card className="bg-gray-50 mb-6 text-left">
                    <CardContent className="pt-6">

                        <div className="mb-6">
                            <div className="text-sm font-medium mb-2">投票链接:</div>
                            <div className="flex mb-2">
                                <Input
                                    value={`localhost:3000/votes/${displayData.voteId}`}
                                    readOnly
                                    className="mr-2 bg-white"
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="min-w-[40px] px-3"
                                >
                                    {copied ? (
                                        <i className="fas fa-check text-green-500"></i>
                                    ) : (
                                        <i className="fas fa-copy"></i>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">分享此链接给您想邀请参与投票的人</p>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2">区块链信息:</div>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-600 mr-2">投票对象ID:</span>
                                        <a
                                            href={voteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {displayData.voteId.slice(0, 8)}...{displayData.voteId.slice(-6)}
                                            <i className="fas fa-external-link-alt text-xs ml-1"></i>
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 mr-2">Digest:</span>
                                    <a
                                        href={digestUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        {displayData.digest.slice(0, 8)}...{displayData.digest.slice(-6)}
                                        <i className="fas fa-external-link-alt text-xs ml-1"></i>
                                    </a>
                                </div>

                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <Button variant="outline" asChild className="flex-1 sm:flex-auto">
                        <Link href="/">
                            <i className="fas fa-home mr-2"></i> 返回首页
                        </Link>
                    </Button>
                    <Button asChild className="flex-1 sm:flex-auto">
                        <Link href={`/votes/${displayData.voteId}`}>
                            <i className="fas fa-share-alt mr-2"></i> 查看投票
                        </Link>
                    </Button>
                </div>
            </div>
        </div >
    );
} 