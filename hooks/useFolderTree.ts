import { useState, useEffect, useCallback } from 'react';
import { TreeNodeData } from '../types';
import { fileService } from '../services/fileService';

export const useFolderTree = () => {
  const [tree, setTree] = useState<TreeNodeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const folderTree = await fileService.getFolderTree();
      setTree(folderTree);
    } catch (err) {
      setError('Failed to fetch folder structure.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    tree,
    isLoading,
    error,
    refreshTree: fetchTree,
  };
};
