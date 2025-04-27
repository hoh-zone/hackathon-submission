'use client'

type GameInfoType = {
    name: string,
    bgUrl: string,
    url: string
}

const GameInfos: GameInfoType[] = [
    {
        name: "BlackSquid Jumping: Remastered",
        bgUrl: "https://mainnet-aggregator.hoh.zone/v1/blobs/XDRQ-jpUnIi8gLCg__Q7Fo5DoeDQmV4E0ggkEPM0lVc",
        url: "http://47.98.228.198:7455/"
    },
    {
        name: "Fight For Dove",
        bgUrl: "https://mainnet-aggregator.hoh.zone/v1/blobs/7zi-F7J4B9JqsQ_PjfIpTUiK1NZywVXRiC00deTHZ2Q",
        url: "http://47.98.228.198:7460/"
    }
]

export default function Game() {
    return (
        <div className="flex gap-10">
            {
                GameInfos.map((info, index) => {
                    return (
                        <a key={index} href={info.url} target="_blank" rel="noopener noreferrer">
                            <div className="relative w-96 h-96 border-2 border-[#0a0e0f] outline-2 outline-[#041f4b] rounded-4xl group hover:outline-[#196ae3] transition-colors duration-500">
                                <div style={{
                                    backgroundImage: `url(${info.bgUrl})`,
                                }} className="w-full h-full bg-contain bg-no-repeat bg-center"></div>
                                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 -translate-y-1/2 w-full text-center text-xl">{info.name}</div>
                                <div className="absolute w-full h-full left-0 top-0 bg-[#0a0e0f] rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-bold text-[#196ae3] opacity-0 group-hover:opacity-60 transition-opacity duration-500">Enter</div>
                            </div>
                        </a>
                    );
                })
            }
        </div>
    );
}