
import { useState, useEffect, useCallback } from 'react';
import { FileEntry } from '../types';
import { fileService } from '../services/fileService';

export const useFileBrowser = (initialPath: string = '/') => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
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
      const uploadPromises = files.map(file => fileService.uploadFile(currentPath, file));
      await Promise.all(uploadPromises);
      fetchFiles(currentPath); // Refresh list once after all uploads
    } catch (err) {
      setError('Failed to upload one or more files.');
      console.error(err);
    }
  };

  const uploadFile = async (file: File) => {
    await uploadFiles([file]);
  };

  const createFolder = async (folderName: string) => {
    try {
        await fileService.createFolder(currentPath, folderName);
        fetchFiles(currentPath); // Refresh list
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

  return {
    currentPath,
    fileEntries,
    isLoading,
    error,
    navigateTo,
    navigateUp,
    uploadFile,
    uploadFiles,
    createFolder,
    downloadFolder,
    refresh: () => fetchFiles(currentPath),
  };
};
