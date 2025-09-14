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
  async getFiles(path: string): Promise<FileEntry[]> {
    const entries = await api.get<any[]>(`/api/files?path=${encodeURIComponent(path)}`);
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
  
  async downloadFolder(path: string): Promise<string[]> {
    // A proper implementation would involve zipping the folder on the server and providing a download link.
    // This is complex and requires extra dependencies, so we'll keep the existing alert behavior.
    alert(`Folder download initiated for "${path}". A real app would provide a zip file.`);
    console.log(`Preparing download for folder: ${path}`);
    return api.get<string[]>(`/api/download-folder-list?path=${encodeURIComponent(path)}`);
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
  }
};