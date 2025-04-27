'use client'

import {createSlice, ThunkDispatch, UnknownAction} from "@reduxjs/toolkit";
import {Dispatch} from "react";
import {GameInfoType, getBalance, getGameInfo, getInfo, getJumpingNFTInMarket} from "@/libs/contracts";
import {getFFDOwnedProps, getMarketFFDProps} from "@/libs/contracts/ffd";

export type SwapTokenType = {
    name: string,
    image: string,
    balance: number
}

export type LinkedUserInfo = {
    name: string,
    isLinked: boolean
}

export type PropsType = {
    fields: {
        id: {
            id: string
        },
        props_type: string,
        quality: string,
        image_url: string,
        effects: {
            fields: {
                contents: {
                    fields: {
                        key: string,
                        value: string
                    }
                }[]
            }
        },
        price?: string,
        owner?: string
    }
}

export type initialStateType = {
    account: string,
    tab: number,
    swapTokenInfo: [SwapTokenType, SwapTokenType],
    showWaiting: boolean,
    linkedUserInfo: LinkedUserInfo,
    gameInfo: GameInfoType | null | undefined,
    sellingCard: string,
    marketGameInfos: GameInfoType[] | null | undefined,
    marketCardPrice: string,
    marketCardSteps: string,
    ffdOwnedProps: PropsType[],
    marketCardQuality: string,
    marketFFDProps: PropsType[]
}

const initialState: initialStateType = {
    account: "",
    tab: 0,
    swapTokenInfo: [
        {
            name: "Sui",
            image: "https://archive.cetus.zone/assets/image/sui/sui.png",
            balance: 0
        },
        {
            name: "GP",
            image: `${process.env.NEXT_PUBLIC_AGGREGATOR}/A2ABaDlQNjOYAJu9dGwbrz4YnzCku76U9qjL6dr0kF8`,
            balance: 0
        }
    ],
    showWaiting: false,
    linkedUserInfo: {
        name: "",
        isLinked: false
    },
    gameInfo: null,
    sellingCard: "",
    marketGameInfos: null,
    marketCardPrice: "",
    marketCardSteps: "0",
    ffdOwnedProps: [],
    marketCardQuality: "epic",
    marketFFDProps: []
}

const pageInfoStore = createSlice({
    name: "pageInfo",
    initialState,
    reducers: {
        setAccount(state, action: {payload: string}) {
            state.account = action.payload;
        },
        setTab(state, action: { payload: number }) {
            state.tab = action.payload;
        },
        setSwapTokenInfo(state, action: { payload: [number, number] }) {
            state.swapTokenInfo[0].balance = action.payload[0];
            state.swapTokenInfo[1].balance = action.payload[1];
        },
        setShowWaiting(state, action: { payload: boolean }) {
            state.showWaiting = action.payload;
        },
        setLinkedUserInfo(state, action: { payload: string }) {
            state.linkedUserInfo.name = action.payload;
            state.linkedUserInfo.isLinked = action.payload !== "";
        },
        setGameInfo(state, action: { payload: GameInfoType | null | undefined }) {
            state.gameInfo = action.payload;
        },
        setSellingCard(state, action: { payload: string }) {
            state.sellingCard = action.payload;
        },
        setMarketGameInfos(state, action: { payload: GameInfoType[] | null | undefined }) {
            state.marketGameInfos = action.payload;
        },
        setMarketCardPrice(state, action: { payload: string | undefined }) {
            state.marketCardPrice = action.payload ? action.payload : "";
        },
        setMarketCardSteps(state, action: { payload: string }) {
            state.marketCardSteps = action.payload;
        },
        setFFDOwnedProps(state, action: { payload: PropsType[] }) {
            state.ffdOwnedProps = action.payload;
        },
        setMarketCardQuality(state, action: { payload: string }) {
            state.marketCardQuality = action.payload;
        },
        setMarketFFDProps(state, action: { payload: PropsType[] }) {
            state.marketFFDProps = action.payload;
        }
    }
});

const {
    setAccount,
    setTab,
    setSwapTokenInfo,
    setShowWaiting,
    setLinkedUserInfo,
    setGameInfo,
    setSellingCard,
    setMarketGameInfos,
    setMarketCardPrice,
    setMarketCardSteps,
    setFFDOwnedProps,
    setMarketCardQuality,
    setMarketFFDProps
} = pageInfoStore.actions;

const refreshAccount = (account: string) => {
    return async (dispatch: ThunkDispatch<{
        pageInfo: initialStateType
    }, undefined, UnknownAction> & Dispatch<UnknownAction>) => {
        dispatch(setAccount(account));
        if (!account) {
            dispatch(setSwapTokenInfo([0, 0]));
            dispatch(setLinkedUserInfo(""));
            dispatch(setGameInfo(null));
            dispatch(setMarketGameInfos(await getJumpingNFTInMarket()));
            dispatch(setFFDOwnedProps([]));
            dispatch(setMarketFFDProps([]));
            return;
        }
        dispatch(setSwapTokenInfo(await getBalance(account)));
        dispatch(setLinkedUserInfo(await getInfo(account)));
        dispatch(setGameInfo(await getGameInfo(account)));
        dispatch(setMarketGameInfos(await getJumpingNFTInMarket()));
        dispatch(setFFDOwnedProps(await getFFDOwnedProps(account)));
        dispatch(setMarketFFDProps(await getMarketFFDProps()));
    }
}

export {
    setTab,
    setSwapTokenInfo,
    setShowWaiting,
    setSellingCard,
    setMarketCardPrice,
    setMarketCardSteps,
    setMarketCardQuality
};
export {refreshAccount};
export default pageInfoStore.reducer;