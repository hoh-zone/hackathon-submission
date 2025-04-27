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
                        Log in to the game with your account.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">4. </b>
                        In order to start playing, you need to <b className="text-[#196ae3]">BuyGameCnt</b> first.(1 GameCnt = 10 $GP)
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">5. </b>
                        In the game, use <b className="text-[#196ae3]">A/D</b> to move, <b className="text-[#196ae3]">J</b> to attack, and <b className="text-[#196ae3]">K</b> to jump. Your goal is to survive.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">6. </b>
                        Each time you pass a level, you will get props <b className="text-[#196ae3]">randomly</b>, which can be used to strengthen yourself. You can carry <b className="text-[#196ae3]">up to five props</b> at the same time.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">7. </b>
                        The game ends when you die. You can directly <b className="text-[#196ae3]">discard all</b> the props obtained in this round, or you can <b className="text-[#196ae3]">keep some</b> props permanently.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">8. </b>
                        Permanently retained props can <b className="text-[#196ae3]">be carried</b> in future games or <b className="text-[#196ae3]">sold</b> on the <b className="text-[#196ae3]">Market</b>.
                    </p>
                    <p>
                        <b className="text-[#0a0e0f]">9. </b>
                        Have fun and good luck!
                    </p>
                </div>
            </div>
        </div>
    );
}