
import React from 'react';
import { FileEntry } from '../types';
import FileItem from './FileItem';

interface FileListProps {
  entries: FileEntry[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
  onDownloadFolder: (path: string) => void;
}

const FileList: React.FC<FileListProps> = ({ entries, isLoading, onNavigate, onDownloadFolder }) => {
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
        <div className="hidden md:grid grid-cols-10 gap-4 p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b dark:border-gray-700">
            <div className="col-span-4 pl-14">Name</div>
            <div className="col-span-3">Date Modified</div>
            <div className="col-span-2 text-right">File Size</div>
            <div className="col-span-1"></div>
        </div>
        {entries.map(entry => (
            <FileItem key={entry.path} entry={entry} onNavigate={onNavigate} onDownloadFolder={onDownloadFolder} />
        ))}
    </div>
  );
};

export default FileList;