"use client";

import { Transaction } from '@mysten/sui/transactions';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import config from '@/config/config';

/**
 * 上传文件到合约
 * @param signAndExecute 签名和执行交易的函数，从组件中获取
 * @param param1 第一个参数 (通常是"testgo")
 * @param param2 第二个参数 (通常是文件名)
 * @param collectionObjectId 集合对象ID
 * @param coinObjectId 支付对象ID
 * @returns Promise<boolean> 交易是否成功
 */
export const uploadFileToContract = async (
  signAndExecute: any,
  param1: string, 
  param2: string,
  collectionObjectId: string = config.WalrusStorageInfo,
  coinObjectId: string = "0x8"
): Promise<boolean> => {
  try {
    // 创建交易块
    const txb = new Transaction();
    
    // 调用合约函数
    txb.moveCall({
      target: `${config.SuiPack}::${config.MODULE_NAME}::${config.FUNCTION_NAME}`,
      arguments: [
        txb.object(collectionObjectId),
        txb.pure.string(param1),
        txb.pure.string(param2),
        txb.object(coinObjectId)
      ],
    });

    // 返回一个Promise
    return new Promise((resolve, reject) => {
      // 签名并执行交易
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: (data: any) => {
            console.log("交易成功:", data.digest);
            console.log("交易成功详情:", data);
            resolve(true);
          },
          onError: (err: Error) => {
            console.error("交易错误:", err);
            resolve(false);
          }
        }
      );
    });
  } catch (err: any) {
    console.error("创建交易错误:", err);
    return false;
  }
};

/**
 * //获取取件码操作（不实际执行交易）
 * @param suiClient SUI 客户端实例
 * @param pickupCode 提货码
 * @param collectionObjectId 集合对象ID
 * @returns Promise<any> 交易检查结果
 */
export const inspectTransaction = async (
  suiClient: any,
  peo:string,
  collectionObjectId: string = config.WalrusStorageInfo
): Promise<any> => {
  try {
    // 创建交易块
    const txb = new TransactionBlock();
    
    // 配置交易调用
    txb.moveCall({
      target: `${config.SuiPack}::${config.MODULE_NAME}::get_pickup_code_list`,
      arguments: [
        txb.object(collectionObjectId),
        txb.pure.address(peo),
      ],
    });

    // 执行检查
    const txDetails = await suiClient.devInspectTransactionBlock({
      sender: peo,
      transactionBlock: txb,
    });

    // 输出结果
    console.log("交易检查结果:", txDetails);
    
    // 打印详细信息
    if (txDetails.results && txDetails.results[0]?.mutableReferenceOutputs?.[0]) {
      console.log("交易检查详情 (完整1): " + JSON.stringify(txDetails.results[0].mutableReferenceOutputs[0][1], null, 2));
    } else {
      console.log("交易检查详情 (完整2): " + JSON.stringify(txDetails, null, 2));
      
    }
    
    return txDetails;
  } catch (err: any) {
    console.error("交易检查错误:", err);
    throw err;
  }
};

/**
 * //获取id操作（不实际执行交易）
 * @param suiClient SUI 客户端实例
 * @param pop 可选的发送者地址，如果未提供则使用默认地址
 * @param collectionObjectId 集合对象ID
 * @param blobId 文件id
 * @returns Promise<any> 交易检查结果
 */
export const inspectTransaction1 = async (
  suiClient: any,
  pop?: string,
  collectionObjectId: string = config.WalrusStorageInfo,
  blobId?: string,
): Promise<any> => {
  try {
    // 检查必要参数
    if (!blobId) {
      throw new Error("未提供blobId参数");
    }
    
    // 如果未提供sender地址，使用默认地址
    const sender = pop;
    
    console.log(`执行交易检查 - 使用地址: ${sender}`);
    
    // 创建交易块
    const txb = new TransactionBlock();
    
    // 配置交易调用
    txb.moveCall({
      target: `${config.SuiPack}::${config.MODULE_NAME}::get_blob_id_from_pickup_code`,
      arguments: [
        txb.object(collectionObjectId),
        txb.pure.string(blobId),
      ],
    });

    // 执行检查
    const txDetails = await suiClient.devInspectTransactionBlock({
      sender: sender,
      transactionBlock: txb,
    });

    // 输出结果
    console.log("交易检查结果:", txDetails);
    
    // 打印详细信息
    if (txDetails.results && txDetails.results[0]?.mutableReferenceOutputs?.[0]) {
      console.log("交易检查详情 (完整1): " + JSON.stringify(txDetails.results[0].mutableReferenceOutputs[0][1], null, 2));
    } else {
      console.log("交易检查详情 (完整2): " + JSON.stringify(txDetails, null, 2));
      
    }
    
    return txDetails;
  } catch (err: any) {
    console.error("交易检查错误:", err);
    throw err;
  }
};

/**
 * 从合约下载文件
 * @param signAndExecute 签名和执行交易的函数，从组件中获取
 * @param param1 第一个参数 (通常是"testgo")
 * @param blobId 第二个参数 (文件的blobId)
 * @param collectionObjectId 集合对象ID
 * @param coinObjectId 支付对象ID
 * @returns Promise<boolean> 交易是否成功
 */
export const downloadFileFromContract = async (
  signAndExecute: any,
  blobId: string,
  collectionObjectId: string = config.WalrusStorageInfo,
): Promise<boolean> => {
  try {
    // 创建交易块
    const txb = new Transaction();
    
    // 调用合约函数
    txb.moveCall({
      target: `${config.SuiPack}::${config.MODULE_NAME}::${config.FUNCTION_NAME2}`,
      arguments: [
        txb.object(collectionObjectId),
        txb.pure.string(blobId),
      ],
    });

    // 返回一个Promise
    return new Promise((resolve, reject) => {
      // 签名并执行交易
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: (data: any) => {
            console.log("下载交易成功:", data.digest);
            console.log("下载交易成功详情:", data);
            resolve(true);
          },
          onError: (err: Error) => {
            console.error("下载交易错误:", err);
            resolve(false);
          }
        }
      );
    });
  } catch (err: any) {
    console.error("创建下载交易错误:", err);
    return false;
  }
};

/**
 * 检查提货码交易（获取blob ID）- 不实际执行交易
 * @param suiClient SUI 客户端实例
 * @param pickupCode 提货码
 * @param collectionObjectId 集合对象ID
 * @returns Promise<any> 交易检查结果
 */
export const inspectPickupCodeTransaction = async (
  suiClient: SuiClient,
  pickupCode: string,
  pop?: string,
  collectionObjectId: string = config.WalrusStorageInfo
): Promise<any> => {
  try {
    // 创建交易块
    const txb = new TransactionBlock();
    
    // 配置交易调用
    txb.moveCall({
      target: `${config.SuiPack}::${config.MODULE_NAME}::get_blob_id_from_pickup_code`,
      arguments: [
        txb.object(collectionObjectId),
        txb.pure.string(pickupCode),
      ],
    });

    // 执行检查
    const txDetails = await suiClient.devInspectTransactionBlock({
      sender: pop || "",
      transactionBlock: txb,
    });

    // 输出结果
    console.log("提货码检查结果:", txDetails);
    
    // 打印详细信息
    if (txDetails.results && txDetails.results[0]?.returnValues) {
      console.log("提货码检查详情 (返回值): " + JSON.stringify(txDetails.results[0].returnValues, null, 2));
    } else {
      console.log("提货码检查详情 (完整): " + JSON.stringify(txDetails, null, 2));
    }
    
    return txDetails;
  } catch (err: any) {
    console.error("提货码检查错误:", err);
    throw err;
  }
};


