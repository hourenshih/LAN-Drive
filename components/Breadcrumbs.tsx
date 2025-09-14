
import React from 'react';

interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
  const parts = path.split('/').filter(Boolean);
  const crumbs = [{ name: 'Home', path: '/' }];

  parts.forEach((part, index) => {
    const crumbPath = '/' + parts.slice(0, index + 1).join('/');
    crumbs.push({ name: part, path: crumbPath });
  });

  return (
    <nav className="flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3 flex-wrap">
        {crumbs.map((crumb, index) => (
          <li key={crumb.path} className="inline-flex items-center">
            {index > 0 && (
              <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            )}
            {index < crumbs.length - 1 ? (
              <button
                onClick={() => onNavigate(crumb.path)}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                {crumb.name}
              </button>
            ) : (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{crumb.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
