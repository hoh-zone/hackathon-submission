"use client";

import CryptoJS from 'crypto-js';

// PBKDF2参数
export const PBKDF2_ITERATIONS = 100000; // 迭代次数
export const SALT_LENGTH = 16; // 盐长度（字节）
export const IV_LENGTH = 16; // 初始向量长度（字节），对于AES必须是16字节

/**
 * 生成随机字节数组
 * @param length - 字节数组长度
 * @returns 随机字节数组
 */
export const generateRandomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

/**
 * 使用密码加密文件数据
 * @param fileData - 要加密的数据
 * @param password - 加密密码
 * @returns 加密后的数据，包含盐和IV
 */
export const encryptData = async (
  fileData: Uint8Array,
  password: string
): Promise<{
  encryptedBytes: Uint8Array;
  salt: Uint8Array;
  iv: Uint8Array;
}> => {
  // 生成随机盐和初始向量
  const salt = generateRandomBytes(SALT_LENGTH);
  const iv = generateRandomBytes(IV_LENGTH);
  
  // 将Uint8Array转换为WordArray (CryptoJS使用的格式)
  const fileWordArray = CryptoJS.lib.WordArray.create(fileData as any);
  const saltWordArray = CryptoJS.lib.WordArray.create(salt as any);
  const ivWordArray = CryptoJS.lib.WordArray.create(iv as any);
  
  // 从密码派生密钥
  const key = CryptoJS.PBKDF2(password, saltWordArray, {
    keySize: 256/32, // 256位密钥
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  });
  
  // 使用AES-CBC加密
  const encrypted = CryptoJS.AES.encrypt(fileWordArray, key, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  // 获取加密后的数据
  const encryptedData = CryptoJS.enc.Base64.parse(encrypted.toString());
  
  // 将盐和IV与加密数据合并
  // 格式: [盐(16字节)][IV(16字节)][加密数据]
  const saltBytes = CryptoJS.enc.Hex.parse(saltWordArray.toString());
  const ivBytes = CryptoJS.enc.Hex.parse(ivWordArray.toString());
  
  const combinedData = CryptoJS.lib.WordArray.create();
  combinedData.concat(saltBytes);
  combinedData.concat(ivBytes);
  combinedData.concat(encryptedData);
  
  // 转换为Uint8Array
  const encryptedBytes = wordArrayToUint8Array(combinedData);
  
  return {
    encryptedBytes,
    salt,
    iv
  };
};

/**
 * 解密数据
 * @param encryptedData - 加密的数据（包含盐和IV）
 * @param password - 解密密码
 * @returns 解密后的数据
 */
export const decryptData = async (
  encryptedData: ArrayBuffer,
  password: string
): Promise<Uint8Array> => {
  // 确保数据有效
  if (!encryptedData || encryptedData.byteLength <= SALT_LENGTH + IV_LENGTH) {
    throw new Error("加密数据无效或损坏");
  }
  
  // 转换ArrayBuffer为Uint8Array
  const encryptedBytes = new Uint8Array(encryptedData);
  
  // 从组合数据中分离出盐、IV和加密内容
  // 格式: [盐(16字节)][IV(16字节)][加密数据]
  const salt = encryptedBytes.slice(0, SALT_LENGTH);
  const iv = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encryptedContent = encryptedBytes.slice(SALT_LENGTH + IV_LENGTH);
  
  // 转换为CryptoJS格式
  const saltWordArray = CryptoJS.lib.WordArray.create(salt as any);
  const ivWordArray = CryptoJS.lib.WordArray.create(iv as any);
  const encryptedWordArray = CryptoJS.lib.WordArray.create(encryptedContent as any);
  
  // 使用PBKDF2派生密钥
  const key = CryptoJS.PBKDF2(password, saltWordArray, {
    keySize: 256/32, // 256位密钥
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  });
  
  // 构建AES加密对象
  const encryptedObj = CryptoJS.lib.CipherParams.create({
    ciphertext: encryptedWordArray
  });
  
  // 解密
  const decrypted = CryptoJS.AES.decrypt(
    encryptedObj, 
    key, 
    {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  
  // 转换为Uint8Array
  return wordArrayToUint8Array(decrypted);
};

/**
 * 从文件对象读取ArrayBuffer
 * @param file - 文件对象
 * @returns 文件内容的ArrayBuffer
 */
export const readFileAsArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // 确保结果是ArrayBuffer类型
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("无法获取文件内容，格式不正确"));
      }
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 将WordArray转换为Uint8Array
 * @param wordArray - CryptoJS WordArray对象
 * @returns Uint8Array
 */
export const wordArrayToUint8Array = (wordArray: CryptoJS.lib.WordArray): Uint8Array => {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  
  for(let i = 0; i < sigBytes; i++) {
    const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    u8[i] = byte;
  }
  
  return u8;
};

/**
 * 将Uint8Array转换为十六进制字符串
 * @param bytes - Uint8Array对象
 * @returns 十六进制字符串
 */
export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * 将Uint8Array转换为Base64字符串
 * @param bytes - Uint8Array对象
 * @returns Base64字符串
 */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * 将Base64字符串转换为Uint8Array
 * @param base64 - Base64字符串
 * @returns Uint8Array
 */
export const base64ToBytes = (base64: string): Uint8Array => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * 格式化文件大小为可读字符串
 * @param bytes - 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};
