

import React, { useState } from 'react';
// FIX: Import FileType to use its enum members for type safety.
import { TreeNodeData, FileType } from '../types';
import Icon from './Icon';

interface TreeNodeProps {
  node: TreeNodeData;
  onSelectNode: (path: string) => void;
  selectedPath: string;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onSelectNode, selectedPath, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 1);

  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleSelect = () => {
    onSelectNode(node.path);
  };

  const itemClasses = `flex items-center p-2 rounded-md cursor-pointer ${
    isSelected ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
  }`;

  return (
    <div>
      <div className={itemClasses} onClick={handleSelect} style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}>
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
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;