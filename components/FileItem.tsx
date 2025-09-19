import React, { useState, useRef } from 'react';
import { FileEntry, FileType } from '../types';
import Icon, { getIconTypeForFile } from './Icon';

interface FileItemProps {
  entry: FileEntry;
  isSelected: boolean;
  onNavigate: (path: string) => void;
  onToggleSelection: (path: string) => void;
  onDecompress: (path: string) => void;
  onEdit: (path: string) => void;
  selectedEntries: Set<string>;
  onMoveItems: (sourcePaths: string[], destinationPath: string) => void;
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

const FileItem: React.FC<FileItemProps> = ({ entry, isSelected, onNavigate, onToggleSelection, onDecompress, onEdit, selectedEntries, onMoveItems }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const isFolder = entry.type === FileType.FOLDER;
  const isZip = entry.name.toLowerCase().endsWith('.zip');
  const isTxt = entry.name.toLowerCase().endsWith('.txt');

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
      window.location.href = `/api/download-file?path=${encodeURIComponent(entry.path)}`;
  };

  const handleDecompress = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDecompress(entry.path);
  }
  
   const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(entry.path);
  }
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onToggleSelection(entry.path);
  };
  
  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    const isDraggingSelected = selectedEntries.has(entry.path);
    const pathsToDrag = isDraggingSelected ? Array.from(selectedEntries) : [entry.path];
    
    e.dataTransfer.setData('application/json-lan-drive-paths', JSON.stringify(pathsToDrag));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    dragCounter.current = 0;
    
    const data = e.dataTransfer.getData('application/json-lan-drive-paths');
    if (!data) return;
    
    try {
        const sourcePaths = JSON.parse(data) as string[];
        if (!Array.isArray(sourcePaths) || sourcePaths.length === 0) return;

        // Prevent dropping a folder into itself or a child of itself
        if (sourcePaths.some(p => entry.path === p || entry.path.startsWith(p + '/'))) {
            console.warn('Cannot move a folder into itself or a descendant.');
            return;
        }
        
        onMoveItems(sourcePaths, entry.path);
    } catch (err) {
        console.error('Failed to parse dropped data:', err);
    }
  };


  const iconType = isFolder ? FileType.FOLDER : getIconTypeForFile(entry.name);
  
  const rowClasses = `flex items-center p-3 space-x-4 border-l-4 rounded-lg cursor-pointer transition-colors duration-150 ${
    isDragOver
      ? 'bg-blue-100 dark:bg-gray-600 border-blue-500'
      : isSelected
        ? 'bg-blue-50 dark:bg-gray-700 border-blue-500'
        : 'border-transparent'
  } hover:bg-gray-100 dark:hover:bg-gray-700`;
  
  const linkClasses = "text-gray-900 dark:text-white font-medium truncate";

  return (
    <div 
        className={rowClasses} 
        onClick={handleRowClick} 
        role="button" 
        tabIndex={0} 
        onKeyDown={(e) => e.key === 'Enter' && handleRowClick()}
        draggable="true"
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
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
          {!isFolder && isTxt && (
             <button
                onClick={handleEdit}
                className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                aria-label={`Edit ${entry.name}`}
            >
               <Icon type="edit" className="w-5 h-5" />
            </button>
          )}
          {!isFolder && isZip && (
             <button
                onClick={handleDecompress}
                className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                aria-label={`Decompress ${entry.name}`}
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M12 18.75v-5.25m0 0l3.75 3.75M12 13.5l-3.75 3.75M3 7.5h18M3 7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5" />
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