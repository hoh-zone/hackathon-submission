'use client'

import {useEffect, useState} from "react";
import {FFDCard, JumpingCard} from "@/components/trade/cards";
import {useAppSelector} from "@/store";
import {GameInfoType} from "@/libs/contracts";
import {PropsType} from "@/store/modules/pageInfo";

const TabTile = ["Jumping", "FFDove"];
const TradeType = ["Buy", "Sell"];

export default function Trade() {
    const [tab, setTab] = useState<number>(0);
    const [tradeType, setTradeType] = useState<number>(0);
    const [array, setArray] = useState<GameInfoType[]>([]);
    const sellingJumpingGame = useAppSelector(state => state.pageInfo.gameInfo);
    const marketJumpingGames = useAppSelector(state => state.pageInfo.marketGameInfos);
    const [ffdArray, setFFDArray] = useState<PropsType[]>([]);
    const ffdOwnedProps = useAppSelector(state => state.pageInfo.ffdOwnedProps);
    const marketFFDProps = useAppSelector(state => state.pageInfo.marketFFDProps);
    useEffect(() => {
        if (tab === 0 && tradeType === 1 && sellingJumpingGame) {
            setArray([sellingJumpingGame]);
        } else if (tab === 0 && tradeType === 0 && marketJumpingGames) {
            setArray(marketJumpingGames);
        } else if (tab === 1 && tradeType === 1 && ffdOwnedProps) {
            setFFDArray(ffdOwnedProps);
        } else if (tab === 1 && tradeType === 0 && ffdOwnedProps) {
            setFFDArray(marketFFDProps);
        } else {
            setArray([]);
        }
    }, [tab, tradeType, sellingJumpingGame, marketJumpingGames, ffdOwnedProps, marketFFDProps]);

    return (
        <div className="h-[80vh] w-screen">
            <div className="h-full xl:px-32 2xl:px-96 mt-16 transition-all duration-1000">
                <div className="relative h-full w-full p-5">
                    <div className="absolute -top-6 left-0 w-full flex justify-between items-center">
                        <div className="flex gap-2 items-center border border-[#afb3b5] bg-[#afb3b5] rounded-full">
                            {
                                TabTile.map((title, index) => {
                                    return (
                                        <span key={index}
                                              className={"w-24 rounded-full px-2 text-center cursor-pointer transition-all hover:opacity-100 " + (tab === index ? "bg-white" : "bg-[#afb3b5] opacity-60")}
                                              onClick={() => setTab(index)}>
                                            {title}
                                        </span>
                                    );
                                })
                            }
                        </div>
                        <div className="flex gap-2 items-center border border-[#afb3b5] bg-[#afb3b5] rounded-full">
                            {
                                TradeType.map((type, index) => {
                                    return (
                                        <span key={index}
                                              className={"w-24 rounded-full px-2 text-center cursor-pointer transition-all hover:opacity-100 " + (tradeType === index ? "bg-white" : "bg-[#afb3b5] opacity-60")}
                                              onClick={() => setTradeType(index)}>
                                            {type}
                                        </span>
                                    );
                                })
                            }
                        </div>
                    </div>
                    <div className="w-full h-full flex gap-4 flex-wrap content-start overflow-auto">
                        {
                            tab === 0 &&
                            array.map((info, idx) => {
                                return (
                                    <div key={idx}>
                                        <JumpingCard info={info} />
                                    </div>
                                );
                            }) ||
                            ffdArray.map((info, idx) => {
                                return (
                                    <div key={idx}>
                                        <FFDCard info={info} />
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}