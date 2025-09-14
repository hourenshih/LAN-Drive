import { useState, useEffect, useCallback } from 'react';
import { FileEntry } from '../types';
import { fileService } from '../services/fileService';

export const useFileBrowser = (initialPath: string = '/') => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const fetchFiles = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedEntries(new Set()); // Clear selection on navigate
    try {
      const files = await fileService.getFiles(path);
      setFileEntries(files);
    } catch (err) {
      setError('Failed to fetch files. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath, fetchFiles]);

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
      await fetchFiles(currentPath); // Refresh list once after all uploads
    } catch (err) {
      setError('Failed to upload one or more files.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    await uploadFiles([file]);
  };

  const createFolder = async (folderName: string) => {
    try {
        await fileService.createFolder(currentPath, folderName);
        await fetchFiles(currentPath); // Refresh list
    } catch (err) {
        setError((err as Error).message || 'Failed to create folder.');
        console.error(err);
        throw err; // Re-throw to be caught in the component
    }
  };

  const downloadFolder = async (path: string) => {
    try {
        const filesToDownload = await fileService.downloadFolder(path);
        alert(`Folder download started for "${path}". A real app would zip ${filesToDownload.length} file(s). See console for details.`);
        console.log('Files included in folder download:', filesToDownload);
    } catch (err) {
        setError('Failed to prepare folder for download.');
        console.error(err);
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
  const deleteSelectedEntries = async () => {
    try {
      setIsLoading(true);
      await fileService.deleteEntries(Array.from(selectedEntries));
      await fetchFiles(currentPath);
    } catch(err) {
      setError('Failed to delete items.');
      console.error(err);
      setIsLoading(false);
    }
  };

  const copySelectedEntries = async (destinationPath: string) => {
    try {
      setIsLoading(true);
      await fileService.copyEntries(Array.from(selectedEntries), destinationPath);
      await fetchFiles(currentPath);
    } catch(err) {
      setError('Failed to copy items.');
      console.error(err);
      setIsLoading(false);
    }
  };
  
  const moveSelectedEntries = async (destinationPath: string) => {
    try {
      setIsLoading(true);
      await fileService.moveEntries(Array.from(selectedEntries), destinationPath);
      await fetchFiles(currentPath);
    } catch(err) {
      setError('Failed to move items.');
      console.error(err);
      setIsLoading(false);
    }
  };


  return {
    currentPath,
    fileEntries,
    isLoading,
    error,
    selectedEntries,
    navigateTo,
    navigateUp,
    uploadFile,
    uploadFiles,
    createFolder,
    downloadFolder,
    refresh: () => fetchFiles(currentPath),
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    deleteSelectedEntries,
    copySelectedEntries,
    moveSelectedEntries,
  };
};