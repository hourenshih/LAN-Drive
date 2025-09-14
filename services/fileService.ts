import { FileType, FileEntry, TreeNodeData } from '../types';

// Helper to convert a File object to a Base64 string for JSON transport
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        // The result is in the format "data:mime/type;base64,THE_BASE64_STRING"
        // We only need the part after the comma.
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
});


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

  async uploadFile(path: string, file: File): Promise<FileEntry> {
    const content = await toBase64(file);
    const newEntry = await api.post<any>('/api/upload', {
        path,
        fileName: file.name,
        content,
    });
     return {
        ...newEntry,
        lastModified: new Date(newEntry.lastModified),
    };
  },

  async createFolder(path: string, folderName: string): Promise<FileEntry> {
    const newEntry = await api.post<any>('/api/create-folder', { path, folderName });
    return {
        ...newEntry,
        lastModified: new Date(newEntry.lastModified),
    };
  },
  
  downloadFolder(path: string): void {
    window.location.href = `/api/download-folder?path=${encodeURIComponent(path)}`;
  },

  downloadEntries(paths: string[]): void {
    const url = new URL('/api/download-multiple', window.location.origin);
    paths.forEach(p => url.searchParams.append('path', p));
    window.location.href = url.toString();
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

  async categorizeEntries(paths: string[], currentPath: string): Promise<void> {
    await api.post('/api/categorize', { paths, currentPath });
  },
};