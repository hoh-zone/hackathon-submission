// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { SealClient } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { getAllowlistedKeyServers } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { TESTNET_COUNTER_PACKAGE_ID } from "@/utils/constants";
// import type { SuiClient } from "@mysten/sui/client";

// 定义数据结构类型
export type WalrusData = {
  status: string;
  blobId: string;
  endEpoch: string;
  suiRefType: string;
  suiRef: string;
  suiBaseUrl: string;
  blobUrl: string;
  suiUrl: string;
  isImage: boolean;
};

// Walrus服务类型
export type WalrusService = {
  id: string;
  name: string;
  publisherUrl: string;
  aggregatorUrl: string;
};

// 存储信息类型定义
export type StorageInfo = {
  alreadyCertified?: {
    blobId: string;
    endEpoch: string;
    event: {
      txDigest: string;
    };
  };
  newlyCreated?: {
    blobObject: {
      blobId: string;
      storage: {
        endEpoch: string;
      };
      id: string;
    };
  };
};

// 默认Walrus服务
export const walrusServices: WalrusService[] = [
  {
    id: "service1",
    name: "walrus.space",
    publisherUrl: "/publisher1",
    aggregatorUrl: "/aggregator1",
  },
  {
    id: "service2",
    name: "staketab.org",
    publisherUrl: "/publisher2",
    aggregatorUrl: "/aggregator2",
  },
  {
    id: "service3",
    name: "redundex.com",
    publisherUrl: "/publisher3",
    aggregatorUrl: "/aggregator3",
  },
  {
    id: "service4",
    name: "nodes.guru",
    publisherUrl: "/publisher4",
    aggregatorUrl: "/aggregator4",
  },
  {
    id: "service5",
    name: "banansen.dev",
    publisherUrl: "/publisher5",
    aggregatorUrl: "/aggregator5",
  },
  {
    id: "service6",
    name: "everstake.one",
    publisherUrl: "/publisher6",
    aggregatorUrl: "/aggregator6",
  },
];

