import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useFiles } from '../../context/FileContext';
import { useWallet } from '../../context/WalletContext';
import { HardDrive, Upload, FileText } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';

const FileStats: React.FC = () => {
  const { files } = useFiles();
  const account = useCurrentAccount();
  const [nftCount, setNftCount] = useState(0);
  const [blobNftCount, setBlobNftCount] = useState(0);

  useEffect(() => {
    const fetchNftCount = async () => {
      if (!account) return;
      
      try {
        const client = new SuiClient({ url: 'https://fullnode.devnet.sui.io' });
        const objects = await client.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: '0x2::dynamic_field::Field<address, 0x2::dynamic_object_field::Wrapper<0x2::blob::Blob>>'
          }
        });
        
        setNftCount(objects.data.length);

        // 获取包含 blobid 的 NFT
        const blobObjects = await client.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: '0x2::dynamic_field::Field<address, 0x2::dynamic_object_field::Wrapper<0x2::blob::Blob>>',
            MatchAll: [
              {
                MoveType: '0x2::blob::Blob',
                Fields: {
                  blobid: { $exists: true }
                }
              }
            ]
          }
        });
        
        setBlobNftCount(blobObjects.data.length);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      }
    };

    fetchNftCount();
  }, [account]);

  const totalFiles = files.length;
  const completedFiles = files.filter(file => file.status === 'completed').length;
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statsItems = [
    {
      title: 'SealVaultNFT',
      value: nftCount,
      icon: <HardDrive className="h-5 w-5 text-primary-600 dark:text-primary-400" />,
      description: '您的账户中',
      color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    },
    {
      title: '已上传文件',
      value: completedFiles,
      icon: <Upload className="h-5 w-5 text-accent-600 dark:text-accent-400" />,
      description: '成功存储的文件',
      color: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
    },
    {
      title: '总文件数',
      value: totalFiles,
      icon: <FileText className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />,
      description: '您的账户中',
      color: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    },
  ];

  return (
    <>
      {statsItems.map((item, index) => (
        <motion.div
          key={index}
          className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full ${item.color} flex items-center justify-center`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.title}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.description}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default FileStats;