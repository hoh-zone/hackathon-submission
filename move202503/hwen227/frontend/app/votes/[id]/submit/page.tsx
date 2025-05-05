"use client";

//TODO： 区分状态，未开启的投票和以开启的投票

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// 模拟投票数据
const MOCK_VOTE = {
    id: "vote1",
    title: "社区资金分配提案",
    options: [
        { id: "option1", text: "方案A: 将资金重点分配给技术开发" },
        { id: "option2", text: "方案B: 将资金平均分配给各个方向" }
    ]
};

export default function VoteSubmitPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedOptionText, setSelectedOptionText] = useState<string>("");
    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;

    useEffect(() => {
        const option = searchParams.get("option");

        // 查找选项文本
        if (option) {
            const foundOption = MOCK_VOTE.options.find(o => o.id === option);
            if (foundOption) {
                setSelectedOptionText(foundOption.text);
            }
        }
    }, [searchParams]);

    const handleConfirmSubmit = () => {

        // 调用合约函数提交投票

        router.push(`/votes/${voteId}/success`);
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
                    <Link href={`/votes/${voteId}`}>
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </Button>
                <h1 className="text-xl font-medium">确认提交</h1>
            </div>

            <Card className="bg-gray-50 mb-6">
                <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">{MOCK_VOTE.title}</h3>

                    <div className="mb-6">
                        <div className="text-sm font-medium mb-2">您的选择:</div>
                        <div className="bg-indigo-50 text-primary rounded-lg p-3 border border-indigo-100">
                            {selectedOptionText}
                        </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                        <i className="fas fa-shield-alt text-primary mr-2"></i>
                        <span>您的投票将被加密存储，在投票结束前无人可见</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-amber-50 mb-8">
                <CardContent className="pt-6">
                    <div className="flex">
                        <i className="fas fa-exclamation-circle text-amber-500 mr-3 mt-1"></i>
                        <div>
                            <div className="font-medium text-sm mb-1">提交投票将消耗少量SUI代币作为燃料费</div>
                            <div className="text-xs text-gray-500">预估费用: 0.005 SUI</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                <Button
                    onClick={handleConfirmSubmit}
                    className="w-full md:w-auto"
                >
                    <i className="fas fa-check mr-2"></i> 确认提交
                </Button>
            </div>
        </div>
    );
} 