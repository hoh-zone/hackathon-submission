export function useCrypto() {
  // 加密文件
  const encryptFile = async (file: File, password: string) => {
    // 读取文件内容
    const fileBuffer = await file.arrayBuffer();

    // 生成密钥
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    // 使用 PBKDF2 派生密钥
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    // 生成初始化向量
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 加密数据
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      fileBuffer
    );

    // 组合 salt, iv 和加密数据
    const result = new Uint8Array(
      salt.length + iv.length + encryptedData.byteLength
    );
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return new File([result], file.name, { type: file.type });
  };
  // 解密文件
  const decryptFile = async (encryptedArray: Uint8Array<ArrayBuffer>, password: string) => {
    // 读取加密数据
    // const encryptedBuffer = await encryptedBlob.arrayBuffer();
    // const encryptedArray = new Uint8Array(encryptedBuffer);

    // 提取 salt, iv 和加密数据
    const salt = encryptedArray.slice(0, 16);
    const iv = encryptedArray.slice(16, 16 + 12);
    const data = encryptedArray.slice(16 + 12);

    // 生成密钥
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    // 派生密钥
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // 解密数据
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );
    return decryptedData;
  };
  return {
    encryptFile,
    decryptFile,
  };
}
