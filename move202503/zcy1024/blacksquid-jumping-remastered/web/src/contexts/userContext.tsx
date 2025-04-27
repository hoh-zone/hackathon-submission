'use client'

import {createContext, ReactNode, useCallback, useEffect, useState} from "react";
import {useCurrentAccount, useResolveSuiNSName} from "@mysten/dapp-kit";
import {getGP, getNFTID, getStepsAndGames} from "@/libs/contracts";

type UserInfoType = {
    account: string | null | undefined,
    suiName: string | null | undefined,
    accountLabel: string | null | undefined,
    nftID: string | null | undefined,
    gp: string | null | undefined,
    steps: string | null | undefined,
    canAddNewGame: boolean,
    refreshInfo: (reset: boolean) => void
}

export const UserContext = createContext<UserInfoType>({
    account: undefined,
    suiName: undefined,
    accountLabel: undefined,
    nftID: undefined,
    gp: undefined,
    steps: undefined,
    canAddNewGame: false,
    refreshInfo: () => {},
});

export default function UserContextProvider({children}: {children: ReactNode}) {
    const account = useCurrentAccount();
    const {data: suiName} = useResolveSuiNSName(account?.address);
    const [nftID, setNftID] = useState<string | null | undefined>(undefined);
    const [gp, setGp] = useState<string>("");
    const [steps, setSteps] = useState<string>("");
    const [canAddNewGame, setCanAddNewGame] = useState<boolean>(false);
    const resetNFT = useCallback(() => {
        setNftID(null);
        setSteps("");
        setCanAddNewGame(false);
        getNFTID(account?.address, null).then(nftID => {
            setNftID(nftID);
            getStepsAndGames(account?.address, nftID).then(data => {
                setSteps(data[0]);
                setCanAddNewGame(data[1] < 2);
            });
        });
    }, [account]);
    useEffect(() => {
        getGP(account?.address).then(gp => setGp(gp));
        resetNFT();
    }, [account]);
    const refreshInfo = (reset: boolean) => {
        getGP(account?.address).then(gp => setGp(gp));
        if (reset) {
            resetNFT();
            return;
        }
        getStepsAndGames(account?.address, nftID).then(data => {
            setSteps(data[0]);
            setCanAddNewGame(data[1] < 2);
        });
    }

    return (
        <UserContext.Provider value={{
            account: account?.address,
            suiName,
            accountLabel: account?.label,
            nftID,
            gp,
            steps,
            canAddNewGame,
            refreshInfo,
        }}>
            {children}
        </UserContext.Provider>
    );
}