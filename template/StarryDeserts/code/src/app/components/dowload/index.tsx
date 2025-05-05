"use client";

import React, { useState } from 'react';
import { FiSearch, FiInfo, FiFileText, FiDownload, FiLink } from 'react-icons/fi';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { inspectTransaction1 } from '@/utils/moveupload';
import { openDownloadLink, downloadAndSaveFile } from '@/utils/walrusupload';

export function SimpleDownloader() {
  const [blobId, setBlobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<{filename: string, blobId?: string}[]>([]);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  // 添加日志
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prevLogs => [...prevLogs, message]);
  };
  
  // 处理输入变化
  const handleBlobIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlobId(e.target.value);
    setError(null);
  };
  
  // 处理文件名变化
  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDownloadFilename(e.target.value);
  };
  
  // 将ASCII码数组转换为字符串
  const bytesToString = (bytes: number[]): string => {
    if (!Array.isArray(bytes)) return '非数组数据';
    
    try {
      // 将数字数组转换为Uint8Array，准备用TextDecoder处理
      const uint8Array = new Uint8Array(bytes);
      
      // 使用TextDecoder正确解码UTF-8编码的字节
      const decoder = new TextDecoder('utf-8');
      const decodedString = decoder.decode(uint8Array);
      
      addLog(`使用UTF-8解码: ${decodedString}`);
      return decodedString;
    } catch (error) {
      // 如果TextDecoder解码失败，回退到原始方法
      addLog(`UTF-8解码失败，回退到基本方法`);
      return bytes.map(code => String.fromCharCode(code)).join('');
    }
  };
  
  // 解析文件信息 - 修复的解析逻辑
  const parseFileInfos = (bytes: number[]): {filename: string, blobId?: string}[] => {
    if (!Array.isArray(bytes)) return [];
    
    // 将字节数组转换为完整字符串
    const fullString = bytesToString(bytes);
    addLog(`原始字符串: ${fullString}`);
    
    // 检查字节数组中是否包含DC2分隔符
    const containsDC2 = bytes.includes(18); // ASCII 18 是 DC2
    addLog(`是否包含DC2分隔符: ${containsDC2 ? '是' : '否'}`);
    
    // 如果输入以+号开头，移除它
    let processedString = fullString;
    if (processedString.startsWith('+')) {
      processedString = processedString.substring(1);
      addLog(`移除开头的+号: ${processedString}`);
    }
    
    // 显示字符串的ASCII码，帮助调试
    const asciiCodes = Array.from(processedString).map(char => char.charCodeAt(0));
    addLog(`ASCII码: ${asciiCodes.join(',')}`);
    
    // 尝试方法1: 使用DC2分隔符
    if (containsDC2) {
      const parts = processedString.split(String.fromCharCode(18));
      if (parts.length >= 2) {
        const walrusId = parts[0];
        const filename = parts[1];
        addLog(`使用DC2分隔: ID=${walrusId}, 文件名=${filename}`);
        
        return [{
          blobId: walrusId,
          filename: filename
        }];
      }
    }
    
    // 尝试方法2: 使用星号(*)或其他特殊字符作为分隔符
    const specialSeparators = ['*', '\x0F']; // 添加其他可能的分隔符
    for (const separator of specialSeparators) {
      if (processedString.includes(separator)) {
        const parts = processedString.split(separator);
        if (parts.length >= 2) {
          const walrusId = parts[0];
          const filename = parts.slice(1).join(separator); // 保留文件名中可能包含的分隔符
          addLog(`使用特殊分隔符(${separator.charCodeAt(0)}): ID=${walrusId}, 文件名=${filename}`);
          
          if (walrusId.length >= 40) { // 确保ID长度合理
            return [{
              blobId: walrusId,
              filename: filename
            }];
          }
        }
      }
    }
    
    // 尝试方法3: 固定长度截取 - WalrusID固定为43位
    const EXACT_WALRUS_ID_LENGTH = 43;
    
    if (processedString.length > EXACT_WALRUS_ID_LENGTH) {
      const walrusId = processedString.substring(0, EXACT_WALRUS_ID_LENGTH);
      const filename = processedString.substring(EXACT_WALRUS_ID_LENGTH);
      
      addLog(`使用固定长度(${EXACT_WALRUS_ID_LENGTH})分割: ID=${walrusId}, 文件名=${filename}`);
      
      // 检查文件名部分是否包含扩展名
      const hasFileExtension = filename.includes('.');
      
      if (hasFileExtension) {
        return [{
          blobId: walrusId,
          filename: filename
        }];
      }
    }
    
    // 尝试方法4: 基于用户实例 - 尝试多种可能的长度
    const possibleIdLengths = [43, 44, 64];
    
    for (const idLength of possibleIdLengths) {
      if (processedString.length > idLength) {
        const potentialId = processedString.substring(0, idLength);
        const potentialFilename = processedString.substring(idLength);
        
        // 检查是否符合walrusID格式 - 通常是base64格式
        // base64典型字符: A-Z, a-z, 0-9, +, /
        const isValidId = /^[A-Za-z0-9+/]+={0,2}$/.test(potentialId) || 
                         /^[A-Za-z0-9_-]+$/.test(potentialId);
        
        // 检查文件名部分是否包含扩展名
        const hasFileExtension = potentialFilename.includes('.');
        
        addLog(`尝试固定长度分割(${idLength}): ID=${potentialId}, 文件名=${potentialFilename}`);
        addLog(`ID格式有效: ${isValidId}, 包含文件扩展名: ${hasFileExtension}`);
        
        if ((isValidId && hasFileExtension) || 
            (potentialFilename.length > 3 && hasFileExtension)) {
          return [{
            blobId: potentialId,
            filename: potentialFilename
          }];
        }
      }
    }
    
    // 尝试方法5: 查找最后一个可能的分隔点 - "."符号前的最后一个非字母数字字符
    const lastDotIndex = processedString.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex < processedString.length - 1) {
      // 向左搜索找到可能的ID结束位置
      let idEndPos = lastDotIndex;
      
      // 向前查找10个字符以内的非字母数字字符作为可能的分隔点
      const searchStartPos = Math.max(0, lastDotIndex - 10);
      for (let i = lastDotIndex - 1; i >= searchStartPos; i--) {
        const charCode = processedString.charCodeAt(i);
        if (!(
          (charCode >= 48 && charCode <= 57) || // 0-9
          (charCode >= 65 && charCode <= 90) || // A-Z
          (charCode >= 97 && charCode <= 122)   // a-z
        )) {
          idEndPos = i + 1; // 非字母数字字符之后的位置
          break;
        }
      }
      
      const potentialId = processedString.substring(0, idEndPos);
      const potentialFilename = processedString.substring(idEndPos);
      
      addLog(`尝试分隔点方法: ID=${potentialId}, 文件名=${potentialFilename}`);
      
      if (potentialId.length >= 16 && potentialFilename.includes('.')) {
        return [{
          blobId: potentialId,
          filename: potentialFilename
        }];
      }
    }
    
    // 尝试方法6: 针对提供的示例，尝试特定模式 - 长ID + 数字文件名
    // 类似于 "6qjNBxsHDLRIBsmKzchm4besmQWxW4b1CLtEA0u6jvs12313213213.png"
    const regex = /^([A-Za-z0-9+/]{43})([0-9]+\.[a-zA-Z0-9]+)$/;
    const match = processedString.match(regex);
    
    if (match) {
      const [_, id, filename] = match;
      addLog(`使用正则表达式匹配: ID=${id}, 文件名=${filename}`);
      return [{
        blobId: id,
        filename: filename
      }];
    }
    
    // 如果上述方法都失败，返回整个字符串作为ID和一个默认文件名
    addLog(`所有解析方法失败，使用默认处理`);
    return [{
      blobId: processedString,
      filename: 'downloadedFile.dat'
    }];
  };

  // 查询ID信息
  const handleQueryBlobId = async () => {
    if (!blobId.trim()) {
      setError("请输入 Blob ID");
      return;
    }
    
    setLoading(true);
    setError(null);
    setProcessedData([]);
    addLog(`开始查询 ID: ${blobId.trim()}...`);
    
    try {
      // 传入钱包地址如果已连接，否则使用默认地址
      const senderAddress = currentAccount?.address || undefined;
      const result = await inspectTransaction1(suiClient, senderAddress, undefined, blobId.trim());
      
      // 记录基本查询结果
      addLog(`查询完成，状态: ${result.status || '未知'}`);
      
      // 处理返回值
      if (result?.results?.[0]?.returnValues?.[0]) {
        const returnValue = result.results[0].returnValues[0];
        
        // 如果返回值是数组，尝试处理为字符串
        if (Array.isArray(returnValue[0])) {
          const byteArray = returnValue[0];
          
          // 尝试解析文件信息
          const files = parseFileInfos(byteArray);
          if (files.length > 0) {
            setProcessedData(files);
            addLog(`成功解析到文件信息:`);
            files.forEach((file, index) => {
              addLog(`[${index + 1}] Walrus ID: ${file.blobId}`);
              addLog(`[${index + 1}] 文件名: ${file.filename}`);
            });
            
            // 自动设置文件名为解析出的文件名
            if (files[0].filename) {
              setDownloadFilename(files[0].filename);
            }
          } else {
            // 如果无法解析，则直接显示字符串
            const stringValue = bytesToString(byteArray);
            addLog(`返回数据 (原始长度: ${byteArray.length}):`);
            addLog(stringValue);
            
            // 可能是一个直接的Walrus ID
            if (stringValue && stringValue.length >= 16) {
              setProcessedData([{
                filename: 'downloadedFile.dat',
                blobId: stringValue.trim()
              }]);
              setDownloadFilename('downloadedFile.dat');
              addLog(`检测到可能的直接ID: ${stringValue.trim()}`);
            }
          }
        } else if (typeof returnValue[0] === 'string') {
          // 直接处理字符串类型的返回值
          const stringValue = returnValue[0];
          addLog(`返回字符串数据:`);
          addLog(stringValue);
          
          // 将字符串视为ID
          if (stringValue && stringValue.trim()) {
            const extractedId = stringValue.trim();
            addLog(`检测到直接返回的ID: ${extractedId}`);
            setProcessedData([{
              filename: 'downloadedFile.dat',
              blobId: extractedId
            }]);
            setDownloadFilename('downloadedFile.dat');
          }
        } else {
          // 其他类型直接使用JSON序列化
          const jsonStr = JSON.stringify(returnValue, null, 2);
          addLog(`返回值: ${jsonStr}`);
          
          // 尝试从JSON中提取可能的ID
          try {
            const idMatch = jsonStr.match(/["']([a-zA-Z0-9_\-]{16,})["']/);
            if (idMatch && idMatch[1]) {
              addLog(`从JSON中提取可能的ID: ${idMatch[1]}`);
              setProcessedData([{
                filename: 'downloadedFile.dat',
                blobId: idMatch[1]
              }]);
              setDownloadFilename('downloadedFile.dat');
            }
          } catch (err) {
            // 忽略解析错误
          }
        }
      } else {
        addLog("未找到返回值数据");
      }
    } catch (err) {
      console.error("查询ID时出错:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      addLog(`查询错误: ${errorMessage}`);
      setError(`查询失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 打开下载链接
  const handleOpenDownload = (downloadId: string) => {
    try {
      addLog(`正在打开文件下载链接: ${downloadId}`);
      openDownloadLink(downloadId);
      addLog("下载链接已打开，请在浏览器中查看");
    } catch (err) {
      console.error("打开下载链接时出错:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      addLog(`打开下载链接错误: ${errorMessage}`);
      setError(`打开下载链接失败: ${errorMessage}`);
    }
  };
  
  // 下载并保存文件
  const handleDownloadAndSave = async (downloadId: string, fileInfo: {filename: string, blobId?: string}) => {
    // 使用解析得到的文件名，如果没有则使用用户输入的
    let filename = downloadFilename.trim() || fileInfo.filename;
    
    // 如果仍然没有文件名，使用默认的
    if (!filename) {
      filename = 'downloadedFile.dat';
    }
    
    // 尝试替换文件名中的非法字符
    filename = filename.replace(/[/\\?%*:|"<>]/g, '_');
    
    setDownloadLoading(true);
    addLog(`开始下载文件，ID: ${downloadId}, 文件名: ${filename}`);
    
    try {
      const success = await downloadAndSaveFile(downloadId, filename);
      
      if (success) {
        addLog(`文件下载成功！已保存为: ${filename}`);
      } else {
        throw new Error("下载失败");
      }
    } catch (err) {
      console.error("下载文件时出错:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      addLog(`下载错误: ${errorMessage}`);
      setError(`下载失败: ${errorMessage}`);
    } finally {
      setDownloadLoading(false);
    }
  };
  
  // 获取当前检测到的ID
  const getDetectedId = (): string | undefined => {
    if (processedData.length > 0 && processedData[0].blobId) {
      return processedData[0].blobId;
    }
    return undefined;
  };
  
  // 是否有有效ID可下载
  const hasValidId = !!getDetectedId();
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">ID 查询</h2>
      
      {/* ID输入区域 */}
      <div className="space-y-3">
        {/* Blob ID 输入 */}
        <div>
          <label htmlFor="blobId" className="block text-sm font-medium text-indigo-200 mb-1">
            Blob ID
          </label>
          <input
            id="blobId"
            type="text"
            value={blobId}
            onChange={handleBlobIdChange}
            className="w-full px-4 py-2 bg-black/30 border border-indigo-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="输入要查询的ID..."
            disabled={loading}
          />
        </div>
        
        {/* 查询按钮 */}
        <button
          onClick={handleQueryBlobId}
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 text-white rounded-md font-medium flex items-center justify-center transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              查询中...
            </>
          ) : (
            <>
              <FiSearch className="mr-2" />
              查询ID信息
            </>
          )}
        </button>
      </div>
      
      {/* 提示信息 */}
      <div className="mb-4 p-4 bg-indigo-600/20 rounded-lg text-indigo-200 text-sm border border-indigo-500/30">
        <p className="flex items-center">
          <FiInfo className="mr-2 flex-shrink-0" />
          <span>输入Blob ID，点击查询按钮获取关联信息</span>
        </p>
      </div>
      
      {/* 解析结果显示 */}
      {processedData.length > 0 && (
        <div className="mb-4 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
          <h3 className="text-sm font-medium text-purple-200 mb-2 flex items-center">
            <FiFileText className="mr-2" /> 解析结果
          </h3>
          <div className="space-y-2">
            {processedData.map((file, index) => (
              <div key={index} className="bg-black/30 rounded p-2 text-xs border border-white/10">
                <div className="text-white font-medium break-all" title={file.filename}>
                  <span className="font-bold">文件名:</span> {file.filename}
                </div>
                <div className="font-mono text-indigo-300/80 text-[11px] mt-2 bg-black/30 p-2 rounded break-all whitespace-normal" title={file.blobId}>
                  <span className="font-bold text-indigo-200">Walrus ID:</span> {file.blobId}
                </div>
                {file.blobId && (
                  <div className="mt-2">
                    <div className="mb-3 p-2 bg-indigo-900/30 rounded text-indigo-200 text-center text-xs">
                      <span className="font-medium">✓ 成功获取ID和文件名</span>
                    </div>
                    
                    {/* 文件名输入 */}
                    <div className="mb-3">
                      <label htmlFor="downloadFilename" className="block text-xs font-medium text-indigo-200 mb-1">
                        下载文件名 <span className="text-indigo-300/50">(默认使用解析得到的文件名)</span>
                      </label>
                      <input
                        id="downloadFilename"
                        type="text"
                        value={downloadFilename}
                        onChange={handleFilenameChange}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-indigo-500/30 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={`默认使用'${file.filename}'`}
                      />
                    </div>
                    
                    {/* 下载按钮组 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenDownload(file.blobId!)}
                        className="flex-1 px-2 py-1 bg-indigo-700 hover:bg-indigo-600 rounded text-xs text-white flex items-center justify-center transition-colors"
                      >
                        <FiLink className="mr-1" />
                        打开链接
                      </button>
                      <button
                        onClick={() => handleDownloadAndSave(file.blobId!, file)}
                        disabled={downloadLoading}
                        className="flex-1 px-2 py-1 bg-purple-700 hover:bg-purple-600 disabled:bg-purple-800/50 disabled:text-white/50 rounded text-xs text-white flex items-center justify-center transition-colors"
                      >
                        {downloadLoading ? (
                          <>
                            <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            下载中
                          </>
                        ) : (
                          <>
                            <FiDownload className="mr-1" />
                            下载保存
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 rounded-lg text-red-300 text-sm border border-red-500/30 flex items-start">
          <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* 日志输出 */}
      {logs.length > 0 && (
        <div className="p-3 bg-black/30 rounded-lg border border-indigo-500/20 max-h-80 overflow-auto">
          <div className="text-xs font-mono text-green-300">
            {logs.map((log, index) => (
              <div key={index} className="py-0.5 flex">
                <span className="text-indigo-400 mr-2 select-none">{`[${index+1}]`}</span> 
                <span className="whitespace-pre-wrap break-all">{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 