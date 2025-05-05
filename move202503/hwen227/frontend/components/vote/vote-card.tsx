"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VotePoolDisplayType, VoteStatus } from "@/types";

// 投票卡片属性
interface VoteCardProps {
    vote: VotePoolDisplayType;
}

export function VoteCard({ vote }: VoteCardProps) {
    // 根据状态获取徽章样式
    const getBadgeVariant = (status: VoteStatus) => {
        switch (status) {
            case VoteStatus.ACTIVE:
                return "success";
            case VoteStatus.UPCOMING:
                return "warning";
            case VoteStatus.ENDED:
                return "destructive";
            default:
                return "outline";
        }
    };

    // 根据状态获取状态文本
    const getStatusText = (status: VoteStatus) => {
        switch (status) {
            case VoteStatus.ACTIVE:
                return "进行中";
            case VoteStatus.UPCOMING:
                return "即将开始";
            case VoteStatus.ENDED:
                return "已结束";
            default:
                return "未知状态";
        }
    };

    // 根据状态获取按钮文本和样式
    const getButtonProps = (status: VoteStatus) => {
        switch (status) {
            case VoteStatus.ACTIVE:
                return {
                    text: "参与投票",
                    icon: "vote-yea",
                    variant: "default" as const
                };
            case VoteStatus.UPCOMING:
                return {
                    text: "查看详情",
                    icon: "clock",
                    variant: "outline" as const
                };
            case VoteStatus.ENDED:
                return {
                    text: "查看结果",
                    icon: "chart-bar",
                    variant: "outline" as const
                };
            default:
                return {
                    text: "查看详情",
                    icon: "info-circle",
                    variant: "outline" as const
                };
        }
    };

    // 获取图标
    const getIcon = (iconType: string = "chart-pie") => {
        return iconType;
    };

    const buttonProps = getButtonProps(vote.status);
    const badgeVariant = getBadgeVariant(vote.status);
    const statusText = getStatusText(vote.status);
    const icon = getIcon(vote.iconType);

    // 构建链接地址
    const getLinkHref = () => {
        if (vote.status === VoteStatus.ENDED) {
            return `/votes/${vote.id}/result`;
        }
        return `/votes/${vote.id}`;
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm relative p-4">
            <div className="absolute top-3 right-3">
                <Badge variant={badgeVariant}>{statusText}</Badge>
            </div>

            <div className="text-center mb-4 mt-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <i className={`fas fa-${icon} text-primary text-lg`}></i>
                </div>
                <h3 className="font-medium text-base mb-1">{vote.title}</h3>
                <div className="text-xs text-gray-500">
                    <i className="fas fa-users mr-1"></i> {vote.participantsCount}人参与
                </div>
            </div>


            <Link href={getLinkHref()} passHref>
                <Button
                    variant={buttonProps.variant}
                    className="w-full"
                >
                    <i className={`fas fa-${buttonProps.icon} mr-2`}></i> {buttonProps.text}
                </Button>
            </Link>
        </div>
    );
} 