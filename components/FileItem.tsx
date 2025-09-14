
import React from 'react';
import { FileEntry, FileType } from '../types';
import Icon, { getIconTypeForFile } from './Icon';

interface FileItemProps {
  entry: FileEntry;
  onNavigate: (path: string) => void;
  onDownloadFolder: (path: string) => void;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const FileItem: React.FC<FileItemProps> = ({ entry, onNavigate, onDownloadFolder }) => {
  const isFolder = entry.type === FileType.FOLDER;

  const handleClick = (e: React.MouseEvent) => {
    if (isFolder) {
      e.preventDefault();
      onNavigate(entry.path);
    }
  };
  
  const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      alert(`Downloading ${entry.name}... (mock)`);
      console.log(`Initiating download for ${entry.path}`);
  };

  const handleFolderDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDownloadFolder(entry.path);
  };

  // FIX: Use FileType.FOLDER enum member instead of the string literal 'folder' to satisfy the Icon component's prop type.
  const iconType = isFolder ? FileType.FOLDER : getIconTypeForFile(entry.name);
  
  const commonClasses = "flex items-center p-3 space-x-4";
  const interactiveClasses = "hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer";
  const linkClasses = "text-gray-900 dark:text-white font-medium truncate";

  return (
    <div className={`${commonClasses} ${interactiveClasses}`} onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick(e as any)}>
      <div className="flex-shrink-0">
        <Icon type={iconType} className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-10 gap-4 items-center">
        <div className="col-span-10 md:col-span-4">
          <p className={linkClasses}>{entry.name}</p>
        </div>
        <div className="hidden md:block md:col-span-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(entry.lastModified)}</p>
        </div>
        <div className="hidden md:block md:col-span-2 text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">{!isFolder ? formatBytes(entry.size) : '--'}</p>
        </div>
        <div className="hidden md:block md:col-span-1 text-right">
          {isFolder && (
             <button
                onClick={handleFolderDownload}
                className="text-blue-600 hover:text-blue-800 font-medium p-2 rounded-full hover:bg-blue-100"
                aria-label={`Download folder ${entry.name}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          )}
          {!isFolder && (
            <button
                onClick={handleDownload}
                className="text-blue-600 hover:text-blue-800 font-medium p-2 rounded-full hover:bg-blue-100"
                aria-label={`Download ${entry.name}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileItem;