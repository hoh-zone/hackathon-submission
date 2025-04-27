'use client'

import {useBetterSignAndExecuteTransaction, useMediaSize} from "@/hooks";
import "@/app/page.css"
import {Info, RefreshCw} from "lucide-react";
import {CustomSuiButton, ReadingInfo, Waiting, ViewProps} from "@/components";
import {ChangeEvent, useContext, useEffect, useState} from "react";
import {UserContext} from "@/contexts";
import {buyGameCountTx} from "@/libs/contracts";

export default function Home() {
    const [width, height] = useMediaSize();
    const userInfo = useContext(UserContext);
    const [isWaiting, setIsWaiting] = useState<boolean>(false);
    const [inputCount, setInputCount] = useState<string>("");
    const [timerID, setTimerID] = useState<number | NodeJS.Timeout>();
    const [isReadingInfo, setIsReadingInfo] = useState<boolean>(false);
    const [isViewing, setIsViewing] = useState<boolean>(false);

    const changeInputCount = (e: ChangeEvent<HTMLInputElement>) => {
        const amount = e.target.value;
        for (let i = 0; i < amount.length; i++) {
            const num = amount[i];
            if (num < '0' || num > '9')
                return;
        }
        let i = 0;
        while (i < amount.length && amount[i] === '0')
            i = i + 1;
        const finalAmount = i < amount.length ? amount.slice(i) : '';
        setInputCount(finalAmount);
    }

    useEffect(() => {
        if (timerID)
            clearInterval(timerID);
        const id = setInterval(userInfo.refreshInfo, 10000);
        setTimerID(id);
        return () => {
            clearInterval(timerID);
        }
    }, [userInfo.account]);

    useEffect(() => {
        if (!localStorage.getItem("notFirst")) {
            setIsReadingInfo(true);
            localStorage.setItem("notFirst", "true");
        }
    }, []);

    const canBuyGameCount = () => {
        return userInfo.account && userInfo.gp && Number(userInfo.gp) > 0 && inputCount && Number(userInfo.gp) >= Number(inputCount) * 10;
    }

    const {handleSignAndExecuteTransaction: buyGameCount} = useBetterSignAndExecuteTransaction({
        tx: buyGameCountTx,
        waitForTx: true
    });

    const handleClickBuyGameCount = async () => {
        if (!canBuyGameCount())
            return;
        await buyGameCount({
            sender: userInfo.account!,
            count: Number(inputCount),
            nftID: userInfo.nftID
        }).beforeExecute(() => {
            setIsWaiting(true);
        }).onError(err => {
            console.error(err);
            setIsWaiting(false);
        }).onSuccess(() => {
            userInfo.refreshInfo();
            setIsWaiting(false);
        }).onExecute();
    }

    const isEndingGame = () => {
        return userInfo.gameState === "End";
    }

    const handleClickViewProps = () => {
        if (!isEndingGame())
            return;
        setIsViewing(true);
    }

    return (
        <div style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            minWidth: "1280px",
            minHeight: "720px"
        }}>
            <div
                className="absolute w-full h-full border border-blue-600 rounded-full opacity-20 -z-50 overflow-hidden">
                <div className="fixed w-full h-full animate-move">
                    <div
                        className="w-full h-full bg-[url(https://mainnet-aggregator.hoh.zone/v1/blobs/7zi-F7J4B9JqsQ_PjfIpTUiK1NZywVXRiC00deTHZ2Q)] bg-contain bg-no-repeat bg-center animate-rotate"></div>
                </div>
            </div>
            <div
                className="absolute w-[960px] h-[540px] 2xl:w-[1280px] 2xl:h-[720px]  top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                <div className="w-full h-full border-2 border-[#0a0e0f]">
                    <iframe src="http://47.98.228.198:7458" className="w-full h-full"></iframe>
                </div>
                {/* left */}
                {/*<div className="fixed w-28 h-full border-2 border-[#0a0e0f] top-0 -left-36 flex flex-col justify-center gap-6 items-center">*/}
                {/*    <span>NewGame</span>*/}
                {/*    <span>BuySteps</span>*/}
                {/*</div>*/}
                {/* right */}
                <div
                    className="fixed w-28 h-full border-2 border-[#0a0e0f] top-0 -right-36 flex flex-col justify-center gap-6 items-center">
                    <div className="flex flex-col gap-2 items-center mb-6">
                        <div className="flex gap-2 items-center">
                            <CustomSuiButton/>
                            <RefreshCw
                                className="cursor-pointer text-[#196ae3] hover:text-[#35aaf7]"
                                size={12}
                                onClick={userInfo.refreshInfo}
                            />
                        </div>
                        <hr className="w-full border-[#041f4b]"/>
                    </div>
                    <span className="cursor-pointer text-[#196ae3] hover:text-[#35aaf7]">
                        <a href="https://game-park-market.vercel.app/" target="_blank" rel="noopener noreferrer">Market</a>
                    </span>
                    <div className="flex flex-col gap-1 items-center">
                        <input className="w-full font-bold focus:outline-none text-center px-1"
                               placeholder="input Count" value={inputCount} onChange={changeInputCount}/>
                        <span
                            className={canBuyGameCount() ? "cursor-pointer text-[#196ae3] hover:text-[#35aaf7]" : "text-[#afb3b5]"}
                            onClick={handleClickBuyGameCount}>BuyGameCnt</span>
                    </div>
                    <span className={isEndingGame() ? "cursor-pointer text-[#196ae3] hover:text-[#35aaf7]" : "text-[#afb3b5]"}
                          onClick={handleClickViewProps}>ViewProps</span>
                    <div className="flex flex-col gap-2 items-center text-xs text-[#afb3b5]">
                        <span>GP: {userInfo.gp}</span>
                        <span>GameCount: {userInfo.gameCount}</span>
                    </div>
                    <Info className="absolute bottom-1 right-1 cursor-pointer text-[#196ae3] hover:text-[#35aaf7]"
                          size={20}
                          onClick={() => setIsReadingInfo(true)}/>
                </div>
            </div>
            {isReadingInfo && <ReadingInfo setIsReadingInfo={setIsReadingInfo}/>}
            {isViewing && <ViewProps setIsViewing={setIsViewing} setIsWaiting={setIsWaiting}/>}
            {isWaiting && <Waiting/>}
        </div>
    );
}