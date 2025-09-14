import React, { useState, useEffect, useMemo } from 'react';
import { TreeNodeData } from '../types';

interface MoveCopyModalProps {
  isOpen: boolean;
  operation: 'move' | 'copy';
  onClose: () => void;
  onSubmit: (destinationPath: string) => void;
  currentPath: string;
  itemsToMove: Set<string>;
  tree: TreeNodeData | null;
  isLoadingTree: boolean;
}

// A slightly modified TreeNode for selection purposes
const SelectableTreeNode: React.FC<{
    node: TreeNodeData;
    onSelect: (path: string) => void;
    selectedDestination: string;
    disabledPaths: Set<string>;
    level?: number;
}> = ({ node, onSelect, selectedDestination, disabledPaths, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(true); // Default to open for easier navigation
    
    const isDisabled = disabledPaths.has(node.path);
    const isSelected = selectedDestination === node.path;
    const hasChildren = node.children && node.children.length > 0;

    const filteredChildren = useMemo(() => {
        return node.children.filter(child => !disabledPaths.has(child.path));
    }, [node.children, disabledPaths]);

    return (
        <div>
            <div 
                className={`flex items-center p-2 rounded-md ${
                    isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${isSelected ? 'bg-blue-100 dark:bg-gray-700' : ''}`}
                onClick={() => !isDisabled && onSelect(node.path)}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
            >
                {hasChildren && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                        className="mr-2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
                <span className="text-sm font-medium truncate">{node.name}</span>
            </div>
            {isOpen && filteredChildren.map(child => (
                <SelectableTreeNode
                    key={child.path}
                    node={child}
                    onSelect={onSelect}
                    selectedDestination={selectedDestination}
                    disabledPaths={disabledPaths}
                    level={level + 1}
                />
            ))}
        </div>
    )
}

const MoveCopyModal: React.FC<MoveCopyModalProps> = ({ isOpen, operation, onClose, onSubmit, currentPath, itemsToMove, tree, isLoadingTree }) => {
  const [selectedDestination, setSelectedDestination] = useState(currentPath);

  // Disable moving/copying a folder into itself or its children
  const disabledPaths = useMemo(() => new Set(itemsToMove), [itemsToMove]);

  useEffect(() => {
    if (isOpen) {
      // Reset destination to current folder when opening
      setSelectedDestination(getParentPath(currentPath));
    }
  }, [isOpen, currentPath]);

  const getParentPath = (path: string): string => {
    if (path === '/') return '/';
    return path.substring(0, path.lastIndexOf('/')) || '/';
  }

  const handleConfirm = () => {
    // Prevent moving to the same directory
    const isMovingToSameDir = itemsToMove.size === 1 && getParentPath(Array.from(itemsToMove)[0]) === selectedDestination;
    if (operation === 'move' && isMovingToSameDir) {
        onClose();
        return;
    }
    onSubmit(selectedDestination);
  };
  
  if (!isOpen) return null;

  const title = operation === 'move' ? 'Move Items' : 'Copy Items';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4" role="document">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Select a destination folder.</p>
            <div className="mt-4 border rounded-lg p-2 h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {isLoadingTree && <p>Loading folders...</p>}
                {tree && (
                    <SelectableTreeNode 
                        node={tree}
                        onSelect={setSelectedDestination}
                        selectedDestination={selectedDestination}
                        disabledPaths={disabledPaths}
                    />
                )}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Destination: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedDestination}</span>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {operation === 'move' ? 'Move Here' : 'Copy Here'}
            </button>
          </div>
      </div>
    </div>
  );
};

export default MoveCopyModal;
