import React, { useState, useEffect, useRef } from 'react';
import { fileService } from '../services/fileService';

interface TextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  filePath: string | null;
}

const TextEditorModal: React.FC<TextEditorModalProps> = ({ isOpen, onClose, onSave, filePath }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fileName = filePath ? filePath.split('/').pop() : '';
  const hasUnsavedChanges = content !== originalContent;

  useEffect(() => {
    if (isOpen && filePath) {
      const fetchContent = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fileContent = await fileService.getFileContent(filePath);
          setContent(fileContent);
          setOriginalContent(fileContent);
        } catch (err) {
          setError((err as Error).message || 'Failed to load file content.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchContent();
    } else {
      // Reset state when closed
      setContent('');
      setOriginalContent('');
      setError(null);
    }
  }, [isOpen, filePath]);

  const handleClose = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!filePath || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      await fileService.saveFileContent(filePath, content);
      setOriginalContent(content); 
      onSave();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save file.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col p-4 sm:p-8" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full h-full flex flex-col">
        <header className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            Editing: <span className="font-mono">{fileName}</span>
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-200"
            aria-label="Close editor"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error && !isLoading ? (
             <div className="p-6 text-center text-red-500">
                <p><strong>Error loading file</strong></p>
                <p>{error}</p>
             </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing..."
              className="w-full h-full p-4 resize-none border-0 focus:ring-0 font-mono text-sm leading-6"
              spellCheck="false"
            />
          )}
        </main>
        
        <footer className="bg-gray-50 px-6 py-3 flex justify-between items-center rounded-b-lg flex-shrink-0">
            {error && !isSaving && <p className="text-sm text-red-600 truncate max-w-xs">{error}</p>}
            {hasUnsavedChanges && !error && <p className="text-sm text-yellow-600">You have unsaved changes.</p>}
            <div className="flex-grow"></div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default TextEditorModal;