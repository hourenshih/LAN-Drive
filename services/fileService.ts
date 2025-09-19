import { FileType, FileEntry, TreeNodeData } from '../types';

// A tiny API client to handle fetch requests and errors
// FIX: Extracted the generic `request` function out of the `api` object literal.
// This resolves the "Untyped function calls may not accept type arguments" error
// by making `request` a standalone generic function, avoiding issues with `this` type inference
// within the object literal.
async function request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errorData.message || 'An unknown API error occurred');
    }
    if (response.status === 204) { // No Content
        return undefined as T;
    }
    return response.json();
}

const api = {
    get<T>(url: string): Promise<T> {
        return request<T>(url, { method: 'GET' });
    },
    post<T>(url: string, body: unknown): Promise<T> {
        return request<T>(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }
};

export const fileService = {
  async getFiles(path: string, query?: string): Promise<FileEntry[]> {
    const url = new URL('/api/files', window.location.origin);
    url.searchParams.set('path', path);
    if (query) {
      url.searchParams.set('query', query);
    }
    
    const entries = await api.get<any[]>(url.toString());
    // Dates are transmitted as strings in JSON, so we need to convert them back to Date objects.
    return entries.map(entry => ({
        ...entry,
        lastModified: new Date(entry.lastModified),
    }));
  },

  uploadFile(path: string, file: File, onProgress: (percentage: number) => void): { promise: Promise<FileEntry>, abort: () => void } {
    const xhr = new XMLHttpRequest();
    
    const promise = new Promise<FileEntry>((resolve, reject) => {
        xhr.open('POST', '/api/upload', true);

        xhr.setRequestHeader('X-File-Path', encodeURI(path));
        xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentage = Math.round((event.loaded * 100) / event.total);
                onProgress(percentage);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const newEntry = JSON.parse(xhr.responseText);
                    resolve({
                        ...newEntry,
                        lastModified: new Date(newEntry.lastModified),
                    });
                } catch (e) {
                    reject(new Error('Failed to parse server response.'));
                }
            } else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`));
                } catch (e) {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        };

        xhr.onerror = () => {
            reject(new Error('An unknown network error occurred during upload.'));
        };
        
        xhr.onabort = () => {
            reject(new Error('Upload was cancelled by the user.'));
        };

        xhr.send(file);
    });

    return {
        promise,
        abort: () => xhr.abort(),
    };
  },

  async createFolder(path: string, folderName: string): Promise<FileEntry> {
    const newEntry = await api.post<any>('/api/create-folder', { path, folderName });
    return {
        ...newEntry,
        lastModified: new Date(newEntry.lastModified),
    };
  },

  downloadEntries(paths: string[]): void {
    paths.forEach((path, index) => {
      // Stagger downloads to prevent the browser from blocking multiple downloads
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `/api/download-file?path=${encodeURIComponent(path)}`;
        // The browser will infer the filename from the Content-Disposition header.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
  },

  async getFolderTree(): Promise<TreeNodeData> {
    return api.get<TreeNodeData>('/api/folder-tree');
  },

  async deleteEntries(paths: string[]): Promise<void> {
    await api.post('/api/delete', { paths });
  },

  async copyEntries(paths: string[], destinationPath: string): Promise<void> {
    await api.post('/api/copy', { paths, destinationPath });
  },

  async moveEntries(paths: string[], destinationPath: string): Promise<void> {
     await api.post('/api/move', { paths, destinationPath });
  },

  async renameEntry(entryPath: string, newName: string): Promise<void> {
    await api.post('/api/rename', { entryPath, newName });
  },
  
  async decompressEntry(path: string): Promise<void> {
    await api.post('/api/decompress', { path });
  },
  
  async getFileContent(path: string): Promise<string> {
    const url = new URL('/api/file-content', window.location.origin);
    url.searchParams.set('path', path);
    const response = await fetch(url.toString());
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errorData.message || 'Failed to fetch file content');
    }
    return response.text();
  },

  async saveFileContent(path: string, content: string): Promise<void> {
    await api.post<void>('/api/save-content', { path, content });
  },
};