import React, { useState, useRef, useMemo, useContext } from 'react';
import Header from './components/Header';
import FileList from './components/FileList';
import Breadcrumbs from './components/Breadcrumbs';
import Icon from './components/Icon';
import NewFolderModal from './components/NewFolderModal';
import Sidebar from './components/Sidebar';
import DropzoneOverlay from './components/DropzoneOverlay';
import ActionBar from './components/ActionBar';
import MoveCopyModal from './components/MoveCopyModal';
import RenameModal from './components/RenameModal';
import { useFileBrowser, SortKey } from './hooks/useFileBrowser';
import { useFolderTree } from './hooks/useFolderTree';
import { FileEntry } from './types';
import { UploadProgressContext } from './contexts/UploadProgressContext';
import UploadProgress from './components/UploadProgress';
import { fileService } from './services/fileService';

type MoveCopyOperation = 'move' | 'copy';

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    currentPath, 
    fileEntries, 
    isLoading, 
    error,
    selectedEntries,
    sortConfig,
    setSortConfig,
    navigateTo, 
    navigateUp,
    createFolder,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    deleteSelectedEntries,
    copySelectedEntries,
    moveSelectedEntries,
    renameEntry,
    downloadSelectedEntries,
    decompressEntry,
    refresh,
  } = useFileBrowser('/', searchQuery);
  
  const folderTreeHook = useFolderTree();
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isMoveCopyModalOpen, setIsMoveCopyModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [moveCopyOperation, setMoveCopyOperation] = useState<MoveCopyOperation>('copy');
  
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  const { addUploads, updateUploadProgress, setUploadStatus } = useContext(UploadProgressContext);
  
  const entryToRename = useMemo((): FileEntry | null => {
    if (selectedEntries.size !== 1) return null;
    const path = Array.from(selectedEntries)[0];
    return fileEntries.find(e => e.path === path) || null;
  }, [selectedEntries, fileEntries]);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const newUploads = addUploads(files);

    const uploadPromises = newUploads.map((upload, index) => {
      const file = files[index];
      const onProgress = (percentage: number) => {
        updateUploadProgress(upload.id, percentage);
      };

      return fileService.uploadFile(currentPath, file, onProgress)
        .then(() => {
          setUploadStatus(upload.id, 'done');
        })
        .catch((err) => {
          console.error(err);
          setUploadStatus(upload.id, 'error', (err as Error).message || 'Upload failed');
        });
    });

    await Promise.allSettled(uploadPromises);

    refresh();
    folderTreeHook.refreshTree();
  };

  const handleCreateFolder = async (folderName: string) => {
     await createFolder(folderName);
     folderTreeHook.refreshTree();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedEntries.size} item(s)? This action cannot be undone.`)) {
        deleteSelectedEntries().then(() => {
            folderTreeHook.refreshTree();
        });
    }
  };

  const handleMove = () => {
    setMoveCopyOperation('move');
    setIsMoveCopyModalOpen(true);
  };

  const handleCopy = () => {
    setMoveCopyOperation('copy');
    setIsMoveCopyModalOpen(true);
  };

  const handleRename = async (newName: string) => {
    if (!entryToRename || !newName) return;
    await renameEntry(entryToRename.path, newName);
    folderTreeHook.refreshTree();
  };

  const handleMoveCopySubmit = async (destinationPath: string) => {
    if (moveCopyOperation === 'copy') {
        await copySelectedEntries(destinationPath);
    } else {
        await moveSelectedEntries(destinationPath);
    }
    folderTreeHook.refreshTree();
    setIsMoveCopyModalOpen(false);
  };

  const handleSortChange = (key: SortKey) => {
    setSortConfig(prevConfig => ({
        key,
        direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
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
        await handleUpload(files);
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
              onUpload={(file) => handleUpload([file])}
              onCreateFolder={() => setIsNewFolderModalOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {currentPath !== '/' && (
                        <button onClick={navigateUp} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" aria-label="Go up a directory">
                            <Icon type="back" className="w-5 h-5"/>
                        </button>
                    )}
                    <Breadcrumbs path={currentPath} onNavigate={navigateTo} />
                  </div>
              </div>
              
              {selectedEntries.size > 0 ? (
                <ActionBar 
                  count={selectedEntries.size}
                  onDelete={handleDelete}
                  onMove={handleMove}
                  onCopy={handleCopy}
                  onClearSelection={clearSelection}
                  onRename={() => setIsRenameModalOpen(true)}
                  onDownload={downloadSelectedEntries}
                />
              ) : null}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline ml-2">{error}</span>
                </div>
              )}

              <FileList 
                entries={fileEntries}
                isLoading={isLoading}
                selectedEntries={selectedEntries}
                sortConfig={sortConfig}
                onNavigate={navigateTo}
                onToggleSelection={toggleSelection}
                onToggleSelectAll={toggleSelectAll}
                onSortChange={handleSortChange}
                onDecompress={decompressEntry}
              />
            </div>
          </main>
        </div>
      </div>
      <NewFolderModal 
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />
       <MoveCopyModal
        isOpen={isMoveCopyModalOpen}
        operation={moveCopyOperation}
        onClose={() => setIsMoveCopyModalOpen(false)}
        onSubmit={handleMoveCopySubmit}
        currentPath={currentPath}
        itemsToMove={selectedEntries}
        tree={folderTreeHook.tree}
        isLoadingTree={folderTreeHook.isLoading}
      />
      <RenameModal
        isOpen={isRenameModalOpen && entryToRename !== null}
        currentName={entryToRename?.name || ''}
        onClose={() => setIsRenameModalOpen(false)}
        onSubmit={handleRename}
      />
      <UploadProgress />
    </div>
  );
};

export default App;