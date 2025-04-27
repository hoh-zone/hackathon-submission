'use client'

import {ChangeEvent, Dispatch, SetStateAction, useEffect, useState} from "react";
import {useAppSelector, AppDispatch} from "@/store";
import {bind, rebind} from "@/libs/contracts";
import {network, networkConfig} from "@/configs/networkConfig";
import {useDispatch} from "react-redux";
import {refreshAccount, setShowWaiting} from "@/store/modules/pageInfo";

export default function Bind({setIsBinding}: {setIsBinding: Dispatch<SetStateAction<boolean>>}) {
    const [userName, setUserName] = useState<string>("");
    const [oldPassword, setOldPassword] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const checkInput = (str: string) => {
        if (str.length > 20)
            return false;
        for (let i = 0; i < str.length; i++) {
            const code = str[i];
            if (!(code >= '0' && code <= '9' || code >= 'a' && code <= 'z' || code >= 'A' && code <= 'Z'))
                return false;
        }
        return true;
    }

    const changeUserName = (e: ChangeEvent<HTMLInputElement>) => {
        const newUserName = e.target.value.trim();
        if (!checkInput(newUserName))
            return;
        setUserName(newUserName);
    }

    const changeOldPassword = (e: ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value.trim();
        if (!checkInput(newPassword))
            return;
        setOldPassword(newPassword);
    }

    const changePassword = (e: ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value.trim();
        if (!checkInput(newPassword))
            return;
        setPassword(newPassword);
    }

    const changeConfirmPassword = (e: ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value.trim();
        if (!checkInput(newPassword))
            return;
        setConfirmPassword(newPassword);
    }

    const account = useAppSelector(state => state.pageInfo.account);
    const linkedUserInfo = useAppSelector(state => state.pageInfo.linkedUserInfo);
    const [bindErr, setBindErr] = useState<boolean>(false);

    useEffect(() => {
        setIsVisible(account !== "" && userName.length > 0 && password.length > 0 && password === confirmPassword && (!linkedUserInfo.isLinked || oldPassword.length > 0));
        setBindErr(false);
    }, [account, userName, password, confirmPassword, oldPassword, linkedUserInfo]);

    const dispatch = useDispatch<AppDispatch>();

    const handleBind = async () => {
        if (!isVisible)
            return;
        dispatch(setShowWaiting(true));
        if (!linkedUserInfo.isLinked) {
            const res = await bind(
                networkConfig[network].variables.GP.PackageID,
                networkConfig[network].variables.GP.Publisher,
                networkConfig[network].variables.GP.UserTable,
                account,
                userName,
                password
            );
            if (res === "success") {
                await dispatch(refreshAccount(account));
                dispatch(setShowWaiting(false));
                setIsBinding(false);
            } else {
                dispatch(setShowWaiting(false));
                setBindErr(true);
            }
        } else {
            const res = await rebind(
                networkConfig[network].variables.GP.PackageID,
                networkConfig[network].variables.GP.Publisher,
                networkConfig[network].variables.GP.UserTable,
                account,
                userName,
                oldPassword,
                password,
            );
            if (res === "success") {
                await dispatch(refreshAccount(account));
                dispatch(setShowWaiting(false));
                setIsBinding(false);
            } else {
                dispatch(setShowWaiting(false));
                setBindErr(true);
            }
        }
    }

    return (
        <div className="fixed w-full h-full z-50">
            <div className="w-full h-full bg-black opacity-60" onClick={() => setIsBinding(false)}></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-auto p-20 bg-[#F1F2F5] border border-black rounded-2xl">
                <div className="flex flex-col gap-6 items-center text-[#9d9d9d]">
                    <span className="text-2xl text-[#35a1f7] animate-pulse">Game Park On Sui</span>
                    <div className="flex flex-col gap-1 items-start">
                        <span>User Name:</span>
                        <input className={"focus:outline-none " + (userName.length > 0 ? "text-[#041f4b]" : "")} placeholder="User Name" value={userName} onChange={changeUserName} />
                    </div>
                    {
                        linkedUserInfo.isLinked &&
                        <div className="flex flex-col gap-1 items-start">
                            <span>Old Password:</span>
                            <input className={"focus:outline-none"} placeholder="Old Password" type={"password"} value={oldPassword} onChange={changeOldPassword} />
                        </div>
                    }
                    <div className="flex flex-col gap-1 items-start">
                        <span>Password:</span>
                        <input className={"focus:outline-none"} placeholder="Password" type={"password"} value={password} onChange={changePassword} />
                    </div>
                    <div className="flex flex-col gap-1 items-start">
                        <span>Confirm Password:</span>
                        <input className={"focus:outline-none"} placeholder="Confirm Password" type={"password"} value={confirmPassword} onChange={changeConfirmPassword} />
                    </div>
                    <div className="flex flex-col gap-2 items-start">
                        <span>Sui Address:</span>
                        <input placeholder={account ? (account.slice(0, 6) + "..." + account.slice(-4)) : "Sui Address"} disabled={true} />
                    </div>
                    <div className={"opacity-100 text-xs " + (bindErr ? "text-red-600" : "text-gray-400")}>{bindErr ? "Username already exists or Wrong old password(if rebinding)" : "0-9 a-z A-Z(length not exceeding 20)"}</div>
                    <div className={"w-full border rounded-full border-[#0a0e0f] bg-[#86C7FB] text-[#041f4b] text-center " + (!isVisible ? "opacity-60" : "hover:bg-[#9AD1FB] cursor-pointer opacity-100")}
                         onClick={handleBind}>Bind</div>
                </div>
            </div>
        </div>
    );
}