import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// 环境变量类型定义
declare global {
  interface Window {
    env: {
      PUBLISHER_URL: string;
      CONTRACT_ADDRESS: string;
    }
  }
}

export type FileItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  uploadDate: Date;
  previewUrl?: string;
  status: 'uploading' | 'completed' | 'failed';
  progress: number;
  blobId?: string;
  storageInfo?: {
    blob_id: string;
    object_id: string;
    storage_fund: string;
  };
};

type FileContextType = {
  files: FileItem[];
  uploadFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  uploadProgress: { [key: string]: number };
  isUploading: boolean;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

type FileProviderProps = {
  children: ReactNode;
};

export const FileProvider = ({ children }: FileProviderProps) => {
  const account = useCurrentAccount();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (account?.address) {
      const savedFiles = localStorage.getItem(`files_${account.address}`);
      if (savedFiles) {
        try {
          const parsedFiles = JSON.parse(savedFiles);
          const filesWithDates = parsedFiles.map((file: any) => ({
            ...file,
            uploadDate: new Date(file.uploadDate)
          }));
          setFiles(filesWithDates);
        } catch (error) {
          console.error('Error parsing files from localStorage:', error);
        }
      }
    } else {
      setFiles([]);
    }
  }, [account?.address]);

  useEffect(() => {
    if (account?.address && files.length > 0) {
      localStorage.setItem(`files_${account.address}`, JSON.stringify(files));
    }
  }, [files, account?.address]);

  const uploadToWalrus = async (file: File): Promise<{ blobId: string; storageInfo: any }> => {
    const publisherUrl = window.env.PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
    const epochs = 1; // 存储周期，可以根据需要调整

    try {
      const response = await fetch(`${publisherUrl}/v1/blobs?epochs=${epochs}`, {
        method: 'PUT',
        body: file,
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.statusText}`);
      }

      const storageInfo = await response.json();
      return {
        blobId: storageInfo.blob_id,
        storageInfo
      };
    } catch (error) {
      console.error('上传到 Walrus 失败:', error);
      throw error;
    }
  };

  const uploadFiles = async (newFiles: File[]) => {
    if (!account?.address) {
      throw new Error('钱包未连接');
    }

    // 检查文件大小限制
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
    const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      throw new Error(`以下文件超过 10MB 限制：${oversizedFiles.map(f => f.name).join(', ')}`);
    }

    setIsUploading(true);

    const fileItems: FileItem[] = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      uploadDate: new Date(),
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'uploading',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...fileItems]);

    try {
      const uploadPromises = fileItems.map(async (fileItem) => {
        const file = newFiles.find(f => `${f.name}-${fileItem.lastModified}` === fileItem.id);
        if (!file) return;

        try {
          // 更新上传进度
          const updateProgress = (progress: number) => {
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, progress } : f
            ));
          };

          // 上传到 Walrus
          updateProgress(20);
          const { blobId, storageInfo } = await uploadToWalrus(file);
          updateProgress(100);

          // 更新文件状态
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { 
                  ...f, 
                  status: 'completed',
                  progress: 100,
                  blobId,
                  storageInfo
                } 
              : f
          ));

        } catch (error) {
          console.error('处理文件时出错:', error);
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: 'failed' } : f
          ));
        }
      });

      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('上传文件时出错:', error);
      fileItems.forEach(fileItem => {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'failed' } : f
        ));
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(file => file.id !== id);
      
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      
      return updatedFiles;
    });
  };

  return (
    <FileContext.Provider
      value={{
        files,
        uploadFiles,
        removeFile,
        uploadProgress,
        isUploading
      }}
    >
      {children}
    </FileContext.Provider>
  );
};