'use client'
import { ConnectButton, useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit'
import { Transaction } from "@mysten/sui/transactions";
import { networkConfig, suiClient } from "@/contracts";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, NoAccessError, SealClient, SessionKey } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import { useState } from 'react';

export type MoveCallConstructor = (tx: Transaction, id: string) => void;
export default function TestPage() {
    // 使用 useState 管理状态
    const [voteID, setVoteID] = useState<string>('0x06060af46a792e2eb941e8689894a6d8b337bffe3ec7a801e6a57462c6757e3e');
    const [allowlistID, setAllowlistID] = useState<string>('0x06ecbe91fd8d3ff0dfee03f7b49640d84f426f7cf782f9bbb851c4634bda830c');
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);

    const { mutate: signPersonalMessage } = useSignPersonalMessage();

    const { mutate: signAndExecute } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await suiClient.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showRawEffects: true,
                    showEffects: true,
                },
            }),
    });

    const currentAccount = useCurrentAccount();

    // 如果钱包未连接，显示连接提示
    if (!currentAccount) {
        return (
            <div className="container mx-auto p-4 text-center">
                <ConnectButton />
                <p className="mt-4 text-lg">请先连接钱包后继续操作</p>
            </div>
        );
    }



    const sealClient = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers("testnet"),
        verifyKeyServers: false
    });
    //=======================Encrypt and DeCrypt=========================

    const encryptedVotePoolData = async (allowlistID: string) => {

        if (!currentAccount) {
            throw new Error("请先连接钱包");
        }

        const nonce = crypto.getRandomValues(new Uint8Array(5));
        const policyObjectBytes = fromHex(allowlistID);
        const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

        // 模拟投票数据
        const MOCK_VOTE_DATA = {
            description: "社区资金分配提案",
            options: [
                { id: "option1", text: "方案A: 将资金重点分配给技术开发" },
                { id: "option2", text: "方案B: 将资金平均分配给各个方向" }
            ]
        };

        // 将对象转换为Uint8Array
        const encoder = new TextEncoder();
        const serializedData = encoder.encode(JSON.stringify(MOCK_VOTE_DATA));


        const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
            //demType: 1,
            threshold: 2,
            id,
            packageId: networkConfig.testnet.variables.packageID,
            data: serializedData,
            //aad: fromHex(currentAccount?.address)
        });
        return encryptedBytes;
    }

    const encryptedVoteData = async (allowlistId: string) => {
        if (!currentAccount) {
            throw new Error("请先连接钱包");
        }

        const nonce = crypto.getRandomValues(new Uint8Array(5));
        const policyObjectBytes = fromHex(allowlistId);
        const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

        // 模拟投票数据
        const MOCK_VOTE_DATA = {
            option: 0
        };

        // 将对象转换为Uint8Array
        const encoder = new TextEncoder();
        const serializedData = encoder.encode(JSON.stringify(MOCK_VOTE_DATA));

        console.log("加密前的数据：", serializedData);

        const { encryptedObject: bytes } = await sealClient.encrypt({
            demType: 1,
            threshold: 2,
            id,
            packageId: networkConfig.testnet.variables.packageID,
            data: serializedData,
            aad: fromHex(currentAccount?.address)
        });


        console.log("加密后的bytes:", bytes);
        console.log("seal id:", id);
        return {
            storedbytes: bytes,
            id: id
        };
    }


    // 解码函数：将字节数组转换回原始投票数据
    const decodeVoteData = (serializedData: Uint8Array) => {
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(serializedData);
        const voteData = JSON.parse(jsonString);
        console.log(voteData);
        return voteData as {
            description: string;
            options: Array<{
                id: string;
                text: string;
            }>;
        };


    }




    const handleFetchVoteData = async () => {

        if (
            currentSessionKey &&
            !currentSessionKey.isExpired() &&
            currentSessionKey.getAddress() === currentAccount.address
        ) {
            await sealProcess(currentSessionKey);
        }

        else {
            console.log("not find session key, start to create it");
            setCurrentSessionKey(null);

            const sessionKey = new SessionKey({
                address: currentAccount.address,
                packageId: networkConfig.testnet.variables.packageID,
                ttlMin: 10,
            });

            try {
                signPersonalMessage(
                    {
                        message: sessionKey.getPersonalMessage(),
                    },
                    {
                        onSuccess: async (result) => {

                            console.log(result);
                            await sessionKey.setPersonalMessageSignature(result.signature);
                            setCurrentSessionKey(sessionKey);

                            console.log("test1", sessionKey.getAddress());
                            await sealProcess(sessionKey);

                        },
                        onError: (error) => {
                            console.error("签名过程出错:", error);
                        }
                    },
                );
            } catch (error) {
                console.error("整体流程出错:", error);
                throw error;
            }
        }
    };



    const constructMoveCall = (allowlistId: string): MoveCallConstructor => {
        return (tx: Transaction, id: string) => {
            tx.moveCall({
                target: `${networkConfig.testnet.variables.packageID}::allowlist::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(allowlistId)
                ]
            })
        }
    }

    const sealProcess = async (ssk: SessionKey) => {

        if (!ssk) {
            throw new Error("SessionKey is null");
        }


        console.log("进入sealProcess", ssk.getPackageId());

        const { storedbytes, id } = await encryptedVoteData(allowlistID);

        console.log("获取加密信息成功");

        const moveCallConstructor = constructMoveCall(allowlistID);

        const tx = new Transaction();

        console.log("构建交易中1");

        moveCallConstructor(tx, id);

        console.log("构建交易中2");

        const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

        console.log("构建交易中3");

        try {
            const decryptedBytes = await sealClient.decrypt({
                data: storedbytes,
                sessionKey: ssk,
                txBytes,
            });

            console.log("解密完成，结果:", decryptedBytes);
            return decryptedBytes;
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


    //==================================================



    return (
        <div className="container mx-auto p-4">

            <ConnectButton />

            <button
                onClick={handleFetchVoteData}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                获取加密池信息
            </button>

        </div>
    );
}