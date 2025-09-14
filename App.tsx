
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import FileList from './components/FileList';
import Breadcrumbs from './components/Breadcrumbs';
import Icon from './components/Icon';
import NewFolderModal from './components/NewFolderModal';
import Sidebar from './components/Sidebar';
import DropzoneOverlay from './components/DropzoneOverlay';
import { useFileBrowser } from './hooks/useFileBrowser';
import { useFolderTree } from './hooks/useFolderTree';

const App: React.FC = () => {
  const { 
    currentPath, 
    fileEntries, 
    isLoading, 
    error, 
    navigateTo, 
    navigateUp,
    uploadFile,
    uploadFiles,
    createFolder,
    downloadFolder
  } = useFileBrowser('/');
  
  const folderTreeHook = useFolderTree();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);
  
  const handleUpload = async (file: File) => {
    await uploadFile(file);
  };

  const handleCreateFolder = async (folderName: string) => {
     await createFolder(folderName);
     folderTreeHook.refreshTree();
  };

  // --- Drag and Drop Handlers ---
  
  const readAllDirectoryEntries = async (directoryReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
    let entries: FileSystemEntry[] = [];
    let readEntries = await new Promise<FileSystemEntry[]>((resolve) => {
        directoryReader.readEntries(resolve);
    });
    while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await new Promise<FileSystemEntry[]>((resolve) => {
            directoryReader.readEntries(resolve);
        });
    }
    return entries;
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const files: File[] = [];
    const processingQueue: FileSystemEntry[] = [];

    for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) {
            processingQueue.push(entry);
        }
    }

    while (processingQueue.length > 0) {
        const entry = processingQueue.shift();
        if (!entry) continue;

        if (entry.isFile) {
            try {
                const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
                files.push(file);
            } catch (err) {
                console.error("Could not read file:", entry.name, err);
            }
        } else if (entry.isDirectory) {
            const reader = (entry as FileSystemDirectoryEntry).createReader();
            try {
                const entries = await readAllDirectoryEntries(reader);
                processingQueue.push(...entries);
            } catch (err) {
                 console.error("Could not read directory:", entry.name, err);
            }
        }
    }

    if (files.length > 0) {
        await uploadFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
        setIsDraggingOver(false);
    }
  };


  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          
          <div className="md:w-64 flex-shrink-0">
            <Sidebar 
              onSelectNode={navigateTo}
              selectedPath={currentPath}
              folderTreeHook={folderTreeHook}
            />
          </div>

          <main 
            className="flex-1 min-w-0 relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <DropzoneOverlay isVisible={isDraggingOver} />
            <Header 
              onUpload={handleUpload} 
              onCreateFolder={() => setIsModalOpen(true)}
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mt-4">
              <div className="flex items-center mb-4">
                  {currentPath !== '/' && (
                      <button onClick={navigateUp} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" aria-label="Go up a directory">
                          <Icon type="back" className="w-5 h-5"/>
                      </button>
                  )}
                  <Breadcrumbs path={currentPath} onNavigate={navigateTo} />
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline ml-2">{error}</span>
                </div>
              )}

              <FileList 
                entries={fileEntries}
                isLoading={isLoading}
                onNavigate={navigateTo}
                onDownloadFolder={downloadFolder}
              />
            </div>
          </main>
        </div>
      </div>
      <NewFolderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateFolder}
      />
    </div>
  );
};

export default App;
