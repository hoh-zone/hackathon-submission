'use client'

import {GameInfoType} from "@/libs/contracts";
import {useDispatch} from "react-redux";
import {AppDispatch} from "@/store";
import {setMarketCardPrice, setMarketCardQuality, setMarketCardSteps, setSellingCard} from "@/store/modules/pageInfo";

export default function JumpingCard({info}: {info: GameInfoType}) {
    const dispatch = useDispatch<AppDispatch>();
    const handleClickCard = () => {
        dispatch(setSellingCard(info.objectID));
        dispatch(setMarketCardSteps(info.steps));
        dispatch(setMarketCardQuality(""));
        dispatch(setMarketCardPrice(info.price));
    }

    return (
        <div className="relative w-36 h-36 text-xs hover:bg-gray-700 rounded-2xl transition-all duration-750 group overflow-hidden cursor-pointer" onClick={handleClickCard}>
            <div className="absolute top-0 left-0 w-full h-full bg-[url(https://mainnet-aggregator.hoh.zone/v1/blobs/XDRQ-jpUnIi8gLCg__Q7Fo5DoeDQmV4E0ggkEPM0lVc)] bg-contain bg-no-repeat bg-center opacity-60"></div>
            <div className="w-full h-full flex flex-col justify-end items-start pb-2 pl-1 group-hover:opacity-60">
                <span>{`Owner: ${info.owner.slice(0, 6)}...${info.owner.slice(-4)}`}</span>
                <span>{`ObjectID: ${info.objectID.slice(0, 6)}...${info.objectID.slice(-4)}`}</span>
            </div>
            {
                info.infos.length > 1 &&
                <div className="absolute flex flex-col items-start -top-20 left-0 w-full pl-1 text-white group-hover:top-2 transition-all duration-750 text-[0.6rem]">
                    <span>{`CurPos: ${info.infos[0].list}`}</span>
                    <span>{`CurPosAward: ${info.infos[0].cur_step_paid}`}</span>
                    <span>{`TotalPos: ${info.infos[0].end}`}</span>
                    <span>{`TotalAward: ${info.infos[0].final_reward}`}</span>
                </div>
            }
            <div className={"absolute flex flex-col items-start -bottom-20 left-0 w-full pl-1 text-white group-hover:bottom-2 transition-all duration-750 " + (info.infos.length > 1 ? "text-[0.6rem]" : "")}>
                <span>{`CurPos: ${info.infos[info.infos.length > 1 ? 1 : 0].list}`}</span>
                <span>{`CurPosAward: ${info.infos[info.infos.length > 1 ? 1 : 0].cur_step_paid}`}</span>
                <span>{`TotalPos: ${info.infos[info.infos.length > 1 ? 1 : 0].end}`}</span>
                <span>{`TotalAward: ${info.infos[info.infos.length > 1 ? 1 : 0].final_reward}`}</span>
            </div>
        </div>
    );
}