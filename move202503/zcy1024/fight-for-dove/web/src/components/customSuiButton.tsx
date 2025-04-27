'use client'

import {useContext, useEffect, useState} from "react";
import {UserContext} from "@/contexts";
import {ConnectModal, useDisconnectWallet} from "@mysten/dapp-kit";

export default function CustomSuiButton() {
    const {account, suiName, accountLabel} = useContext(UserContext);
    const {mutate: disconnect} = useDisconnectWallet();
    const [open, setOpen] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [hover, setHover] = useState<boolean>(false);

    useEffect(() => {
        if (!account) {
            setName("");
            return;
        }
        if (suiName) {
            if (suiName.length < 12) {
                setName(suiName);
                return;
            }
            setName(suiName.slice(0, 5) + "...sui");
            return;
        }
        if (accountLabel) {
            if (accountLabel.length < 12) {
                setName(accountLabel);
                return;
            }
            setName(accountLabel.slice(0, 5) + "..." + accountLabel.slice(-3));
            return;
        }
        if (account.length < 12) {
            setName(account);
            return;
        }
        setName(account.slice(0, 5) + "..." + account.slice(-3));
    }, [account, suiName, accountLabel]);

    return (
        <ConnectModal trigger={
            <button className="cursor-pointer text-[#196ae3] hover:text-[#35aaf7]" onClick={() => {
                if (!account)
                    return;
                disconnect();
            }} onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)}>
                {name ? (!hover ? name : "Disconnect") : "Connect"}
            </button>
        } open={open} onOpenChange={(isOpen) => setOpen(account ? false : isOpen)}/>
    );
}