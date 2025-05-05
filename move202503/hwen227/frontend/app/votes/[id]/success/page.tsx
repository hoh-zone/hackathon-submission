"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function VoteSuccessPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;

    // 模拟投票数据
    const MOCK_VOTE = {
        id: voteId,
        title: "社区资金分配提案",
    };

    const handleViewResults = () => {
        router.push(`/votes/${voteId}/result`);
    };

    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
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
                <h1 className="text-xl font-medium">投票提交成功</h1>
            </div>

            <div className="flex flex-col items-center text-center my-8">
                <div className="bg-green-50 text-green-500 rounded-full p-6 mb-6">
                    <CheckCircle2 className="w-16 h-16" />
                </div>
                <h2 className="text-xl font-semibold mb-3">您的投票已成功提交！</h2>
                <p className="text-gray-600 mb-6 max-w-lg">
                    感谢您参与「{MOCK_VOTE.title}」的投票。您的选择已经被加密存储，并且将在投票结束后与其他参与者的选择一同公布。
                </p>
            </div>

            <Card className="bg-indigo-50 mb-8">
                <CardContent className="pt-6">
                    <div className="flex">
                        <i className="fas fa-info-circle text-primary mr-3 mt-1"></i>
                        <div>
                            <div className="font-medium text-sm mb-1">验证您的投票</div>
                            <div className="text-sm text-gray-600">
                                交易哈希: <span className="text-primary">0x7a93b2f...e4d1</span>
                                <button className="text-xs ml-2 text-primary hover:underline">
                                    <i className="fas fa-copy"></i> 复制
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                您可以通过此哈希值在Sui浏览器中查看交易详情
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                    variant="outline"
                    asChild
                    className="flex-1 sm:flex-none"
                >
                    <Link href="/">
                        <i className="fas fa-home mr-2"></i> 返回首页
                    </Link>
                </Button>
                <Button
                    onClick={handleViewResults}
                    className="flex-1 sm:flex-none"
                >
                    <i className="fas fa-chart-bar mr-2"></i> 查看实时结果
                </Button>
            </div>
        </div>
    );
}
