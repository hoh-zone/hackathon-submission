'use client'

import {Dispatch, SetStateAction, useContext, useState} from "react";
import {FFDCard} from "@/components/index";
import {UserContext} from "@/contexts";
import {useBetterSignAndExecuteTransaction} from "@/hooks";
import {dropToNewGameTx} from "@/libs/contracts";

export default function ViewProps({setIsViewing, setIsWaiting}: {setIsViewing: Dispatch<SetStateAction<boolean>>, setIsWaiting: Dispatch<SetStateAction<boolean>>}) {
    const userInfo = useContext(UserContext);
    const [dropIds, setDropIds] = useState<string[]>([]);

    const close = () => {
        setDropIds([]);
        setIsViewing(false);
    }

    const editDropIds = (id: string, drop: boolean) => {
        dropIds.push(id);
        setDropIds(drop ? dropIds : dropIds.filter(innerId => innerId !== id));
    }

    const {handleSignAndExecuteTransaction: dropToNewGame} = useBetterSignAndExecuteTransaction({
        tx: dropToNewGameTx,
        waitForTx: true
    });

    const handleClickConfirm = async () => {
        if (!userInfo.nftID)
            return;
        const allIds = userInfo.props.map(item => item.fields.id.id);
        await dropToNewGame({
            nft: userInfo.nftID,
            ids: allIds.filter(id => !dropIds.find(dropId => dropId === id))
        }).beforeExecute(() => {
            setIsWaiting(true);
        }).onError(err => {
            console.error(err);
            setIsWaiting(false);
        }).onSuccess(() => {
            userInfo.refreshInfo();
            setIsWaiting(false);
            close();
        }).onExecute();
    }

    return (
        <div className="fixed w-full h-full z-50">
            <div className="w-full h-full bg-black opacity-60" onClick={close}></div>
            <div className="flex gap-4 items-center flex-wrap absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 overflow-auto">
                {
                    userInfo.props.map((info, index) => {
                        return (
                            <div key={index}><FFDCard info={info} editDropIds={editDropIds} /></div>
                        );
                    })
                }
            </div>
            <div className="absolute top-1/2 right-1/12 -translate-y-1/2 px-2 py-1 border rounded-full border-[#0a0e0f] bg-[#86C7FB] hover:bg-[#9AD1FB] text-[#041f4b] text-center cursor-pointer"
                 onClick={handleClickConfirm}>Confirm</div>
        </div>
    );
}