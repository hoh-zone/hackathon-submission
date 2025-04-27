'use client'

import Image from "next/image";
import {ConnectButton, useCurrentAccount} from "@mysten/dapp-kit";
import {useAppSelector, AppDispatch} from "@/store";
import {useDispatch} from "react-redux";
import {refreshAccount, setTab} from "@/store/modules/pageInfo";
import {UserRoundCog} from "lucide-react";
import {Bind} from "@/components";
import {useEffect, useState} from "react";

export default function Navigation() {
    const tab = useAppSelector(state => state.pageInfo.tab);
    const dispatch = useDispatch<AppDispatch>();

    const [isBinding, setIsBinding] = useState<boolean>(false);

    const account = useCurrentAccount();
    useEffect(() => {
        dispatch(refreshAccount(account ? account.address : ""));
    }, [account, dispatch]);

    const linkedUserInfo = useAppSelector(state => state.pageInfo.linkedUserInfo);

    return (
        <div className="select-none">
            <div className="fixed w-screen h-screen bg-[#F1F2F5] -z-50"></div>
            <div className="fixed w-screen h-16 bg-[#282828] text-[#9d9d9d] z-30">
                <div className="flex justify-between items-center h-full px-3 xl:px-32 2xl:px-96 transition-all duration-1000">
                    <div className="flex items-center gap-10">
                        <Image src={`${process.env.NEXT_PUBLIC_AGGREGATOR}/tM8_FoNGJerDC4vWm25lpiOrAfB44yJQe1scVY2AYt8`} alt="Game Park On Sui" width={80} height={60} priority={true} />
                        <div
                            className={"cursor-pointer hover:text-white h-16 leading-[4rem] transition-all " + (tab !== 0 ? "" : "px-4 text-white bg-[#080808]")}
                            onClick={() => dispatch(setTab(0))}>
                            Swap
                        </div>
                        <div
                            className={"cursor-pointer hover:text-white h-16 leading-[4rem] transition-all " + (tab !== 1 ? "" : "px-4 text-white bg-[#080808]")}
                            onClick={() => dispatch(setTab(1))}>
                            Trade
                        </div>
                        <div
                            className={"cursor-pointer hover:text-white h-16 leading-[4rem] transition-all " + (tab !== 2 ? "" : "px-4 text-white bg-[#080808]")}
                            onClick={() => dispatch(setTab(2))}>
                            Game
                        </div>
                    </div>
                    <div className="flex gap-10 items-center">
                        <div className="relative group">
                            <UserRoundCog className="cursor-pointer" />
                            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                <div className="flex flex-col gap-3 items-center w-64 h-auto border rounded-3xl mt-5 p-1">
                                    <span>{"UserName: " + (linkedUserInfo.isLinked ? linkedUserInfo.name : "********************")}</span>
                                    <span>{"LinkedSuiAddr: " + (account ? (account.address.slice(0, 6) + "..." + account.address.slice(-4)) : "0x665e...ad80")}</span>
                                    <div className="cursor-pointer" onClick={() => setIsBinding(true)}>{linkedUserInfo.isLinked ? "ReLink" : "Link"}</div>
                                </div>
                            </div>
                        </div>
                        <ConnectButton />
                    </div>
                </div>
            </div>
            {
                isBinding && <Bind setIsBinding={setIsBinding} />
            }
        </div>
    )
}