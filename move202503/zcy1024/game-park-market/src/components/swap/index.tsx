'use client'

import {ChangeEvent, useCallback, useEffect, useState} from "react";
import Image from "next/image";
import {ArrowDown, ArrowDownUp, Wallet} from "lucide-react";
import {useAppSelector, AppDispatch} from "@/store";
import {useBetterSignAndExecuteTransaction} from "@/hooks";
import {swapGPToSuiTx, swapSuiToGPTx} from "@/libs/contracts";
import {useDispatch} from "react-redux";
import {refreshAccount, setShowWaiting} from "@/store/modules/pageInfo";

export default function Swap() {
    const [inAmount, setInAmount] = useState<string>("");
    const [outAmount, setOutAmount] = useState<string>("0");
    const [state, setState] = useState<number>(0);
    const [swapType, setSwapType] = useState<number>(0);
    const swapTokenInfo = useAppSelector(state => state.pageInfo.swapTokenInfo);

    const swapUpToDown = useCallback((amount: string) => {
        if (swapType === 0) {
            setOutAmount(amount ? (Number(amount) * 100).toString() : '0');
            return;
        }
        setOutAmount(amount ? (Number(amount) * 99 / 10000).toString() : '0');
    }, [swapType]);

    useEffect(() => {
        swapUpToDown(inAmount);
        setState(!inAmount ? 0 : (Number(inAmount) <= swapTokenInfo[swapType].balance ? 2 : 1));
    }, [inAmount, swapType, swapUpToDown, swapTokenInfo]);

    const changeInAmount = (e: ChangeEvent<HTMLInputElement>) => {
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
        setInAmount(finalAmount);
    }

    const {handleSignAndExecuteTransaction: buy} = useBetterSignAndExecuteTransaction({
        tx: swapSuiToGPTx,
        waitForTx: true
    });

    const {handleSignAndExecuteTransaction: sell} = useBetterSignAndExecuteTransaction({
        tx: swapGPToSuiTx,
        waitForTx: true
    });

    const dispatch = useDispatch<AppDispatch>();
    const account = useAppSelector(state => state.pageInfo.account);

    const handleSwap = async () => {
        if (state !== 2)
            return;
        if (swapType === 0) {
            await buy({
                amount: Number(inAmount) * (10 ** 9),
                sender: account
            }).beforeExecute(() => {
                dispatch(setShowWaiting(true));
            }).onError(err => {
                console.error(err);
                dispatch(setShowWaiting(false));
            }).onSuccess(async () => {
                await dispatch(refreshAccount(account));
                dispatch(setShowWaiting(false));
            }).onExecute();
        } else if (swapType === 1) {
            await sell({
                amount: Number(inAmount),
                sender: account
            }).beforeExecute(() => {
                dispatch(setShowWaiting(true));
            }).onError(err => {
                console.error(err);
                dispatch(setShowWaiting(false));
            }).onSuccess(async () => {
                await dispatch(refreshAccount(account));
                dispatch(setShowWaiting(false));
            }).onExecute();
        }
    }

    return (
        <div className="flex flex-col gap-5 items-center">
            <div className="relative">
                <div className="flex gap-1 items-center min-w-[384px] w-96 min-h-[128px] h-32 rounded-full border-2 border-[#0a0e0f] hover:border-[#196ae3] bg-[#35a1f7] px-10 transition-all">
                    <div className="flex flex-col items-start gap-2">
                        <span className="text-[#567] text-sm">You Pay</span>
                        <input className="w-full text-2xl font-bold focus:outline-none"
                               placeholder="0"
                               value={inAmount}
                               onChange={changeInAmount}/>
                        <div className="opacity-0">Balance</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="opacity-0">100000000000</div>
                        <div className="flex gap-1 items-center">
                            <Image src={swapTokenInfo.length > 0 ? swapTokenInfo[swapType].image : "https://archive.cetus.zone/assets/image/sui/sui.png"} alt="Swap Token 1" width={28}
                                   height={28}/>
                            <div>{swapTokenInfo.length > 0 ? swapTokenInfo[swapType].name : "Sui"}</div>
                        </div>
                        <div className="flex gap-1 items-center text-[#567] text-sm">
                            <Wallet size={15}/>
                            <span className="cursor-pointer" onClick={() => setInAmount(swapTokenInfo.length > 0 ? swapTokenInfo[swapType].balance.toString() : "")}>{swapTokenInfo.length > 0 ? swapTokenInfo[swapType].balance : "1024"}</span>
                        </div>
                    </div>
                </div>
                <div className="absolute flex justify-center items-center w-10 h-10 left-1/2 bottom-0 -translate-x-1/2 translate-y-3/4 bg-[#35a1f7] rounded-full border border-[#0a0e0f] hover:border-[#196ae3] transition-all group cursor-pointer"
                     onClick={() => {
                         setSwapType(swapType === 0 ? 1 : 0);
                         setInAmount(outAmount === "0" ? "" : Math.floor(Number(outAmount)).toString());
                     }}>
                    <ArrowDown className="group-hover:hidden"/>
                    <ArrowDownUp className="hidden group-hover:block"/>
                </div>
            </div>
            <div className="flex gap-1 items-center min-w-[384px] w-96 min-h-[128px] h-32 rounded-full border-2 border-[#0a0e0f] bg-[#afb3b5] px-10">
                <div className="flex flex-col items-start gap-2">
                    <span className="text-[#567] text-sm">You Receive</span>
                    <input className="w-full text-2xl font-bold focus:outline-none"
                           placeholder={outAmount}/>
                    <div className="opacity-0">Balance</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="opacity-0">100000000000</div>
                    <div className="flex gap-1 items-center">
                        <Image src={swapTokenInfo.length > 0 ? swapTokenInfo[(swapType + 1) % 2].image : `${process.env.NEXT_PUBLIC_AGGREGATOR}/A2ABaDlQNjOYAJu9dGwbrz4YnzCku76U9qjL6dr0kF8`} alt="Swap Token 2" width={28} height={28}/>
                        <div>{swapTokenInfo.length > 0 ? swapTokenInfo[(swapType + 1) % 2].name : "GP"}</div>
                    </div>
                    <div className="flex gap-1 items-center text-[#567] text-sm">
                        <Wallet size={15}/>
                        <span>{swapTokenInfo.length > 0 ? swapTokenInfo[(swapType + 1) % 2].balance : 666}</span>
                    </div>
                </div>
            </div>
            <div className={"flex justify-center items-center min-w-[384px] w-96 min-h-[64px] h-16 rounded-full border-2 border-[#0a0e0f] bg-[#86C7FB] " + (state === 0 || state === 1 ? "opacity-60" : "hover:bg-[#9AD1FB] cursor-pointer opacity-100")}
                 onClick={handleSwap}>
                {
                    state === 0 ? "Enter an number" : (state === 1 ? "Insufficient Balance" : "Swap")
                }
            </div>
        </div>
    );
}