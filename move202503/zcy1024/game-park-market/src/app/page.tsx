'use client'

import {Game, Swap, Trade, Waiting} from "@/components";
import {useAppSelector} from "@/store";
import {InputPrice} from "@/components/trade/cards";

export default function Home() {
    const tab = useAppSelector(state => state.pageInfo.tab);
    const showWaiting = useAppSelector(state => state.pageInfo.showWaiting);
    const sellingCard = useAppSelector(state => state.pageInfo.sellingCard);
    const marketCardSteps = useAppSelector(state => state.pageInfo.marketCardSteps);
    const marketCardPrice = useAppSelector(state => state.pageInfo.marketCardPrice);
    const marketCardQuality = useAppSelector(state => state.pageInfo.marketCardQuality);

    return (
        <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#041f4b] select-none">
                {
                    tab === 0
                        ?
                        <Swap/>
                        :
                        (
                            tab === 1
                                ?
                                <Trade/>
                                :
                                <Game/>
                        )
                }
            </div>
            {sellingCard && <InputPrice nftID={sellingCard} marketPrice={marketCardPrice} marketSteps={marketCardSteps} marketQuality={marketCardQuality}/>}
            {showWaiting && <Waiting/>}
        </>
    );
}
