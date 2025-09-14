
import React, { useRef } from 'react';
import Icon from './Icon';

interface HeaderProps {
  onUpload: (file: File) => void;
  onCreateFolder: () => void;
}

const Header: React.FC<HeaderProps> = ({ onUpload, onCreateFolder }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
     // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <header className="flex items-center justify-between pb-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Files</h1>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Icon type="upload" className="w-5 h-5 mr-2" />
          Upload
        </button>
        <button
          onClick={onCreateFolder}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Icon type="new-folder" className="w-5 h-5 mr-2" />
          New Folder
        </button>
      </div>
    </header>
  );
};

export default Header;
