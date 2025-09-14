export enum FileType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface FileEntry {
  name: string;
  type: FileType;
  size: number;
  lastModified: Date;
  path: string;
}

export interface TreeNodeData {
  name: string;
  path: string;
  children: TreeNodeData[];
}
