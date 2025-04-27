import React from 'react';
import { motion } from 'framer-motion';
import { useFiles } from '../../context/FileContext';
import { Image, FileText, File, MoreVertical, Trash2, ExternalLink, Database } from 'lucide-react';

type FileListProps = {
  files: Array<any>;
};

const FileList: React.FC<FileListProps> = ({ files }) => {
  const { removeFile } = useFiles();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-primary-500" />;
    }
    if (fileType.includes('pdf') || fileType.includes('doc') || fileType.includes('xls') || fileType.includes('ppt')) {
      return <FileText className="h-6 w-6 text-primary-500" />;
    }
    return <File className="h-6 w-6 text-primary-500" />;
  };

  const isImage = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        <Database className="h-12 w-12 mx-auto mb-4 text-neutral-400 dark:text-neutral-500" />
        <p>暂无 SealVaultNFT</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <motion.div
          key={file.id}
          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative">
            {file.status === 'uploading' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="text-white mt-2">{Math.round(file.progress)}%</p>
                </div>
              </div>
            )}
            
            {isImage(file.type) && file.previewUrl ? (
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-700 relative overflow-hidden">
                <img 
                  src={file.previewUrl} 
                  alt={file.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                <div className="h-20 w-20 bg-white dark:bg-neutral-800 rounded-lg shadow-sm flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="font-medium text-neutral-800 dark:text-white text-sm truncate flex-1">{file.name}</h3>
              <div className="relative group">
                <button className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
                  <MoreVertical size={16} className="text-neutral-500" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 shadow-lg rounded-md overflow-hidden z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 text-error-600 dark:text-error-400 flex items-center gap-2"
                    onClick={() => removeFile(file.id)}
                  >
                    <Trash2 size={14} />
                    删除文件
                  </button>
                  {file.hash && (
                    <a
                      href={`https://ipfs.io/ipfs/${file.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                    >
                      <ExternalLink size={14} className="text-neutral-500" />
                      在 IPFS 中查看
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
              <span>{formatFileSize(file.size)}</span>
              <span>{formatDate(new Date(file.uploadDate))}</span>
            </div>
            
            {file.status === 'completed' && file.hash && (
              <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">IPFS Hash:</p>
                  <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]">{file.hash}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FileList;