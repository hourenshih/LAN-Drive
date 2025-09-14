import React from 'react';
import { FileEntry, FileType } from '../types';
import Icon, { getIconTypeForFile } from './Icon';

interface FileItemProps {
  entry: FileEntry;
  isSelected: boolean;
  onNavigate: (path: string) => void;
  onDownloadFolder: (path: string) => void;
  onToggleSelection: (path: string) => void;
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

const FileItem: React.FC<FileItemProps> = ({ entry, isSelected, onNavigate, onDownloadFolder, onToggleSelection }) => {
  const isFolder = entry.type === FileType.FOLDER;

  const handleRowClick = () => {
    onToggleSelection(entry.path);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isFolder) {
      e.stopPropagation(); // Prevent row click from firing
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
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onToggleSelection(entry.path);
  };


  const iconType = isFolder ? FileType.FOLDER : getIconTypeForFile(entry.name);
  
  const rowClasses = `flex items-center p-3 space-x-4 border-l-4 ${
    isSelected
      ? 'bg-blue-50 dark:bg-gray-700 border-blue-500'
      : 'border-transparent'
  } hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer`;
  const linkClasses = "text-gray-900 dark:text-white font-medium truncate";

  return (
    <div className={rowClasses} onClick={handleRowClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleRowClick()}>
      <div className="flex-shrink-0 flex items-center">
        <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox itself
            aria-label={`Select ${entry.name}`}
        />
        <Icon type={iconType} className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-10 gap-4 items-center">
        <div className="col-span-10 md:col-span-4">
           <span onClick={isFolder ? handleLinkClick : undefined} className={`${isFolder ? 'cursor-pointer hover:underline' : ''} ${linkClasses}`}>
                {entry.name}
            </span>
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
                className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
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
                className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
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