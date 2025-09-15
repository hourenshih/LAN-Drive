import React, { useState, useRef, createContext } from 'react';

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface UploadProgressContextType {
  uploads: UploadingFile[];
  addUploads: (files: File[]) => UploadingFile[];
  updateUploadProgress: (id: string, progress: number) => void;
  setUploadStatus: (id: string, status: UploadStatus, error?: string) => void;
  addAbortController: (id: string, abortController: () => void) => void;
  cancelUpload: (id: string) => void;
}

export const UploadProgressContext = createContext<UploadProgressContextType>({
  uploads: [],
  addUploads: () => [],
  updateUploadProgress: () => {},
  setUploadStatus: () => {},
  addAbortController: () => {},
  cancelUpload: () => {},
});

let nextId = 0;

export const UploadProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [uploads, setUploads] = useState<UploadingFile[]>([]);
    const abortControllersRef = useRef<Map<string, () => void>>(new Map());
    
    const addUploads = (files: File[]): UploadingFile[] => {
        // Before adding new uploads, clear out any still-lingering finished ones
        // This is mainly for if the user starts a new batch before the old one's timeout clears.
        setUploads(prev => prev.filter(u => u.status === 'uploading'));
        
        const newUploads: UploadingFile[] = files.map(file => ({
            id: `upload-${nextId++}`,
            name: file.name,
            progress: 0,
            status: 'uploading',
        }));

        setUploads(prev => [...prev, ...newUploads]);
        return newUploads;
    };

    const addAbortController = (id: string, abortController: () => void) => {
        abortControllersRef.current.set(id, abortController);
    };

    const cancelUpload = (id: string) => {
        const controller = abortControllersRef.current.get(id);
        if (controller) {
            controller();
            abortControllersRef.current.delete(id);
        }
    };

    const updateUploadProgress = (id: string, progress: number) => {
        setUploads(prev => 
            prev.map(u => (u.id === id ? { ...u, progress } : u))
        );
    };

    const setUploadStatus = (id: string, status: UploadStatus, error?: string) => {
        setUploads(prev =>
            prev.map(u => (u.id === id ? { ...u, status, error, progress: status === 'error' ? u.progress : 100 } : u))
        );
        
        // Automatically clear this upload after 5 seconds if it is done or has an error
        if (status === 'done' || status === 'error') {
            abortControllersRef.current.delete(id); // Clean up controller if it exists
            setTimeout(() => {
                setUploads(prev => prev.filter(upload => upload.id !== id));
            }, 5000);
        }
    };
    
    const value = {
        uploads,
        addUploads,
        updateUploadProgress,
        setUploadStatus,
        addAbortController,
        cancelUpload,
    };

    return (
        <UploadProgressContext.Provider value={value}>
            {children}
        </UploadProgressContext.Provider>
    );
};