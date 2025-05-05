"use client";
import React, { useState, useEffect, useRef } from "react";
import { ConnectButton } from '@mysten/dapp-kit';
import "@mysten/dapp-kit/dist/index.css";
import { FiEye, FiShield, FiFileText, FiDownloadCloud, FiCopy, FiList, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { FileUploadButton } from "./components/upload/EncryptedUploader";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { inspectTransaction } from "@/utils/moveupload";
import { openDownloadLink, downloadAndSaveFile } from "@/utils/walrusupload";
import { SimpleDownloader } from "./components/dowload";
import { eventBus } from "@/utils/eventBus";

export default function Home() {
  const [activeTab, setActiveTab] = useState('store');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-4 lg:p-6 relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl"></div>
      </div>
      
      {/* ConnectButton放在右上角 */}
      <div className="absolute top-6 right-6 z-50">
        <ConnectButton />
      </div>
      
      {/* 右侧信息模块 - 独立靠右上方显示 */}
      <div className="absolute top-20 right-6 z-40 w-72">
        <FileListPanel />
      </div>

      {/* 页面标题 */}
      <div className="relative z-10 text-center mb-8 pt-4">
        <div className="inline-flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <FiFileText className="text-white text-xl" />
          </div>
          <h1 className="text-3xl font-bold text-white ml-3">DParcel</h1>
        </div>
        <p className="text-indigo-200 opacity-80 mt-2">分布式安全数据传输平台</p>
      </div>

      {/* 主板块居中布局 */}
      <div className="relative z-10 flex justify-center">
        {/* 中间主板块 - 功能区域 */}
        <div className="w-full max-w-xl">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10 overflow-hidden">
            {/* 标签页导航 */}
            <div className="flex bg-black/20">
              <button 
                className={`py-3 px-5 flex items-center ${activeTab === 'store' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'} transition-colors`}
                onClick={() => setActiveTab('store')}
              >
                <FiFileText className={`mr-2 ${activeTab === 'store' ? 'text-pink-400' : ''}`} /> 
                文件上传
              </button>
              <button 
                className={`py-3 px-5 flex items-center ${activeTab === 'download' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'} transition-colors`}
                onClick={() => setActiveTab('download')}
              >
                <FiDownloadCloud className={`mr-2 ${activeTab === 'download' ? 'text-pink-400' : ''}`} /> 
                文件下载
              </button>
            </div>
            
            {/* 内容区域 */}
            <div className="p-6">
              <div className={activeTab === 'store' ? '' : 'hidden'}>
                <FileUploadButton />
              </div>
              
              <div className={activeTab === 'download' ? '' : 'hidden'}>
                <SimpleDownloader />
              </div>
            </div>
            
            {/* 底部信息 - 显示在内容区域下方 */}
            <div className="border-t border-white/10 p-4 flex justify-between items-center text-white/50 text-xs">
              <div className="flex items-center">
                <FiShield className="mr-1" />
                <span>端到端加密传输</span>
              </div>
              <div className="flex items-center">
                <span>DParcel v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 全局样式 - 用于ConnectButton */}
      <style jsx global>{`
        /* Sui Connect按钮样式 */
        .sui-connect-button, div[data-wagmi-connect-button] {
          background: linear-gradient(to right, #6366f1, #a855f7) !important;
          border-radius: 12px !important;
          padding: 0.75rem 1.5rem !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
          border: none !important;
          color: white !important;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3) !important;
        }
        
        .sui-connect-button:hover, div[data-wagmi-connect-button]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4) !important;
        }
        
        /* 其他wallet UI元素样式 */
        .sui-modal, div[data-wagmi-modal], .connect-modal, .wallet-modal {
          background: rgba(30, 27, 75, 0.9) !important;
          backdrop-filter: blur(12px) !important;
          border-radius: 16px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        /* 自定义滚动条 */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
}

// 文件列表面板组件 - 独立组件
function FileListPanel() {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setRefreshing(true);
    // 触发文件列表刷新事件
    eventBus.emit('REFRESH_FILE_LIST');
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10 overflow-hidden">
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-indigo-800/50 to-purple-800/50 p-3 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mr-2 shadow-lg">
            <FiList className="text-white text-xs" />
          </div>
          <h2 className="text-sm font-bold text-white">文件列表</h2>
        </div>
        <button 
          onClick={handleRefresh}
          className={`p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all ${refreshing ? 'animate-pulse' : ''}`}
          title="刷新列表"
        >
          <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={14} />
        </button>
      </div>
      
      {/* 列表内容 */}
      <div className="max-h-[calc(100vh-180px)] overflow-y-auto p-2">
        <SimpleFileList />
      </div>
      
      {/* 底部提示 */}
      <div className="border-t border-white/10 p-2">
        <div className="text-xs text-white/50 text-center">
          点击复制按钮可复制ID
        </div>
      </div>
    </div>
  );
}

// 简化版文件列表组件
function SimpleFileList() {
  const [copied, setCopied] = useState<string | null>(null);
  const fileListRef = useRef<{fetchData: () => Promise<void>}>(null);
  
  // 添加事件监听
  useEffect(() => {
    const unsubscribe = eventBus.on('REFRESH_FILE_LIST', () => {
      console.log("收到刷新文件列表事件");
      if (fileListRef.current) {
        fileListRef.current.fetchData();
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // 复制ID功能 - 添加clipboard API可用性检查
  const copyToClipboard = (text: string) => {
    // 检查navigator和clipboard API是否可用
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(text);
          setTimeout(() => setCopied(null), 2000);
        })
        .catch(err => console.error('复制失败:', err));
    } else {
      // 退回到传统的复制方法
      try {
        // 创建一个临时文本区域
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // 确保不会滚动到底部
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // 尝试执行复制命令
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(text);
          setTimeout(() => setCopied(null), 2000);
        } else {
          console.error('复制操作失败');
        }
        
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('复制文本时出错:', err);
      }
    }
  };
  
  return (
    <div className="space-y-1.5">
      <FileListSimplified 
        onCopy={copyToClipboard} 
        copied={copied} 
        ref={fileListRef}
      />
    </div>
  );
}

// 专门用于右侧板块的简化文件列表
const FileListSimplified = React.forwardRef<
  { fetchData: () => Promise<void> },
  { onCopy: (id: string) => void; copied: string | null }
>(({ onCopy, copied }, ref) => {
  const [files, setFiles] = useState<{filename: string, blobId?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectError, setConnectError] = useState<boolean>(false);
  
  // 将suiClient钩子移到组件顶层
  const suiClient = useSuiClient();
  
  // 使用钱包连接状态
  const currentAccount = useCurrentAccount();
  
  // 数据获取函数
  const fetchData = async () => {
    try {
      setConnectError(false);
      
      // 检查钱包是否已连接
      if (!currentAccount?.address) {
        console.log("钱包未连接，跳过获取文件列表");
        setConnectError(true);
        setLoading(false);
        return;
      }
      
      console.log("钱包已连接，开始获取文件列表");
      setLoading(true);
      
      // 使用上面声明的suiClient，而不是在此处调用hook
      const inspectResult = await inspectTransaction(
        suiClient, 
        currentAccount.address // 传入已连接的钱包地址
      );
      
      if (inspectResult?.results?.[0]?.returnValues?.[0]) {
        const extractedValues = inspectResult.results[0].returnValues[0][0];
        
        // 使用相同的解析函数
        const parsedFiles = parseFileInfos(extractedValues);
        setFiles(parsedFiles);
      }
    } catch (err) {
      console.error("获取文件列表失败:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // 暴露fetchData方法给父组件
  React.useImperativeHandle(ref, () => ({
    fetchData
  }));
  
  // 使用相同的数据获取逻辑，但简化UI
  useEffect(() => {
    // 初次加载时获取数据
    fetchData();
    
    // 设置定时刷新
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [suiClient, currentAccount]); // 添加currentAccount作为依赖项
  
  // 监听文件上传事件
  useEffect(() => {
    // 注册事件监听器
    console.log("注册文件上传事件监听器");
    
    const unsubscribe = eventBus.on('FILE_UPLOADED', (data) => {
      console.log("收到文件上传事件，刷新文件列表", data);
      fetchData();
    });
    
    // 组件卸载时取消监听
    return () => {
      console.log("取消文件上传事件监听器");
      unsubscribe();
    };
  }, [currentAccount]); // 当钱包地址变化时重新注册监听器
  
  // 相同的解析逻辑
  const parseFileInfos = (values: any[]): {filename: string, blobId?: string}[] => {
    if (!Array.isArray(values)) return [];
    
    try {
      // 使用TextDecoder正确解码UTF-8编码的字节
      const uint8Array = new Uint8Array(values);
      const decoder = new TextDecoder('utf-8');
      const fullText = decoder.decode(uint8Array);
      
      // 使用正则表达式匹配文件名和blobId
      const regex = /([^@]+)@([a-zA-Z0-9]{64})/g;
      const fileInfos: {filename: string, blobId?: string}[] = [];
      
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        // 处理文件名，移除开头的特殊分隔符
        let filename = match[1];
        
        // 移除文件名开头的+号
        if (filename.startsWith('+')) {
          filename = filename.substring(1);
        }
        
        // 移除可能的控制字符和其他特殊分隔符
        filename = filename.replace(/[\x00-\x1F\x7F*]/g, '');
        
        // 确保文件名不为空
        if (filename.trim()) {
          fileInfos.push({ 
            filename: filename, 
            blobId: match[2] 
          });
        }
      }
      
      return fileInfos;
    } catch (error) {
      console.error("解析文件信息时出错:", error);
      
      // 回退到基本方法
      // 将ASCII码数组转换为完整字符串
      const fullText = values.map(code => String.fromCharCode(code)).join('');
      
      // 使用正则表达式匹配文件名和blobId
      const regex = /([^@]+)@([a-zA-Z0-9]{64})/g;
      const fileInfos: {filename: string, blobId?: string}[] = [];
      
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        // 处理文件名，移除开头的特殊分隔符
        let filename = match[1];
        
        // 移除文件名开头的+号
        if (filename.startsWith('+')) {
          filename = filename.substring(1);
        }
        
        // 移除可能的控制字符和其他特殊分隔符
        filename = filename.replace(/[\x00-\x1F\x7F*]/g, '');
        
        // 确保文件名不为空
        if (filename.trim()) {
          fileInfos.push({ 
            filename: filename, 
            blobId: match[2] 
          });
        }
      }
      
      return fileInfos;
    }
  };
  
  if (loading) {
    return (
      <div className="h-20 flex items-center justify-center">
        <div className="text-indigo-300 flex items-center text-xs">
          <svg className="animate-spin mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>加载文件列表...</span>
        </div>
      </div>
    );
  }
  
  if (connectError) {
    return (
      <div className="h-20 flex flex-col items-center justify-center text-white/40 p-2 text-xs">
        <FiFileText className="text-lg mb-1" />
        <p className="text-center">请先连接钱包</p>
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <div className="h-20 flex flex-col items-center justify-center text-white/40 p-2 text-xs">
        <FiFileText className="text-lg mb-1" />
        <p className="text-center">暂无文件记录</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1.5">
      {files.map((file, index) => (
        <div 
          key={index} 
          className="bg-black/30 rounded p-2 text-xs border border-white/5 hover:bg-indigo-900/30 hover:border-indigo-500/30 transition-colors"
        >
          <div className="break-all text-white font-medium" title={file.filename}>
            {file.filename}
          </div>
          <div className="flex flex-col mt-2">
            <div className="break-all font-mono text-indigo-300/80 text-[10px] bg-black/30 px-2 py-1.5 rounded whitespace-normal" title={file.blobId}>
              {file.blobId ? file.blobId : 'N/A'}
            </div>
            {file.blobId && (
              <button
                onClick={() => onCopy(file.blobId!)}
                className={`mt-1.5 p-1.5 rounded-md ${copied === file.blobId ? 'bg-green-600/50 text-green-200' : 'bg-indigo-600/50 text-indigo-200 hover:bg-indigo-600/70'} transition-colors w-full flex items-center justify-center`}
                title="复制ID"
              >
                {copied === file.blobId ? '已复制' : <><FiCopy size={12} className="mr-1" /> 复制ID</>}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});