// 常量
const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`;
const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;
const NUM_EPOCH = 1;

/**
 * 获取Walrus聚合器URL
 */
export function getAggregatorUrl(serviceId: string, path: string): string {
  const service = walrusServices.find((s) => s.id === serviceId);
  const cleanPath = path.replace(/^\/+/, "").replace(/^v1\//, "");
  return `${service?.aggregatorUrl}/v1/${cleanPath}`;
}

/**
 * 获取Walrus发布者URL
 */
export function getPublisherUrl(serviceId: string, path: string): string {
  const service = walrusServices.find((s) => s.id === serviceId);
  const cleanPath = path.replace(/^\/+/, "").replace(/^v1\//, "");
  return `${service?.publisherUrl}/v1/${cleanPath}`;
}

/**
 * 将数据加密并上传到Walrus服务
 */
export async function encryptAndUploadToWalrus(
  file: File,
  policyObject: string,
  suiClient: unknown, // 使用unknown类型，然后在函数内部使用类型断言
  serviceId: string = "service1" // 默认使用第一个服务
): Promise<WalrusData> {
  // 创建SealClient
  const client = new SealClient({
    suiClient: suiClient as any, // 使用any类型断言解决版本兼容问题
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });

  // 读取文件内容
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (event) {
      if (event.target && event.target.result) {
        const result = event.target.result;
        if (result instanceof ArrayBuffer) {
          try {
            // 生成随机数
            const nonce = crypto.getRandomValues(new Uint8Array(5));
            const policyObjectBytes = fromHex(policyObject);
            const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
            
            // 加密数据
            const { encryptedObject: encryptedBytes } = await client.encrypt({
              threshold: 2,
              packageId: TESTNET_COUNTER_PACKAGE_ID,
              id,
              data: new Uint8Array(result),
            });
            
            // 存储加密数据
            const storageInfo = await storeBlob(encryptedBytes, serviceId);
            
            // 构建并返回结果
            const walrusData = formatUploadResult(storageInfo.info, file.type);
            resolve(walrusData);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("Unexpected result type: " + typeof result));
        }
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 存储加密后的Blob数据到Walrus服务
 */
async function storeBlob(encryptedData: Uint8Array, serviceId: string) {
  const response = await fetch(
    `${getPublisherUrl(serviceId, `/v1/blobs?epochs=${NUM_EPOCH}`)}`,
    {
      method: "PUT",
      body: encryptedData,
    }
  );
  
  if (response.status === 200) {
    const info = await response.json();
    return { info };
  } else {
    throw new Error("存储Blob数据到Walrus失败！请尝试其他Walrus服务。");
  }
}

/**
 * 格式化上传结果为易于使用的对象
 */
function formatUploadResult(storage_info: StorageInfo, media_type: string): WalrusData {
  let info: WalrusData;
  
  if ("alreadyCertified" in storage_info && storage_info.alreadyCertified) {
    info = {
      status: "Already certified",
      blobId: storage_info.alreadyCertified.blobId,
      endEpoch: storage_info.alreadyCertified.endEpoch,
      suiRefType: "Previous Sui Certified Event",
      suiRef: storage_info.alreadyCertified.event.txDigest,
      suiBaseUrl: SUI_VIEW_TX_URL,
      blobUrl: getAggregatorUrl(
        "service1", // 默认使用service1
        `/v1/blobs/${storage_info.alreadyCertified.blobId}`
      ),
      suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.alreadyCertified.event.txDigest}`,
      isImage: media_type.startsWith("image"),
    };
  } else if ("newlyCreated" in storage_info && storage_info.newlyCreated) {
    info = {
      status: "Newly created",
      blobId: storage_info.newlyCreated.blobObject.blobId,
      endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
      suiRefType: "Associated Sui Object",
      suiRef: storage_info.newlyCreated.blobObject.id,
      suiBaseUrl: SUI_VIEW_OBJECT_URL,
      blobUrl: getAggregatorUrl(
        "service1", // 默认使用service1
        `/v1/blobs/${storage_info.newlyCreated.blobObject.blobId}`
      ),
      suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.newlyCreated.blobObject.id}`,
      isImage: media_type.startsWith("image"),
    };
  } else {
    throw Error("Unhandled successful response!");
  }
  
  return info;
}

/**
 * 创建关联加密数据到Sui对象的交易
 * 返回值使用any类型以避免Transaction版本兼容性问题
 */
export function createPublishBlobTransaction(
  policyObject: string,
  // capId: string,
  moduleName: string,
  blobId: string,
  packageId: string,
  difficulty?: string
): any {
  const tx = new Transaction();
  
  // 判断是否提供了difficulty参数
  if (difficulty) {
    // 使用publish_with_difficulty函数
    tx.moveCall({
      target: `${packageId}::${moduleName}::publish_with_difficulty`,
      arguments: [
        tx.object(policyObject),
        tx.pure.string(blobId),
        tx.pure.string(difficulty),
      ],
    });
  } else {
    // 使用基本的publish函数
    tx.moveCall({
      target: `${packageId}::${moduleName}::publish`,
      arguments: [
        tx.object(policyObject),
        tx.pure.string(blobId),
      ],
    });
  }
  
  tx.setGasBudget(10000000);
  return tx;
}

/**
 * 创建查询指定难度的题目Blob列表的交易
 * 注意：实际查询结果需要通过前端事件索引实现
 * @param difficulty 题目难度级别
 * @param packageId 包ID
 * @param moduleName 模块名称，通常为"seal_quiz_walrus"
 * @returns Transaction 交易对象
 */
export function createQueryBlobsTransaction(
  difficulty: string,
  packageId: string,
  moduleName: string = "seal_quiz_walrus"
): Transaction {
  const tx = new Transaction();
  
  // 调用query_blobs_by_difficulty方法
  tx.moveCall({
    target: `${packageId}::${moduleName}::query_blobs_by_difficulty`,
    arguments: [
      tx.pure.string(difficulty),
    ],
  });
  
  tx.setGasBudget(10000000);
  return tx;
} 