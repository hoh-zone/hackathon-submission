'use client'

import {
    PropsType, setMarketCardPrice,
    setMarketCardQuality, setMarketCardSteps,
    setSellingCard
} from "@/store/modules/pageInfo";
import {useDispatch} from "react-redux";
import {AppDispatch} from "@/store";

export default function FFDCard({info}: {info: PropsType}) {
    const dispatch = useDispatch<AppDispatch>();
    const clickCard = () => {
        dispatch(setSellingCard(info.fields.id.id));
        dispatch(setMarketCardSteps(""));
        dispatch(setMarketCardQuality(info.fields.quality));
        dispatch(setMarketCardPrice(info.fields.price));
    }
    const getShowKey = (key: string) => {
        if (key === "criticalHitRate")
            return "criticalRate";
        if (key === "criticalDamage")
            return "criticalDmg";
        return key;
    }
    const getRealValue = (type: string, value: number) => {
        value -= 1000;
        if (type === "blood")
            return value.toString();
        return value.toString() + "%";
    }

    return (
        <div>
            <div className="relative w-36 h-36 text-xs hover:bg-gray-700 rounded-2xl transition-all duration-750 group overflow-hidden cursor-pointer"
                 onClick={clickCard}>
                <div style={{
                    backgroundImage: `url(${info.fields.image_url})`
                }} className="absolute top-0 left-0 w-full h-full bg-contain bg-no-repeat bg-center opacity-60"></div>
                <div className="w-full h-full flex flex-col justify-end items-start pb-2 pl-1 group-hover:opacity-30">
                    <span>{`Quality: ${info.fields.quality}`}</span>
                    <span>{`ObjectID: ${info.fields.id.id.slice(0, 6)}...${info.fields.id.id.slice(-4)}`}</span>
                </div>
                <div
                    className="absolute flex flex-col items-start -bottom-32 left-0 w-full pl-1 text-[#afb3b5] group-hover:bottom-2 transition-all duration-750 text-lg">
                    {
                        info.fields.effects.fields.contents.map((content, index) =>
                            <span key={index}>{`${getShowKey(content.fields.key)}: ${getRealValue(info.fields.props_type, Number(content.fields.value))}`}</span>)
                    }
                </div>
            </div>
        </div>
    );
}