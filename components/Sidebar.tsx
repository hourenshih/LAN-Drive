import React from 'react';
import { useFolderTree } from '../hooks/useFolderTree';
import TreeNode from './TreeNode';

interface SidebarProps {
  onSelectNode: (path: string) => void;
  selectedPath: string;
  // This is a bit of a prop drill, but simple enough for this app size.
  // In a larger app, context or a state management library would be better.
  folderTreeHook: ReturnType<typeof useFolderTree>; 
  onMoveItems: (sourcePaths: string[], destinationPath: string) => void;
  onRenameNode: (path: string, newName: string) => Promise<void>;
  onDeleteNode: (path: string, name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectNode, selectedPath, folderTreeHook, onMoveItems, onRenameNode, onDeleteNode }) => {
  const { tree, isLoading, error } = folderTreeHook;

  return (
    <aside className="w-64 bg-white p-4 rounded-lg shadow-md h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Folders</h2>
      <nav className="space-y-1">
        {isLoading && <p className="text-sm text-gray-500">Loading tree...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {tree && (
          <TreeNode
            node={tree}
            onSelectNode={onSelectNode}
            selectedPath={selectedPath}
            onMoveItems={onMoveItems}
            onRenameNode={onRenameNode}
            onDeleteNode={onDeleteNode}
          />
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;