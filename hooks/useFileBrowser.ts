import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileEntry, FileType } from '../types';
import { fileService } from '../services/fileService';

export type SortKey = 'name' | 'lastModified' | 'size';
export type SortDirection = 'asc' | 'desc';
export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const useFileBrowser = (initialPath: string = '/', searchQuery: string = '') => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const fetchFiles = useCallback(async (path: string, query: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedEntries(new Set()); // Clear selection on navigate or search
    try {
      const files = await fileService.getFiles(path, query);
      setFileEntries(files);
    } catch (err) {
      setError('Failed to fetch files. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(currentPath, searchQuery);
  }, [currentPath, searchQuery, fetchFiles]);

  const sortedFileEntries = useMemo(() => {
    return [...fileEntries].sort((a, b) => {
        // Always sort folders before files
        if (a.type !== b.type) {
            return a.type === FileType.FOLDER ? -1 : 1;
        }

        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        let comparison = 0;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
        } else if (valA instanceof Date && valB instanceof Date) {
            comparison = valA.getTime() - valB.getTime();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [fileEntries, sortConfig]);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };
  
  const navigateUp = () => {
    if (currentPath === '/') return;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    setCurrentPath(parentPath);
  };

  const uploadFiles = async (files: File[]) => {
    try {
      setIsLoading(true);
      const uploadPromises = files.map(file => fileService.uploadFile(currentPath, file));
      await Promise.all(uploadPromises);
      await fetchFiles(currentPath, searchQuery); // Refresh list
    } catch (err) {
      setError('Failed to upload one or more files.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = async (folderName: string) => {
    try {
        await fileService.createFolder(currentPath, folderName);
        await fetchFiles(currentPath, searchQuery); // Refresh list
    } catch (err) {
        setError((err as Error).message || 'Failed to create folder.');
        console.error(err);
        throw err; // Re-throw to be caught in the component
    }
  };

  // --- Selection handlers ---
  const clearSelection = () => {
    setSelectedEntries(new Set());
  };

  const toggleSelection = (path: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === fileEntries.length && fileEntries.length > 0) {
      clearSelection();
    } else {
      setSelectedEntries(new Set(fileEntries.map(e => e.path)));
    }
  };

  // --- Action handlers ---
  const performAction = async (action: () => Promise<void>, errorMessage: string) => {
    try {
      setIsLoading(true);
      await action();
      await fetchFiles(currentPath, searchQuery);
    } catch(err) {
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const deleteSelectedEntries = () => performAction(() => fileService.deleteEntries(Array.from(selectedEntries)), 'Failed to delete items.');
  const copySelectedEntries = (dest: string) => performAction(() => fileService.copyEntries(Array.from(selectedEntries), dest), 'Failed to copy items.');
  const moveSelectedEntries = (dest: string) => performAction(() => fileService.moveEntries(Array.from(selectedEntries), dest), 'Failed to move items.');
  const renameEntry = (path: string, newName: string) => performAction(() => fileService.renameEntry(path, newName), 'Failed to rename item.');
  
  const downloadSelectedEntries = () => {
    const selected = fileEntries.filter(entry => selectedEntries.has(entry.path));
    const filesToDownload = selected.filter(entry => entry.type === FileType.FILE);
    const foldersSelected = selected.filter(entry => entry.type === FileType.FOLDER);

    if (filesToDownload.length > 0) {
        fileService.downloadEntries(filesToDownload.map(f => f.path));
    }

    if (foldersSelected.length > 0) {
        if (filesToDownload.length > 0) {
            alert(`Note: ${foldersSelected.length} folder(s) were ignored. Only files can be downloaded individually.`);
        } else {
            alert(`Folder download is not supported. Please select files to download.`);
        }
    }
  };
  
  const decompressEntry = (path: string) => performAction(() => fileService.decompressEntry(path), 'Failed to decompress item.');

  return {
    currentPath,
    fileEntries: sortedFileEntries,
    isLoading,
    error,
    selectedEntries,
    sortConfig,
    setSortConfig,
    navigateTo,
    navigateUp,
    uploadFiles,
    createFolder,
    refresh: () => fetchFiles(currentPath, searchQuery),
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    deleteSelectedEntries,
    copySelectedEntries,
    moveSelectedEntries,
    renameEntry,
    downloadSelectedEntries,
    decompressEntry,
  };
};