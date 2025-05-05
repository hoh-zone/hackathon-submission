import { SuiResponseVotePool, EncryptedInputVotePool } from "@/types";
import { formatAddress } from "@/lib/utils";
import { useEffect, useState } from "react";
import VoteCast from "./VoteCast";
import { castVoteTx_woal } from "@/contracts/transaction";

interface PublicVoteDetailsProps {
    votePoolObjectData: SuiResponseVotePool | null;
    voteId: string;
}

export default function PublicVoteDetails({
    votePoolObjectData,
    voteId
}: PublicVoteDetailsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [votePoolData, setvotePoolData] = useState<EncryptedInputVotePool | null>(null);

    // 对于公开投票，我们直接解析votePoolObjectData中的details字段
    useEffect(() => {
        if (votePoolObjectData && typeof votePoolObjectData.details === 'string') {
            try {
                // 尝试解析details字符串为JSON对象
                const parsedDetails = JSON.parse(votePoolObjectData.details);
                setvotePoolData(parsedDetails);
                setIsLoading(false);
            } catch (error) {
                console.error('解析投票详情失败:', error);
                setIsLoading(false);
            }
        }
    }, [votePoolObjectData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg mb-8">
                <div className="mb-4">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-200 border-l-blue-200 border-r-blue-200 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600">正在加载投票数据...</p>
            </div>
        );
    }

    if (!votePoolData) {
        return (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg mb-8">
                <p className="text-gray-600 mb-4">无法加载投票数据</p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8">
                <p className="text-gray-700 mb-4">{votePoolData.description}</p>

                <div className="text-sm text-gray-500 space-y-1 mb-6">
                    <div><i className="fas fa-user mr-2"></i> 创建者: {formatAddress(votePoolObjectData?.creator || '')}</div>
                    <div><i className="fas fa-users mr-2"></i> 已有 {votePoolObjectData?.participantsCount || 0} 人参与</div>
                    <div><i className="fas fa-link mr-2"></i> Object ID: {voteId}</div>
                </div>
            </div>



        </>
    );
}