"use client";

// 环境变量 - 使用本地API代理
const API_PROXY = "/api/proxy";
const WALRUS_BASE_URL = "https://walrus.testnet.sui.io";

/**
 * 将二进制数据上传到Walrus服务
 * @param blobData - 要上传的二进制数据（ArrayBuffer）
 * @param fileName - 可选的文件名，用于日志记录
 * @param fileSize - 可选的文件大小，用于日志记录
 * @returns 成功时返回blobId，失败时返回false
 */
export const uploadBlobToWalrus = async (
  blobData: ArrayBuffer | Blob,
  fileName: string = "unknown",
  fileSize: number = 0
): Promise<string | false> => {
  try {
    // 确保数据是ArrayBuffer类型
    let fileContent: ArrayBuffer;
    
    if (blobData instanceof Blob) {
      // 如果是Blob类型，转换为ArrayBuffer
      fileContent = await blobData.arrayBuffer();
    } else {
      fileContent = blobData;
    }
    
    // 日志记录
    const displaySize = fileSize || (fileContent ? fileContent.byteLength : 0);
    console.log(`准备上传数据: ${fileName}, 大小: ${formatFileSize(displaySize)}`);
    
    // 发送数据到API代理
    const response = await fetch(API_PROXY, {
      method: 'PUT',
      body: fileContent,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text().catch(() => "无法获取详细错误信息");
      console.error(`上传失败: 状态码 ${response.status}, 错误: ${errorText}`);
      return false;
    }
    
    // 解析响应
    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.error("解析响应JSON失败:", jsonErr);
      return false;
    }
    
    // 验证并处理响应
    if (data?.newlyCreated?.blobObject?.blobId) {
      console.log("上传成功, Blob ID:", data.newlyCreated.blobObject.blobId);
      return data.newlyCreated.blobObject.blobId;
    } else {
      console.error("响应数据结构不符合预期:", data);
      return false;
    }
  } catch (err) {
    console.error("上传过程中出现错误:", err);
    return false;
  }
};

/**
 * 从文件对象上传到Walrus服务
 * @param file - 文件对象
 * @returns 成功时返回blobId，失败时返回false
 */
export const uploadFileToWalrus = async (file: File): Promise<string | false> => {
  try {
    // 读取文件内容
    const fileContent = await readFileAsArrayBuffer(file);
    
    if (!fileContent) {
      throw new Error("无法读取文件内容");
    }
    
    // 调用主上传函数
    return await uploadBlobToWalrus(fileContent, file.name, file.size);
  } catch (err) {
    console.error("文件上传错误:", err);
    return false;
  }
};

/**
 * 辅助函数 - 读取文件为ArrayBuffer
 * @param file - 要读取的文件
 * @returns ArrayBuffer或null
 */
const readFileAsArrayBuffer = async (file: File): Promise<ArrayBuffer | null> => {
  try {
    return await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("无法获取文件内容，格式不正确"));
        }
      };
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsArrayBuffer(file);
    });
  } catch (fileErr) {
    console.error("文件读取错误:", fileErr);
    return null;
  }
};

/**
 * 辅助函数 - 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的文件大小字符串
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

/**
 * 从Walrus服务下载文件内容
 * @param blobId - 要下载的blob ID
 * @returns ArrayBuffer格式的文件内容，失败时返回null
 */
export const downloadFromWalrus = async (blobId: string): Promise<ArrayBuffer | null> => {
  try {
    console.log(`开始下载Blob: ${blobId}`);
    
    // 构建下载URL - 使用新的动态路由格式
    const downloadUrl = `${API_PROXY}/${blobId}`;
    
    // 发送GET请求获取数据
    const response = await fetch(downloadUrl, {
      method: 'GET',
      cache: 'no-cache'
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text().catch(() => "无法获取详细错误信息");
      console.error(`下载失败: 状态码 ${response.status}, 错误: ${errorText}`);
      return null;
    }
    
    // 获取响应体的ArrayBuffer
    const data = await response.arrayBuffer();
    console.log(`下载成功, 大小: ${formatFileSize(data.byteLength)}`);
    
    return data;
  } catch (err) {
    console.error("下载过程中出现错误:", err);
    return null;
  }
};

/**
 * 直接在浏览器中打开下载链接
 * @param blobId - 要下载的blob ID
 * @param filename - 可选的文件名，用于保存文件
 * @returns 是否成功启动下载
 */
export const openDownloadLink = (blobId: string, filename?: string): boolean => {
  try {
    // 构建直接下载链接
    const downloadUrl = `${WALRUS_BASE_URL}/download/${blobId}`;
    
    // 创建一个隐藏的a标签用于下载
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    
    // 如果提供了文件名，设置下载属性
    if (filename) {
      a.download = filename;
    } else {
      // 否则在新标签页中打开
      a.target = '_blank';
    }
    
    // 添加到文档中并点击
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    console.log(`已触发下载: ${blobId}${filename ? ', 文件名: ' + filename : ''}`);
    
    return true;
  } catch (err) {
    console.error("启动下载时出错:", err);
    return false;
  }
};

/**
 * 将Blob内容另存为本地文件
 * @param data - ArrayBuffer或Blob数据
 * @param filename - 要保存的文件名
 */
export const saveAsFile = (data: ArrayBuffer | Blob, filename: string): void => {
  try {
    // 确保数据是Blob类型
    const blob = data instanceof Blob ? data : new Blob([data]);
    
    // 创建下载URL
    const url = window.URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    // 添加到文档并点击
    document.body.appendChild(a);
    a.click();
    
    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log(`文件已保存: ${filename}, 大小: ${formatFileSize(blob.size)}`);
  } catch (err) {
    console.error("保存文件时出错:", err);
  }
};

/**
 * 综合下载功能 - 下载并保存文件
 * @param blobId - 要下载的blob ID
 * @param filename - 保存的文件名
 * @returns 是否成功下载并保存
 */
export const downloadAndSaveFile = async (blobId: string, filename: string): Promise<boolean> => {
  try {
    // 下载文件内容
    const fileData = await downloadFromWalrus(blobId);
    
    if (!fileData) {
      console.error("无法获取文件内容");
      return false;
    }
    
    // 保存文件
    saveAsFile(fileData, filename);
    return true;
  } catch (err) {
    console.error("下载和保存过程中出错:", err);
    return false;
  }
};
