// 投票状态枚举
export enum VoteStatus {
    UPCOMING = "upcoming",
    ACTIVE = "active",
    ENDED = "ended"
}


// 投票类型定义
export type EncryptedInputVotePool = {
    title: string,
    description: string,
    options: VoteOption[],
}

export type VoteOption = {
    id: string,
    text: string,
    voteCount?: number,
}

export type VoteCreateSuccessType = {
    voteId: string,
    digest: string,
}

export type SuiEncryptedVoteType = {
    voter: string,
    vote: Uint8Array,
}

export type SuiResponseVotePool = {
    id: { id: string },
    title: string,
    creator: string,
    details: string | Uint8Array,
    allowlist_id?: string,
    votebox_id: string,
    start: number,
    end: number,
    participantsCount: number,
}

export type SuiInputVotePool = {
    title: string,
    details: string | Uint8Array,
    allowlist_Id?: string,
    start: number,
    end: number,
}

// 前端显示用的投票池类型

export type VotePoolDisplayType = {
    id: string,
    title: string,
    creator: string,
    start: number,
    end: number,
    participantsCount: number,
    status: VoteStatus,
    iconType: string,
}

