import React, { useState, useRef, useEffect } from 'react';
// FIX: Import FileType to use its enum members for type safety.
import { TreeNodeData, FileType } from '../types';
import Icon from './Icon';

interface TreeNodeProps {
  node: TreeNodeData;
  onSelectNode: (path: string) => void;
  selectedPath: string;
  onMoveItems: (sourcePaths: string[], destinationPath: string) => void;
  onRenameNode: (path: string, newName: string) => Promise<void>;
  onDeleteNode: (path: string, name: string) => void;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onSelectNode, selectedPath, onMoveItems, onRenameNode, onDeleteNode, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedName, setEditedName] = useState(node.name);

  const dragCounter = useRef(0);
  const openTimer = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = node.path === '/';

  // Effect to handle closing menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  // Effect to focus input when renaming starts
  useEffect(() => {
    if (isRenaming) {
        inputRef.current?.focus();
        inputRef.current?.select();
    }
  }, [isRenaming]);

  // Clean up drag-to-open timer
  useEffect(() => {
    return () => {
        if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleSelect = () => {
    if (!isRenaming) {
        onSelectNode(node.path);
    }
  };
  
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setIsMenuOpen(false);
    setEditedName(node.name);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDeleteNode(node.path, node.name);
  };

  const handleRenameSubmit = async () => {
    if (isRenaming) {
        setIsRenaming(false);
        if (editedName.trim() && editedName !== node.name) {
            await onRenameNode(node.path, editedName.trim());
        }
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleRenameSubmit();
    } else if (e.key === 'Escape') {
        setIsRenaming(false);
        setEditedName(node.name);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent) => {
    if (isRoot) {
        e.preventDefault();
        return;
    }
    e.stopPropagation();
    
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
    
    if (e.dataTransfer.types.includes('application/json-lan-drive-paths')) {
        setIsDragOver(true);
        if (!isOpen && hasChildren) {
            openTimer.current = window.setTimeout(() => setIsOpen(true), 600);
        }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
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

        if (sourcePaths.some(p => node.path === p || node.path.startsWith(p + '/'))) {
            console.warn('Cannot move a folder into itself or a descendant.');
            return;
        }
        
        onMoveItems(sourcePaths, node.path);
    } catch (err) {
        console.error('Failed to parse dropped data:', err);
    }
  };


  const itemClasses = `group flex items-center p-2 rounded-md cursor-pointer transition-colors duration-150 relative ${
    isDragOver
      ? 'bg-blue-200 dark:bg-gray-600'
      : isSelected && !isRenaming
        ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-white' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
  }`;

  return (
    <div>
      <div 
        className={itemClasses} 
        onClick={handleSelect} 
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        draggable={!isRoot && !isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren ? (
          <button onClick={handleToggle} className="mr-2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
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
        <Icon type={FileType.FOLDER} className="w-5 h-5 mr-2 flex-shrink-0" />
        
        {isRenaming ? (
            <input 
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-medium bg-white dark:bg-gray-600 border border-blue-500 rounded px-1 py-0 w-full"
            />
        ) : (
            <span className="text-sm font-medium truncate">{node.name}</span>
        )}

        {!isRoot && !isRenaming && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2" ref={menuRef}>
                <button 
                    onClick={handleMenuToggle} 
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:opacity-100 focus:outline-none"
                    aria-label={`Actions for ${node.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M5 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
                        <ul className="py-1">
                            <li>
                                <button onClick={handleRenameClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L13.196 5.232z" />
                                    </svg>
                                    Rename
                                </button>
                            </li>
                            <li>
                                <button onClick={handleDeleteClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        )}
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
              onRenameNode={onRenameNode}
              onDeleteNode={onDeleteNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;