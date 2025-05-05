"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoteCard } from "@/components/vote/vote-card";
import { VoteStatus, VotePoolDisplayType, SuiResponseVotePool } from "@/types";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getMultiVotePools, getVotePoolState } from "@/contracts/query";


export default function VotesPage() {
    const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming" | "ended">("all");
    const [votepools, setVotepools] = useState<VotePoolDisplayType[]>([]);
    const [loading, setLoading] = useState(true);
    const currentAccount = useCurrentAccount();


    const fetchVotePools = async () => {
        setLoading(true);
        try {
            const state = await getVotePoolState();
            const voteIds = state.map((item) => item.vote_pool);
            const votePools = await getMultiVotePools(voteIds);
            const displayVotepools = votePools.map(convertVotePoolToDisplayType);
            setVotepools(displayVotepools);
        } catch (error) {
            console.error("获取投票池失败:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // 使用立即执行的异步函数来调用fetchVotePools
        (async () => {
            await fetchVotePools();
        })();
    }, [currentAccount]);

    // 根据选项卡筛选投票
    const getFilteredVotes = () => {
        switch (activeTab) {
            case "active":
                return votepools.filter(vote => vote.status === VoteStatus.ACTIVE);
            case "upcoming":
                return votepools.filter(vote => vote.status === VoteStatus.UPCOMING);
            case "ended":
                return votepools.filter(vote => vote.status === VoteStatus.ENDED);
            default:
                return votepools;
        }
    };

    const convertVotePoolToDisplayType = (votePool: SuiResponseVotePool): VotePoolDisplayType => {

        const currentTime = Date.now();
        let status = VoteStatus.ENDED;

        if (currentTime >= votePool.end) {
            status = VoteStatus.ENDED;
        } else if (currentTime >= votePool.start) {
            status = VoteStatus.ACTIVE;
        } else {
            status = VoteStatus.UPCOMING;
        }

        return {
            id: votePool.id.id,
            title: votePool.title,
            creator: votePool.creator,
            start: votePool.start,
            end: votePool.end,
            participantsCount: votePool.participantsCount,
            status,
            iconType: "chart-pie"
        } as VotePoolDisplayType;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">

            <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as never)}>
                <TabsList className="mb-6">
                    <TabsTrigger value="all">全部</TabsTrigger>
                    <TabsTrigger value="active">进行中</TabsTrigger>
                    <TabsTrigger value="upcoming">即将开始</TabsTrigger>
                    <TabsTrigger value="ended">已结束</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            // 加载动画，可以根据项目风格调整
                            <div className="col-span-3 flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <>
                                <Link href="/votes/create" passHref>
                                    <div className="bg-white rounded-lg border border-gray-200 border-dashed p-6 flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 transition-colors">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                            <i className="fas fa-plus text-primary text-lg"></i>
                                        </div>
                                        <h3 className="font-medium text-primary text-base mb-2">创建新投票</h3>
                                        <p className="text-sm text-gray-500 text-center">
                                            发起一个新的匿名投票
                                        </p>
                                    </div>
                                </Link>
                                {getFilteredVotes().map(votepool => (
                                    <VoteCard key={votepool.id} vote={votepool} />
                                ))}
                            </>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="active" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-3 flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            getFilteredVotes().map(votepool => (
                                <VoteCard key={votepool.id} vote={votepool} />
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="upcoming" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-3 flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            getFilteredVotes().map(votepool => (
                                <VoteCard key={votepool.id} vote={votepool} />
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="ended" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-3 flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            getFilteredVotes().map(votepool => (
                                <VoteCard key={votepool.id} vote={votepool} />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 