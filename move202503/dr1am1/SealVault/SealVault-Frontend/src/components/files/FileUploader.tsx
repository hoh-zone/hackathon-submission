import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiles } from '../../context/FileContext';
import { Upload, X, FileText, Image, File } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const FileUploader: React.FC = () => {
  const { uploadFiles } = useFiles();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    // Filter files that are too large
    const validFiles = acceptedFiles.filter(file => file.size <= MAX_FILE_SIZE);
    const oversizedFiles = acceptedFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} file(s) exceed the 50MB limit and were not added.`);
    }
    
    if (validFiles.length > 0) {
      try {
        await uploadFiles(validFiles);
        setShowModal(false);
      } catch (err: any) {
        setError(err.message || 'Failed to upload files');
      }
    }
  }, [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({ 
    onDrop,
    maxSize: MAX_FILE_SIZE
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 transition-colors"
      >
        <Upload size={18} />
        Upload Files
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary-900 dark:text-white">Upload Files</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded text-error-700 dark:text-error-300 text-sm">
                  {error}
                </div>
              )}

              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed ${
                  isDragActive 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-500 dark:hover:border-primary-500'
                } rounded-lg p-6 transition-colors cursor-pointer mb-4`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-4" />
                  <p className="text-neutral-700 dark:text-neutral-300 mb-2">
                    {isDragActive
                      ? "Drop the files here"
                      : "Drag & drop files here, or click to select files"}
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Maximum file size: 50MB
                  </p>
                </div>
              </div>

              {acceptedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-neutral-800 dark:text-white mb-2">Selected Files ({acceptedFiles.length})</h4>
                  <div className="max-h-48 overflow-y-auto pr-2">
                    {acceptedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg mb-2"
                      >
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 dark:text-white truncate">{file.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDrop(acceptedFiles)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  disabled={acceptedFiles.length === 0}
                >
                  Upload {acceptedFiles.length > 0 && `(${acceptedFiles.length})`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FileUploader;