"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
import { FiUpload, FiInfo, FiFile, FiX, FiDownloadCloud, FiLink, FiSave, FiList } from 'react-icons/fi';
import { 
  formatFileSize 
} from '@/utils/cipher';
import { uploadBlobToWalrus, openDownloadLink, downloadAndSaveFile } from '@/utils/walrusupload';
import { uploadFileToContract, inspectTransaction } from '@/utils/moveupload';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { eventBus } from '@/utils/eventBus';

// 文件上传组件
export function FileUploadButton() {
  const [loading, setLoading] = useState(false);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [blockchainTxSuccess, setBlockchainTxSuccess] = useState<boolean | null>(null);
  const [inspectionResult, setInspectionResult] = useState<any>(null);
  const [returnValues, setReturnValues] = useState<any>(null);
  
  // 获取SUI客户端和交易执行函数
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  // 添加日志函数
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prevLogs => [...prevLogs, message]);
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setLogs([]);
    setBlockchainTxSuccess(null);
    setInspectionResult(null);
    setReturnValues(null);
    if (selectedFile) {
      addLog(`已选择文件: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`);
    }
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 清除选择的文件
  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLogs([]);
  };

  // 上传文件
  const handleStore = async () => {
    if (!file) {
      setError("请选择要上传的文件");
      return;
    }
    
    if (!currentAccount?.address) {
      setError("请先连接钱包");
      return;
    }

    setLoading(true);
    setError(null);
    setLogs([]);
    setBlobId(null);
    setBlockchainTxSuccess(null);
    setInspectionResult(null);
    setReturnValues(null);
    
    try {
      // 读取文件内容
      addLog("开始读取文件内容...");
      const fileReader = new FileReader();
      const filePromise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.onerror = () => reject(fileReader.error);
        fileReader.readAsArrayBuffer(file);
      });
      
      const fileArrayBuffer = await filePromise;
      const fileData = new Uint8Array(fileArrayBuffer);
      addLog(`文件读取完成，大小: ${formatFileSize(fileData.length)}`);
      
      try {
        // 上传文件
        addLog(`准备上传文件: ${file.name}`);
        const blob = new Blob([fileData]);
        const result = await uploadBlobToWalrus(blob, file.name);
        
        if (result) {
          addLog(`上传成功! Blob ID: ${result}`);
          setBlobId(result);
          
          // 调用区块链上传方法
          addLog("正在将文件信息记录到区块链...");
          const contractResult = await uploadFileToContract(
            signAndExecute,  // 传入签名和执行交易的函数
            file.name,       // param1: 文件名（包含文件类型）
            result           // param2: 获取的blobId
          );
          
          if (contractResult) {
            addLog("文件信息已成功记录到区块链");
            setBlockchainTxSuccess(true);
            
            // 执行交易检查
            addLog("正在检查交易执行结果...");
            try {
              const inspectResult = await inspectTransaction(
                suiClient,
                currentAccount.address,
              );
              addLog("交易检查完成");
              setInspectionResult(inspectResult);
              
              // 提取并处理returnValues
              if (inspectResult && inspectResult.results && 
                  inspectResult.results[0]?.returnValues && 
                  inspectResult.results[0]?.returnValues[0]) {
                
                // 提取returnValues数据
                const extractedValues = inspectResult.results[0].returnValues[0][0];
                setReturnValues(extractedValues);
                
                addLog(`提取到returnValues数据, 长度: ${Array.isArray(extractedValues) ? extractedValues.length : 0}`);
              }
              
              // 如果有结果，记录详细信息
              if (inspectResult && inspectResult.results) {
                addLog(`检查结果状态: ${inspectResult.effects ? "成功" : "未知"}`);
                if (inspectResult.results[0]?.returnValues) {
                  addLog(`返回值数量: ${inspectResult.results[0].returnValues.length}`);
                }
              }
              
              // 触发文件上传事件，通知其他组件刷新数据
              addLog("通知文件列表更新...");
              eventBus.emit('FILE_UPLOADED', { blobId: result, filename: file.name });
              
            } catch (inspectError) {
              console.error("交易检查错误:", inspectError);
              addLog(`交易检查错误: ${inspectError instanceof Error ? inspectError.message : "未知错误"}`);
            }
          } else {
            addLog("区块链记录失败，但文件已成功上传到存储服务");
            setBlockchainTxSuccess(false);
          }
        } else {
          throw new Error("上传失败，服务器返回错误");
        }
      } catch (uploadError) {
        console.error("上传过程中出现错误:", uploadError);
        throw new Error("上传失败，请稍后重试");
      }
    } catch (err) {
      console.error("上传过程中出现错误:", err);
      addLog(`错误: ${err instanceof Error ? err.message : "上传过程中发生错误"}`);
      setError(err instanceof Error ? err.message : "上传过程中发生错误");
    } finally {
      setLoading(false);
    }
  };
  
  // 直接下载文件
  const downloadFile = () => {
    if (blobId) {
      // 使用新的下载工具
      openDownloadLink(blobId);
      addLog(`已打开下载链接，BlobId: ${blobId}`);
    } else {
      setError("没有可下载的文件");
    }
  };
  
  // 下载并保存文件
  const downloadAndSave = async () => {
    if (!blobId || !file) {
      setError("没有可下载的文件");
      return;
    }
    
    setLoading(true);
    addLog("正在下载文件...");
    
    try {
      const success = await downloadAndSaveFile(blobId, file.name);
      if (success) {
        addLog(`文件已成功下载并保存: ${file.name}`);
      } else {
        throw new Error("下载失败");
      }
    } catch (err) {
      console.error("下载文件时出错:", err);
      addLog(`下载错误: ${err instanceof Error ? err.message : "未知错误"}`);
      setError("下载文件失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-3">
        <label className="block text-white mb-2">选择要上传的文件</label>
        
        {/* 隐藏的文件输入框 */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* 自定义文件选择区域 */}
        {!file ? (
          <div 
            onClick={triggerFileInput}
            className="border-2 border-dashed border-indigo-600 rounded-md p-6 flex flex-col items-center justify-center bg-indigo-900/20 cursor-pointer hover:bg-indigo-900/30 transition-colors"
          >
            <FiUpload className="text-indigo-400 text-3xl mb-2" />
            <p className="text-white text-center">点击或拖放文件到此处</p>
            <p className="text-white/60 text-sm mt-1">选择一个文件进行上传</p>
          </div>
        ) : (
          <div className="bg-indigo-900/20 rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                <FiFile className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium truncate max-w-[180px]">{file.name}</p>
                <p className="text-white/60 text-sm">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button 
              onClick={clearFile}
              className="text-white/60 hover:text-white p-1"
            >
              <FiX />
            </button>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleStore}
        disabled={loading || !file}
        className="flex items-center justify-center w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-md py-3 text-white font-medium mb-4 hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            上传中...
          </span>
        ) : (
          <>
            <FiUpload className="mr-2" />
            上传文件
          </>
        )}
      </button>
      
      {/* 日志输出区域 */}
      {logs.length > 0 && (
        <div className="mb-4 p-2 bg-black/30 rounded-md max-h-40 overflow-auto">
          <div className="text-xs font-mono text-green-300">
            {logs.map((log, index) => (
              <div key={index} className="py-0.5">
                <span className="text-gray-400">[{index+1}]</span> {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-red-300 text-sm mt-1 mb-3">
          <FiInfo className="inline-block mr-1" />
          {error}
        </div>
      )}
      
      {blobId && (
        <div className="mt-4 p-3 bg-white/10 rounded-md">
          <h3 className="text-white font-medium mb-2 flex items-center">
            <FiInfo className="mr-2" /> 文件已上传
          </h3>
          <div className="text-white/80 text-sm space-y-1">
            <p>Blob ID (用于下载): <span className="font-mono text-xs bg-white/10 p-1 rounded">{blobId}</span></p>
            {blockchainTxSuccess !== null && (
              <p className={blockchainTxSuccess ? "text-green-300" : "text-yellow-300"}>
                区块链记录状态: {blockchainTxSuccess ? "成功" : "失败"}
              </p>
            )}
            
            {/* 添加交易检查结果显示 */}
            {inspectionResult && (
              <div className="mt-2 p-2 bg-blue-900/30 rounded-md">
                <details>
                  <summary className="text-blue-300 text-xs font-medium mb-1 cursor-pointer">
                    交易检查结果 (点击展开完整数据)
                  </summary>
                  <div className="bg-black/30 p-2 rounded-md mt-2 max-h-48 overflow-auto">
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(inspectionResult, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
            
            <div className="mt-2 flex flex-wrap gap-2">
              <button 
                onClick={downloadFile}
                className="flex items-center justify-center py-2 px-4 bg-indigo-800 hover:bg-indigo-700 rounded-md text-white text-sm transition-colors"
                disabled={loading}
              >
                <FiLink className="mr-2" />
                打开下载链接
              </button>
              
              <button 
                onClick={downloadAndSave}
                className="flex items-center justify-center py-2 px-4 bg-purple-800 hover:bg-purple-700 rounded-md text-white text-sm transition-colors"
                disabled={loading}
              >
                <FiSave className="mr-2" />
                下载并保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 