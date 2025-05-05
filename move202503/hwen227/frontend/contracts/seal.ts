import { SuiEncryptedVoteType, EncryptedInputVotePool } from "@/types";

import { toHex } from "@mysten/sui/utils";
import { fromHex } from "@mysten/sui/utils";
import { networkConfig, sealClient, suiClient } from ".";
import { Transaction } from "@mysten/sui/transactions";
import { EncryptedObject, NoAccessError, SessionKey } from "@mysten/seal";


export type MoveCallConstructor = (tx: Transaction, id: string) => void;

export const constructMoveCall = (packageId: string, allowlistId: string): MoveCallConstructor => {
    return (tx: Transaction, id: string) => {
        tx.moveCall({
            target: `${packageId}::allowlist::seal_approve`,
            arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(allowlistId), tx.pure.string("")],
        });
    };
}

export const encryptVotePool = async (votePool: EncryptedInputVotePool, allowlistID: string): Promise<Uint8Array> => {
    const nonce = crypto.getRandomValues(new Uint8Array(5));
    const policyObjectBytes = fromHex(allowlistID);
    const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

    const encoder = new TextEncoder();
    const serializedData = encoder.encode(JSON.stringify(votePool));

    const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        id,
        packageId: networkConfig.testnet.variables.packageID,
        data: serializedData,
    });

    return encryptedBytes;
}

export const encryptUserVote = async (option: string, voteboxID: string): Promise<Uint8Array> => {
    const nonce = crypto.getRandomValues(new Uint8Array(5));
    const policyObjectBytes = fromHex(voteboxID);
    const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

    const encoder = new TextEncoder();


    const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        id,
        packageId: networkConfig.testnet.variables.packageID,
        data: encoder.encode(option),
    });

    return encryptedBytes;
}

export const decryptVotePool = async (sessionKey: SessionKey, encryptedData: Uint8Array, moveCallConstructor: MoveCallConstructor) => {

    const fullId = EncryptedObject.parse(new Uint8Array(encryptedData)).id;

    const tx = new Transaction();
    moveCallConstructor(tx, fullId);

    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

    try {

        const decryptedData = await sealClient.decrypt({
            data: new Uint8Array(encryptedData),
            sessionKey,
            txBytes,
        });

        console.log("权限通过");
        return decodeVotePool(decryptedData);
    } catch (err) {
        console.log(err);
        const errorMsg =
            err instanceof NoAccessError
                ? 'No access to decryption keys'
                : 'Unable to decrypt files, try again';
        console.error(errorMsg, err);
        return;
    }
}


const decodeVotePool = (data: Uint8Array): EncryptedInputVotePool => {
    try {
        // 将Uint8Array转换为文本
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(data);

        // 解析JSON字符串成对象
        const votePoolData = JSON.parse(jsonString);

        return votePoolData as EncryptedInputVotePool;
    } catch (error) {
        console.error("解码VotePool失败:", error);
        throw new Error("无法解码VotePool数据");
    }
};

// const decrptedVoteBox = async (voteBoxData: SuiEncryptedVoteType[]) => {
//     const validVotes = voteBoxData.filter((vote) => {
//         vote.voter is Uint16Array
//     }
// }

export const test_decrptedVoteBox = async (sessionKey: SessionKey, voteBoxData: SuiEncryptedVoteType[], moveCallConstructor: MoveCallConstructor) => {
    console.log("开始解密投票数据，数量:", voteBoxData.length);
    console.log("使用的sessionKey地址:", sessionKey.getAddress());

    // 顺序处理而不是并行处理，以避免可能的竞争条件
    const voteResult: string[] = [];

    for (const vote of voteBoxData) {
        try {
            // 为每个投票创建新的事务对象
            const tx = new Transaction();
            tx.setSender(sessionKey.getAddress());

            // 解析加密对象ID
            const fullId = EncryptedObject.parse(new Uint8Array(vote.vote)).id;
            console.log("正在处理加密投票ID:", fullId);
            moveCallConstructor(tx, fullId);

            const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
            console.log("交易构建完成，开始解密...");

            // 解密投票
            const decryptedVote = await sealClient.decrypt({
                data: new Uint8Array(vote.vote),
                sessionKey,
                txBytes,
            });

            const decoder = new TextDecoder();
            const voteNumber = decoder.decode(decryptedVote);
            console.log("解密成功，投票索引:", voteNumber);

            voteResult.push(voteNumber);
        } catch (err) {
            console.error("解密单个投票时出错:", err);

            // 详细记录错误类型
            if (err instanceof NoAccessError) {
                console.error('无权访问解密密钥:', err);
            } else {
                console.error('解密失败，详细错误:', err);

                // 如果可能，记录sessionKey的状态
                try {
                    console.log("当前sessionKey状态:", {
                        address: sessionKey.getAddress(),
                        hasSignature: Boolean(sessionKey.getPersonalMessage?.()),
                        expired: sessionKey.isExpired?.() || "未知"
                    });
                } catch (e) {
                    console.log("无法检查sessionKey状态", e);
                }
            }
        }
    }
    console.log(`解密完成: 成功 ${voteResult.length}/${voteBoxData.length}`);
    return voteResult;
};

