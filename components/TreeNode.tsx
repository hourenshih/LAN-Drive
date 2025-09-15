import React, { useState, useRef, useEffect } from 'react';
// FIX: Import FileType to use its enum members for type safety.
import { TreeNodeData, FileType } from '../types';
import Icon from './Icon';

interface TreeNodeProps {
  node: TreeNodeData;
  onSelectNode: (path: string) => void;
  selectedPath: string;
  onMoveItems: (sourcePaths: string[], destinationPath: string) => void;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onSelectNode, selectedPath, onMoveItems, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const openTimer = useRef<number | null>(null);

  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  useEffect(() => {
    // Clean up timer if component unmounts or drag leaves
    return () => {
        if (openTimer.current) {
            clearTimeout(openTimer.current);
        }
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleSelect = () => {
    onSelectNode(node.path);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent) => {
    // Prevent dragging the root "My Files" folder
    if (node.path === '/') {
        e.preventDefault();
        return;
    }
    e.stopPropagation();
    
    // Set data in the same format as FileItem for compatibility
    const pathsToDrag = [node.path];
    e.dataTransfer.setData('application/json-lan-drive-paths', JSON.stringify(pathsToDrag));
    e.dataTransfer.effectAllowed = 'move';
  };
    
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    
    // Only highlight if the dragged data is our internal file/folder type
    if (e.dataTransfer.types.includes('application/json-lan-drive-paths')) {
        setIsDragOver(true);
        // If folder is closed and has children, start a timer to open it
        if (!isOpen && hasChildren) {
            openTimer.current = window.setTimeout(() => {
                setIsOpen(true);
            }, 600); // 600ms delay before auto-opening
        }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
      // If we leave the area, clear the auto-open timer
      if (openTimer.current) {
        clearTimeout(openTimer.current);
        openTimer.current = null;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    dragCounter.current = 0;
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    
    const data = e.dataTransfer.getData('application/json-lan-drive-paths');
    if (!data) return;
    
    try {
        const sourcePaths = JSON.parse(data) as string[];
        if (!Array.isArray(sourcePaths) || sourcePaths.length === 0) return;

        // Prevent dropping a folder into itself or a child of itself
        if (sourcePaths.some(p => node.path === p || node.path.startsWith(p + '/'))) {
            console.warn('Cannot move a folder into itself or a descendant.');
            return;
        }
        
        onMoveItems(sourcePaths, node.path);
    } catch (err) {
        console.error('Failed to parse dropped data:', err);
    }
  };


  const itemClasses = `flex items-center p-2 rounded-md cursor-pointer transition-colors duration-150 ${
    isDragOver
      ? 'bg-blue-200 dark:bg-gray-600'
      : isSelected 
        ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-white' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
  }`;

  return (
    <div>
      <div 
        className={itemClasses} 
        onClick={handleSelect} 
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        draggable={node.path !== '/'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren ? (
          <button onClick={handleToggle} className="mr-2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5 mr-2"></span> // Placeholder for alignment
        )}
        {/* FIX: Use FileType.FOLDER enum member instead of the string literal 'folder' to satisfy the Icon component's prop type. */}
        <Icon type={FileType.FOLDER} className="w-5 h-5 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{node.name}</span>
      </div>
      {isOpen && hasChildren && (
        <div className="pl-4">
          {node.children.map(childNode => (
            <TreeNode
              key={childNode.path}
              node={childNode}
              onSelectNode={onSelectNode}
              selectedPath={selectedPath}
              onMoveItems={onMoveItems}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;