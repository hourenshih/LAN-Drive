import React, { useRef, useEffect } from 'react';
import { FileEntry } from '../types';
import { SortConfig, SortKey } from '../hooks/useFileBrowser';
import FileItem from './FileItem';

interface FileListProps {
  entries: FileEntry[];
  isLoading: boolean;
  selectedEntries: Set<string>;
  sortConfig: SortConfig;
  onNavigate: (path: string) => void;
  onToggleSelection: (path: string) => void;
  onToggleSelectAll: () => void;
  onSortChange: (key: SortKey) => void;
  onDecompress: (path: string) => void;
  onEdit: (path: string) => void;
  onMoveItems: (sourcePaths: string[], destinationPath: string) => void;
}

const SortableHeader: React.FC<{
  label: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  onSortChange: (key: SortKey) => void;
  className?: string;
}> = ({ label, sortKey, sortConfig, onSortChange, className }) => {
  const isCurrentKey = sortConfig.key === sortKey;
  const icon = isCurrentKey ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '';
  
  return (
    <button onClick={() => onSortChange(sortKey)} className={`flex items-center space-x-2 ${className}`}>
      <span>{label}</span>
      <span className="text-xs">{icon}</span>
    </button>
  );
};


const FileList: React.FC<FileListProps> = ({ entries, isLoading, selectedEntries, sortConfig, onNavigate, onToggleSelection, onToggleSelectAll, onSortChange, onDecompress, onEdit, onMoveItems }) => {
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
        const numSelected = selectedEntries.size;
        const numEntries = entries.length;
        selectAllCheckboxRef.current.checked = numSelected === numEntries && numEntries > 0;
        selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numEntries;
    }
  }, [selectedEntries, entries]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">This folder is empty</h3>
        <p className="mt-1 text-sm text-gray-500">Upload a file or create a new folder.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
        <div className="hidden md:grid grid-cols-10 gap-4 p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b dark:border-gray-700 items-center">
            <div className="col-span-4 flex items-center">
                <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
                    onChange={onToggleSelectAll}
                    aria-label="Select all items"
                />
                <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSortChange={onSortChange} className="pl-14"/>
            </div>
            <div className="col-span-3">
              <SortableHeader label="Date Modified" sortKey="lastModified" sortConfig={sortConfig} onSortChange={onSortChange} />
            </div>
            <div className="col-span-2 text-right">
              <SortableHeader label="File Size" sortKey="size" sortConfig={sortConfig} onSortChange={onSortChange} className="ml-auto" />
            </div>
            <div className="col-span-1"></div>
        </div>
        {entries.map(entry => (
            <FileItem 
              key={entry.path} 
              entry={entry} 
              isSelected={selectedEntries.has(entry.path)}
              selectedEntries={selectedEntries}
              onNavigate={onNavigate} 
              onToggleSelection={onToggleSelection}
              onDecompress={onDecompress}
              onEdit={onEdit}
              onMoveItems={onMoveItems}
            />
        ))}
    </div>
  );
};

export default FileList;