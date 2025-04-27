'use client'

import {Dispatch, SetStateAction} from "react";

export default function ReadingInfo({setIsReadingInfo}: {setIsReadingInfo: Dispatch<SetStateAction<boolean>>}) {
    return (
        <div className="fixed w-full h-full z-50">
            <div className="w-full h-full bg-black opacity-60" onClick={() => setIsReadingInfo(false)}></div>
            <div className="absolute flex justify-between items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/4 text-[#041f4b] bg-[#F1F2F5] border-2 border-[#0a0e0f] p-10 rounded-3xl overflow-y-auto">
                <div className="flex flex-col gap-3">
                    <p>
                        <b className="text-xl text-[#0a0e0f]">Things to note: </b>
                        <br/>
                        Due to limited resources such as time and manpower, the game may have some unexpected loopholes.
                        <br/>
                        Please follow the normal game process during the experience.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">1. </b>
                        Make sure your wallet is on testnet.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">2. </b>
                        Create a game account and buy currency(<b className="text-[#196ae3]">$GP</b>) in the <b className="text-[#196ae3]">Market</b>.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">3. </b>
                        Log in to the game with your account, and by default you can choose to play in endless mode.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">4. </b>
                        Click <b className="text-[#196ae3]">NewGame</b> to get an NFT that stores your game data, including the number of steps you can advance. (One NFT contains up to two separate games)
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">5. </b>
                        During the game, you can choose between the two tiles in front of your character, and each choice will consume one <b className="text-[#196ae3]">Step</b>.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">6. </b>
                        When your choice is safe, or successfully reaches the treasure chest, you will receive <b className="text-[#196ae3]">$GP</b> as a reward.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">7. </b>
                        The <b className="text-[#196ae3]">ClearData</b> option will directly destroy your NFT, but you can directly receive a portion of the final reward of the unfinished game.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">8. </b>
                        Another option for dealing with NFT: you can put it on the <b className="text-[#196ae3]">Market</b>.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">9. </b>
                        If you already have NFT in your account when you purchase in <b className="text-[#196ae3]">Market</b>, your original NFT will be cleared according to the rules before you can make the purchase.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">10. </b>
                        <b className="text-[#196ae3]">BuySteps</b> and enjoy your jumps!
                    </p>
                </div>
            </div>
        </div>
    );
}