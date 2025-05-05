'use client'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from "@mysten/sui/transactions";
import { networkConfig, suiClient } from "@/contracts";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import { bcs } from '@mysten/sui/bcs';
import { type TransactionEffects } from '@mysten/sui/client';
import { object } from 'zod';

export default function TestPage() {

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

    const allowListObjectId = "0x49be5f7bb103dd0d6cb69dd51823ac9efa52b1d74858a9d1e39ab9301dd48a1c";
    const allowlistCapId = "0x5a61526a1337056a808c624e0fdefbe3fed6273bef7b90ef02c5b7d38dba6fb8";

    const votePoolId = "0x355e427c56e13bb36005c3e46528607c810962051f7f7c9a18432cf45ce5db7b";
    const currentAccount = useCurrentAccount();
    const sealClient = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers("testnet"),
        verifyKeyServers: false
    });
    //=======================Encrypt and DeCrypt=========================

    const encryptedVoteData = async (voteId: string) => {

        if (!currentAccount) {
            throw new Error("请先连接钱包");
        }

        const nonce = crypto.getRandomValues(new Uint8Array(5));
        const policyObjectBytes = fromHex(voteId);
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
    const handleCreateVote = async () => {


        const tx = await createVotePoolTx();

        signAndExecute({
            transaction: tx.serialize(),
        }, {
            onSuccess: async (result) => {
                const id = result.effects?.created?.[0]?.reference?.objectId;
                console.log("Created object:", id);

                if (!id) {
                    console.error("没有创建新对象");
                    return;
                }

                // 创建第二个交易，使用第一个交易生成的 objectId
                const tx2 = await createAllowlistAndFullFillVotePoolTx(id);

                // 第二个交易
                await signAndExecute({
                    transaction: tx2.serialize(),
                }, {
                    onSuccess: async (result) => {
                        console.log(result);
                        // 查找共享对象
                        const allowlistObject = result.effects?.created?.find(
                            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
                        );
                        const allowlistID = allowlistObject?.reference?.objectId;

                        // 查找属于当前用户的对象
                        const ownedObject = result.effects?.created?.find(
                            (item) => item.owner && typeof item.owner === 'object' &&
                                'AddressOwner' in item.owner &&
                                item.owner.AddressOwner === currentAccount?.address
                        );
                        const ownedObjectID = ownedObject?.reference?.objectId;

                        console.log("第二笔交易成功");
                        console.log("AllowList ID (shared): ", allowlistID);
                        console.log("Owned Object ID: ", ownedObjectID);
                    },
                    onError: (error) => {
                        console.error("第二笔交易失败:", error);
                    }
                });
            },
            onError: (error) => {
                console.error('第一笔交易失败:', error);
            },
        });

    }

    const handleCastVote = async () => {
        const tx = await castVoteTx();
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

    const handleAddAllowList = async () => {
        const tx = await addAlloListTx();
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

    //==============================================


    // ===================CREATE TX====================
    const addAlloListTx = async () => {
        const tx = new Transaction();

        tx.moveCall({
            package: networkConfig.testnet.variables.packageID,
            module: "allowlist",
            function: "add",
            arguments: [
                tx.object(allowListObjectId),
                tx.object(allowlistCapId),
                tx.pure.address("0xd83dda8dcdae875933dc6c1814a08e0a3e62204aeac2314a0bba0a0be757fc97")
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


        // const result = await suiClient.devInspectTransactionBlock({
        //     sender: "0xd3ee8aae11bfeb88185f13e3166a8856b95e7c7ca100c0d03412175c2e277802",
        //     transactionBlock: tx
        // });

        // //const returnValue = (result.results?.[0]?.returnValues?.[0] as unknown) as number[];
        // const voteObjectID = '0x' + Buffer.from([212, 209, 196, 139, 58, 187, 216, 143, 244, 194, 243, 60, 222, 139, 63, 98, 217, 169, 53, 37, 57, 207, 37, 216, 3, 97, 153, 239, 37, 194, 148, 206]).toString('hex');

        // console.log("🆔 VotePool Object ID:", voteObjectID);

        // console.log("🧪 devInspect result:", result);

        // tx.moveCall({
        //     package: networkConfig.testnet.variables.packageID,
        //     module: "allowlist",
        //     function: "create_allowlist_entry",
        //     arguments: [
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
        const encryptedVote = await encryptedVoteData(voteID);


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

    const castVoteTx = async () => {

        const tx = new Transaction();

        const encryptedVote = await encryptedVoteData();


        // 第一步：调用 parse_encrypted_object，把 bytes 转成 Move object
        // const parsedEncryptedObject = tx.moveCall({
        //     target: `${networkConfig.testnet.variables.packageID}::bf_hmac_encryption::parse_encrypted_object`,
        //     arguments: [tx.pure(encryptedVote)],
        // });

        const parsedEncryptedObject = tx.moveCall({
            target: `${networkConfig.testnet.variables.packageID}::bf_hmac_encryption::parse_encrypted_object`,
            arguments: [
                tx.pure.vector('u8', encryptedVote)
            ],
        });

        //第二步：调用 cast_vote，把 votePoolId 和 EncryptedObject 传进去
        tx.moveCall({
            target: `${networkConfig.testnet.variables.packageID}::shadowvote::cast_vote`,
            arguments: [
                tx.object(votePoolId),
                tx.object(parsedEncryptedObject) // 注意：这里用上一步的返回值
            ],
        });

        return tx;

    }

    //==================================================

    return (
        <div className="container mx-auto p-4">

            <ConnectButton />
            <button
                onClick={handleCreateVote}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                创建投票
            </button>
            <button
                onClick={handleAddAllowList}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                把自己加入AL
            </button>

            <button
                onClick={handleCastVote}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                投2号选项
            </button>
        </div>
    );
}