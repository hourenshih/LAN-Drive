import { FileType, FileEntry, TreeNodeData } from '../types';

// Mock in-memory file system
const mockFileSystem: { [path: string]: FileEntry[] } = {
  '/': [
    { name: 'Documents', type: FileType.FOLDER, size: 0, lastModified: new Date('2023-10-26T10:00:00Z'), path: '/Documents' },
    { name: 'Photos', type: FileType.FOLDER, size: 0, lastModified: new Date('2023-10-25T15:30:00Z'), path: '/Photos' },
    { name: 'Project Proposal.docx', type: FileType.FILE, size: 256000, lastModified: new Date('2023-10-27T09:15:00Z'), path: '/Project Proposal.docx' },
    { name: 'logo.png', type: FileType.FILE, size: 125000, lastModified: new Date('2023-09-10T18:45:00Z'), path: '/logo.png' },
  ],
  '/Documents': [
    { name: 'Work', type: FileType.FOLDER, size: 0, lastModified: new Date('2023-10-26T11:00:00Z'), path: '/Documents/Work' },
    { name: 'Personal', type: FileType.FOLDER, size: 0, lastModified: new Date('2023-10-26T12:00:00Z'), path: '/Documents/Personal' },
    { name: 'Meeting Notes.txt', type: FileType.FILE, size: 15360, lastModified: new Date('2023-10-26T14:20:00Z'), path: '/Documents/Meeting Notes.txt' },
  ],
  '/Documents/Work': [
      { name: 'Q4_Report.pdf', type: FileType.FILE, size: 1200000, lastModified: new Date('2023-10-26T16:00:00Z'), path: '/Documents/Work/Q4_Report.pdf' },
  ],
  '/Documents/Personal': [],
  '/Photos': [
    { name: 'Vacation', type: FileType.FOLDER, size: 0, lastModified: new Date('2023-08-20T10:00:00Z'), path: '/Photos/Vacation' },
    { name: 'family.jpg', type: FileType.FILE, size: 4500000, lastModified: new Date('2023-09-01T11:30:00Z'), path: '/Photos/family.jpg' },
  ],
  '/Photos/Vacation': [
    { name: 'beach.jpg', type: FileType.FILE, size: 5200000, lastModified: new Date('2023-08-21T14:00:00Z'), path: '/Photos/Vacation/beach.jpg' },
    { name: 'mountains.jpg', type: FileType.FILE, size: 6100000, lastModified: new Date('2023-08-22T18:00:00Z'), path: '/Photos/Vacation/mountains.jpg' },
  ],
};

const simulateDelay = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), 500));
}

export const fileService = {
  async getFiles(path: string): Promise<FileEntry[]> {
    console.log(`Fetching files for path: ${path}`);
    const files = mockFileSystem[path] || [];
    return simulateDelay([...files].sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === FileType.FOLDER ? -1 : 1;
    }));
  },

  async uploadFile(path: string, file: File): Promise<FileEntry> {
    console.log(`Uploading file "${file.name}" to path: ${path}`);
    const newEntry: FileEntry = {
      name: file.name,
      type: FileType.FILE,
      size: file.size,
      lastModified: new Date(),
      path: `${path === '/' ? '' : path}/${file.name}`
    };

    if (!mockFileSystem[path]) {
      mockFileSystem[path] = [];
    }
    mockFileSystem[path].push(newEntry);
    return simulateDelay(newEntry);
  },

  async createFolder(path: string, folderName: string): Promise<FileEntry> {
    console.log(`Creating folder "${folderName}" in path: ${path}`);
    const newFolderPath = `${path === '/' ? '' : path}/${folderName}`;
    if (mockFileSystem[newFolderPath]) {
      throw new Error("Folder already exists");
    }

    const newEntry: FileEntry = {
      name: folderName,
      type: FileType.FOLDER,
      size: 0,
      lastModified: new Date(),
      path: newFolderPath,
    };

    if (!mockFileSystem[path]) {
      mockFileSystem[path] = [];
    }
    mockFileSystem[path].push(newEntry);
    mockFileSystem[newFolderPath] = [];
    return simulateDelay(newEntry);
  },
  
  async downloadFolder(path: string): Promise<string[]> {
    console.log(`Preparing download for folder: ${path}`);
    const allFiles: string[] = [];

    const collectFilesRecursively = (currentPath: string) => {
        const entries = mockFileSystem[currentPath] || [];
        for (const entry of entries) {
            if (entry.type === FileType.FILE) {
                allFiles.push(entry.path);
            } else if (entry.type === FileType.FOLDER) {
                collectFilesRecursively(entry.path);
            }
        }
    };

    collectFilesRecursively(path);
    return simulateDelay(allFiles);
  },

  async getFolderTree(): Promise<TreeNodeData> {
    const buildTree = (currentPath: string): TreeNodeData[] => {
        const entries = mockFileSystem[currentPath] || [];
        return entries
            .filter(entry => entry.type === FileType.FOLDER)
            .map(entry => ({
                name: entry.name,
                path: entry.path,
                children: buildTree(entry.path)
            }));
    };
    
    const root: TreeNodeData = {
        name: 'My Files',
        path: '/',
        children: buildTree('/')
    };

    return simulateDelay(root);
  }
};