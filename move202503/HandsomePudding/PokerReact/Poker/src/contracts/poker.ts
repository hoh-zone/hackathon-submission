import {Transaction} from "@mysten/sui/transactions";
import {RANDOM, BUY_POKER_TOKENS, PLAY_GAME,GAME_STORE, GAME_RESULT_EVENT, POKERTOEN, PokerTreasuryCap, SELL_TOKENS, REWARD} from "../config/key";
import {suiClient} from "../config/index";
import {coinWithBalance} from "@mysten/sui/transactions";

type GameResultEvent = {
    winner_region: number,
    cards: number[]
}

// export async function getBalance(signAndExecuteTransaction: any) {
//     const tx = new Transaction();
//     tx.moveCall({
//         target: GET_BALANCE,
//         arguments: [
//             tx.object(GAME_STORE)
//         ],
//     });
//     const response = await signAndExecuteTransaction({transaction: tx});
//     console.log("Full response:", response);
//     console.log("Response events:", response.events);
    
//     let coins = 0;
//     response.events?.forEach((event: any) => {
//         console.log("Event type:", event.type);
//         console.log("Event parsedJson:", event.parsedJson);
//         if (event.type === BALANCE_EVENT) {
//             coins = Number(((event.parsedJson as BalanceEvent).balances / 10).toFixed(1));
//             console.log("Found balance event, balance:", coins);
//         }
//     });
//     return coins;
// }

// export async function addBalance(signAndExecuteTransaction: any, amount: number) {
//     const tx = new Transaction();
//     const scaledAmount = amount * 10;
//     console.log("amount:", amount);
//     tx.moveCall({
//         target: ADD_BALANCE,
//         arguments: [
//             tx.object(GAME_STORE),
//             tx.pure.u64(scaledAmount)
//         ],
//     });
//     console.log("amount11111:", amount);
//     const response = await signAndExecuteTransaction({transaction: tx});
//     console.log("Full response:", response);
//     console.log("Response events:", response.events);
    
//     let coins = 0;
//     response.events?.forEach((event: any) => {
//         console.log("Event type:", event.type);
//         console.log("Event parsedJson:", event.parsedJson);
//         if (event.type === BALANCE_EVENT) {
//             coins = Number(((event.parsedJson as BalanceEvent).balances / 10).toFixed(1));
//             console.log("Found balance event, balance:", coins);
//         }
//     });
//     return coins;
// }


export async function playGame(signAndExecuteTransaction: any, bet_a: number, bet_b: number, bet_c: number, bet_d: number, bet_e: number, sender: string) {
    const tx = new Transaction();
    const scaled_bet_a = bet_a * 10;
    const scaled_bet_b = bet_b * 10;
    const scaled_bet_c = bet_c * 10;
    const scaled_bet_d = bet_d * 10;
    const scaled_bet_e = bet_e * 10;
    
    console.log("bet_a:", bet_a);
    console.log("bet_b:", bet_b);
    console.log("bet_c:", bet_c);
    console.log("bet_d:", bet_d);
    console.log("bet_e:", bet_e);
    tx.setSender(sender);
    tx.moveCall({
        target: PLAY_GAME,
        arguments: [
            tx.object(PokerTreasuryCap),
            tx.object(GAME_STORE),
            tx.object(RANDOM),
            coinWithBalance({
                balance: scaled_bet_a,
                type: POKERTOEN
            }),
            coinWithBalance({
                balance: scaled_bet_b,
                type: POKERTOEN
            }),
            coinWithBalance({
                balance: scaled_bet_c,
                type: POKERTOEN
            }),
            coinWithBalance({
                balance: scaled_bet_d,
                type: POKERTOEN
            }),
            coinWithBalance({
                balance: scaled_bet_e,
                type: POKERTOEN
            })
        ],
    });
    const response = await signAndExecuteTransaction({transaction: tx});
    console.log("Full response:", response);
    console.log("Response events:", response.events);
    
    let gameResult;
    response.events?.forEach((event: any) => {
        console.log("Event type:", event.type);
        console.log("Event parsedJson:", event.parsedJson);
        if (event.type === GAME_RESULT_EVENT) {
            gameResult = event.parsedJson as GameResultEvent;
            console.log("Game Result:", gameResult);
        }
    });
    return gameResult;
}

export async function getPokerTokenBalance(address: string): Promise<number> {
    const pokerBalance = await suiClient.getBalance({
        owner: address,
        coinType: POKERTOEN
    });
    return Number((Math.floor(Number(pokerBalance.totalBalance) / 10 * 100) / 100).toFixed(1));
}

export async function getSuiBalance(address: string): Promise<number> {
    const suiBalance = await suiClient.getBalance({
        owner: address,
    });
    return Number((Math.floor(Number(suiBalance.totalBalance) / 1000000000 * 100) / 100).toFixed(2));
}

export async function buyPokerTokens(amount: number, sender: string) {
    console.log("amount:", amount);
    const tx = new Transaction();
    tx.setSender(sender);
    tx.moveCall({
        target: BUY_POKER_TOKENS,
        arguments: [
            tx.object(PokerTreasuryCap),
            tx.object(GAME_STORE),
            coinWithBalance({
                balance: amount
            })
        ]
    });
    return tx;
}

export async function sellTokens(amount: number, sender: string) {
    console.log("amount:", amount);
    const tx = new Transaction();
    tx.setSender(sender);
    tx.moveCall({
        target: SELL_TOKENS,
        arguments: [
            tx.object(PokerTreasuryCap),
            tx.object(GAME_STORE),
            coinWithBalance({
                balance: amount,
                type: POKERTOEN
            })
        ]
    });
    return tx;
}

export async function reward(amount: number, sender: string) {
    console.log("amount:", amount);
    const tx = new Transaction();
    tx.setSender(sender);
    tx.moveCall({
        target: REWARD,
        arguments: [
            tx.object(GAME_STORE),
            coinWithBalance({
                balance: amount
            })
        ]
    });
    return tx;
}