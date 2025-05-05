'use client'
import { ConnectButton, useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit'
import { Transaction } from "@mysten/sui/transactions";
import { networkConfig, suiClient } from "@/contracts";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { EncryptedObject, getAllowlistedKeyServers, SealClient, SessionKey } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import { useState } from 'react';


export default function TestPage() {
    // 使用 useState 管理状态
    const [voteID, setVoteID] = useState<string>('0x06060af46a792e2eb941e8689894a6d8b337bffe3ec7a801e6a57462c6757e3e');
    const [allowlistID, setAllowlistID] = useState<string>('0x06ecbe91fd8d3ff0dfee03f7b49640d84f426f7cf782f9bbb851c4634bda830c');
    const [allowlistCap, setAllowlistCap] = useState<string>('');
    const [encryptedBytes, setEncryptedBytes] = useState<number[]>([]);
    const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
    const [storedEncryptedVote, setStoredEncryptedVote] = useState<Uint8Array | null>(null);

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

        console.log("加密后的数据：", encryptedBytes);
        return encryptedBytes;
    }

    const encryptedVoteData = async (voteId: string) => {

        if (!currentAccount) {
            throw new Error("请先连接钱包");
        }

        const nonce = crypto.getRandomValues(new Uint8Array(5));
        const policyObjectBytes = fromHex(voteId);
        const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

        // 模拟投票数据
        const MOCK_VOTE_DATA = {
            option: 0
        };

        // 将对象转换为Uint8Array
        const encoder = new TextEncoder();
        const serializedData = encoder.encode(JSON.stringify(MOCK_VOTE_DATA));


        const { encryptedObject } = await sealClient.encrypt({
            demType: 1,
            threshold: 2,
            id,
            packageId: networkConfig.testnet.variables.packageID,
            data: serializedData,
            aad: fromHex(currentAccount?.address)
        });

        return encryptedObject;
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

    //============================================================================

    //======================Button Handler========================================


    // ===================CREATE TX====================
    const createAllowListTx = async (voteID: string) => {
        const tx = new Transaction();

        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "allowlist",
            function: "create_allowlist_entry",
            arguments: [
                tx.object(voteID),
            ],
        });
        return tx;
    }

    const createVotePoolTx = async () => {

        //Mock Data
        const title = "Sherry's Vote";
        const start = Math.floor(Date.now() / 1000);         // 当前时间戳
        const end = start + 3 * 24 * 60 * 60;                // 三天后
        const threshold = 2;

        const keyServers = getAllowlistedKeyServers("testnet");

        const tx = new Transaction();
        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "shadowvote",
            function: "create_vote_pool",
            arguments: [
                tx.pure.string(title),
                tx.pure.u64(start),
                tx.pure.u64(end),
                tx.pure.vector('id', keyServers),
                tx.pure.u8(threshold)
            ],
        });

        // tx.moveCall({
        //     package: networkConfig.testnet.variables.packageID,
        //     module: "shadowvote",
        //     function: "fullfill_votepool",
        //     arguments: [
        //         tx.pure.vector('u8', [1, 2, 3]),
        //         voteID,
        //     ],
        // });


        return tx;
    }


    const createAllowlistAndFullFillVotePoolTx = async (voteID: string) => {

        //create allow list
        console.log("tx2 start");
        const tx = new Transaction();
        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "allowlist",
            function: "create_allowlist_entry",
            arguments: [
                tx.object(voteID)
            ],
        });

        //encrypted vote pool data
        const encryptedVote = await encryptedVotePoolData(voteID);

        console.log("encryptVotes is", encryptedVote);


        //add data tp votepool
        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "shadowvote",
            function: "fullfill_votepool",
            arguments: [
                tx.pure.vector('u8', encryptedVote),
                tx.object(voteID)
            ],
        });

        return tx;
    }

    const createFullFillPollTx = async (alID: string, voteID: string) => {

        //const tx = new Transaction();

        const encryptedVote = await encryptedVotePoolData(alID);

        console.log(encryptedVote);

        setStoredEncryptedVote(encryptedVote);

        // tx.moveCall({
        //     package: networkConfig.testnet.variables.packageID,
        //     module: "shadowvote",
        //     function: "fullfill_votepool",
        //     arguments: [
        //         tx.pure.vector('u8', encryptedVote),
        //         tx.object(voteID)
        //     ],
        // });

        //return tx;
    }

    const fetchEncryptedVoteData = async (voteID: string) => {
        const tx = new Transaction();
        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "shadowvote",
            function: "fetch_vote_pool_data",
            arguments: [
                tx.object(voteID),
            ],
        });

        const devResult = await suiClient.devInspectTransactionBlock({
            sender: currentAccount.address,
            transactionBlock: tx,
        });

        const returnValue = devResult.results?.[0]?.returnValues?.[0];
        if (returnValue) {
            const [bytes] = returnValue;
            //const object = EncryptedObject.parse(new Uint8Array(bytes));
            setEncryptedBytes(bytes);
            console.log("加密后的数据：", new Uint8Array(bytes));
            //console.log("转化的数据：", object);

        } else {
            console.log("❌ 没有返回值");
        }

        return tx;
    }

    const decrptedVotePoolData = async () => {
        console.log("开始解密流程");
        if (!currentSessionKey) {
            throw new Error("SessionKey not initialized");
        }

        if (!storedEncryptedVote) {
            throw new Error("No encrypted vote data available");
        }

        console.log("创建交易...");
        const tx = new Transaction();

        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "allowlist",
            function: "seal_approve",
            arguments: [
                tx.pure.vector('u8', fromHex(allowlistID)),
                tx.object(allowlistID)
            ],
        });

        console.log("构建交易...");
        const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

        console.log("准备解密数据:", {
            hasStoredEncryptedVote: !!storedEncryptedVote,
            storedEncryptedVoteLength: storedEncryptedVote?.length,
            hasSessionKey: !!currentSessionKey,
            hasTxBytes: !!txBytes
        });

        const decryptedBytes = await sealClient.decrypt({
            data: storedEncryptedVote,
            sessionKey: currentSessionKey,
            txBytes,
        });

        console.log("解密完成，结果:", decryptedBytes);
        return decryptedBytes;
    }

    const castVoteTx = async (voteID: string, alID: string) => {

        const tx = new Transaction();

        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "allowlist",
            function: "seal_approve",
            arguments: [
                tx.object(voteID),
                tx.object(alID)
            ],
        })

        const txBytes = tx.build({ client: suiClient, onlyTransactionKind: true });

        const decryptedBytes = await sealClient.decrypt({
            data: new Uint8Array(encryptedBytes),
            sessionKey,
            txBytes,
        });

        const encryptedVote = await encryptedVoteData(voteID);


        const tx2 = new Transaction();
        tx2.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "shadowvote",
            function: "cast_vote",
            arguments: [
                tx2.object(voteID),
                tx2.pure.vector('u8', encryptedVote),
                tx2.object('0x6')
            ],
        });

        return tx2;

    }

    //==================================================

    const handleCreateVote = async () => {
        // const tx = await createVotePoolTx();
        // signAndExecute({
        //     transaction: tx.serialize(),
        // }, {
        //     onSuccess: async (result) => {
        //         const id = result.effects?.created?.[0]?.reference?.objectId;
        //         if (id !== undefined) {
        //             console.log("Created object:", id);
        //             setVoteID(id);
        //         } else {
        //             console.error("Failed to retrieve object ID");
        //         }
        //     }
        // });
        await encryptedVotePoolData(voteID);
    }

    const handleCastVote = async () => {
        const tx = await castVoteTx(voteID, allowlistID);
        signAndExecute({
            transaction: tx.serialize(),
        }, {
            onSuccess: (result) => {
                console.log('交易成功:', result);
                alert('操作成功完成!');
            },
            onError: (error) => {
                console.error('交易失败:', error);
                alert('交易失败: ' + error.message);
            },
        }

        );
    }

    const handleFetchVoteData = async () => {
        const sessionKey = new SessionKey({
            address: currentAccount.address,
            packageId: networkConfig.testnet.variables.packageID,
            ttlMin: 10,
        });
        try {
            console.log("开始处理...");
            signPersonalMessage(
                {
                    message: sessionKey.getPersonalMessage(),
                },
                {
                    onSuccess: async (result) => {
                        try {
                            console.log("签名成功，开始设置 SessionKey");
                            setCurrentSessionKey(sessionKey);

                            console.log("设置签名...");
                            await sessionKey.setPersonalMessageSignature(result.signature);

                            console.log("获取加密数据...");
                            await fetchEncryptedVoteData(voteID);

                            // console.log("开始解密数据...");
                            // await decrptedVotePoolData().catch(error => {
                            //     console.error("解密过程出错:", error);
                            //     throw error;
                            // });
                        } catch (error) {
                            console.error("处理过程出错:", error);
                            throw error;
                        }
                    },
                    onError: (error) => {
                        console.error("签名过程出错:", error);
                    }
                },
            );
        } catch (error) {
            console.error("整体流程出错:", error);
        }
    };

    // signAndExecute({
    //     transaction: tx.serialize(),
    // }, {
    //     onSuccess: (result) => {
    //         console.log('交易成功:', result);
    //         alert('操作成功完成!');
    //     },
    //     onError: (error) => {
    //         console.error('交易失败:', error);
    //         alert('交易失败: ' + error.message);
    //     },
    // }

    // );


    const handleCreateAL = async () => {
        console.log(voteID);
        const tx = await createAllowListTx(voteID);

        signAndExecute({
            transaction: tx.serialize(),
        }, {
            onSuccess: (result) => {
                console.log('交易成功:', result);
                const allowlistObject = result.effects?.created?.find(
                    (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
                );
                const newAllowlistID = allowlistObject?.reference?.objectId ?? '';
                setAllowlistID(newAllowlistID);

                // 查找属于当前用户的对象
                const ownedObject = result.effects?.created?.find(
                    (item) => item.owner && typeof item.owner === 'object' &&
                        'AddressOwner' in item.owner &&
                        item.owner.AddressOwner === (currentAccount?.address ?? '')
                );
                const newAllowlistCap = ownedObject?.reference?.objectId ?? '';
                setAllowlistCap(newAllowlistCap);
            },
            onError: (error) => {
                console.error('交易失败:', error);
                alert('交易失败: ' + (error.message ?? '未知错误'));
            }
        });
    }

    const handleFullFillVotePool = async () => {
        await createFullFillPollTx(allowlistID, voteID);
        // signAndExecute({
        //     transaction: tx.serialize(),
        // }, {
        //     onSuccess: (result) => {
        //         console.log('交易成功:', result);
        //         alert('操作成功完成!');
        //     },
        //     onError: (error) => {
        //         console.error('交易失败:', error);
        //         alert('交易失败: ' + error.message);
        //     },
        // }

        // );
    }

    //==============================================


    return (
        <div className="container mx-auto p-4">

            <ConnectButton />
            <button
                onClick={handleCreateVote}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                加密投票池
            </button>
            <button
                onClick={handleCreateAL}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                2. 创建名单
            </button>

            <button
                onClick={handleFullFillVotePool}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                3. 载入加密池信息
            </button>

            <button
                onClick={handleFetchVoteData}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                4. 获取加密池信息
            </button>

            <button
                onClick={handleCastVote}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                5. 投票
            </button>
        </div>
    );
}