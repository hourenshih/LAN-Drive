
import React from 'react';
import Icon from './Icon';

interface DropzoneOverlayProps {
  isVisible: boolean;
}

const DropzoneOverlay: React.FC<DropzoneOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-blue-500 bg-opacity-70 z-40 flex flex-col justify-center items-center pointer-events-none rounded-lg">
      <div className="text-white text-center p-8 border-4 border-dashed border-white rounded-xl">
        <Icon type="upload" className="w-24 h-24 mx-auto" />
        <h2 className="mt-4 text-3xl font-bold">Drop files to upload</h2>
        <p className="mt-2 text-lg">You can drop files or folders.</p>
      </div>
    </div>
  );
};

export default DropzoneOverlay;
