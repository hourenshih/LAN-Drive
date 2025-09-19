import React from 'react';
import Icon from './Icon';

interface ActionBarProps {
  count: number;
  onDelete: () => void;
  onMove: () => void;
  onCopy: () => void;
  onClearSelection: () => void;
  onRename: () => void;
  onDownload: () => void;
  onEdit: () => void;
  isSingleTxtFileSelected: boolean;
}

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean }> = ({ onClick, children, className = '', disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
);

const ActionBar: React.FC<ActionBarProps> = ({ count, onDelete, onMove, onCopy, onClearSelection, onRename, onDownload, onEdit, isSingleTxtFileSelected }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 ease-in-out">
      <div className="flex items-center space-x-4">
        <button
          onClick={onClearSelection}
          className="p-2 rounded-full hover:bg-blue-100"
          aria-label="Clear selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="font-medium text-blue-800">{count} item{count > 1 ? 's' : ''} selected</span>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        <ActionButton onClick={onRename} disabled={count !== 1}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L13.196 5.232z" />
          </svg>
          Rename
        </ActionButton>
        <ActionButton onClick={onEdit} disabled={!isSingleTxtFileSelected}>
          <Icon type="edit" className="w-5 h-5 mr-2" />
          Edit
        </ActionButton>
        <ActionButton onClick={onMove}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Move
        </ActionButton>
        <ActionButton onClick={onCopy}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </ActionButton>
        <ActionButton onClick={onDownload}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          Download
        </ActionButton>
        <button
          onClick={onDelete}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export default ActionBar;