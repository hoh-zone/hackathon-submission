export interface ReqNextStep {
    nftID: string,
    hashKey: string,
    userPos: string,
    receipt: string
}

export interface ResNextStep {
    safePos: number
}