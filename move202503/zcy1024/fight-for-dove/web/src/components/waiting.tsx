'use client'

import {useCallback, useEffect, useState} from "react";

export default function Waiting() {
    const [tip, setTip] = useState<string>("");

    const addChar = useCallback(async () => {
        const delay =
            (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const str = "Waiting...";
        for (let i = 0; i < str.length; i++) {
            setTip(str.slice(0, i + 1));
            await delay(222);
        }
    }, []);

    useEffect(() => {
        addChar().then();
    }, [addChar]);

    return (
        <div className="fixed w-full h-full z-50">
            <div className="w-full h-full bg-black opacity-60"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold tracking-widest">
                {
                    Array.from(tip).map((char, index) => {
                        const c = Math.floor(Math.random() * 3);
                        return <span key={index} className={"animate-bounce inline-block " + (c === 0 ? "text-red-600" : (c === 1 ? "text-green-600" : "text-blue-600"))}>{char}</span>
                    })
                }
            </div>
        </div>
    );
}