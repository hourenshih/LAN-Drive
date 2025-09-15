import React, { useContext } from 'react';
import { UploadProgressContext, UploadingFile } from '../contexts/UploadProgressContext';
import Icon from './Icon';

const UploadItem: React.FC<{ file: UploadingFile }> = ({ file }) => {
    const { cancelUpload } = useContext(UploadProgressContext);

    const getStatusIcon = () => {
        switch (file.status) {
            case 'uploading':
                return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>;
            case 'done':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
            case 'error':
                 return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
        }
    }

    return (
        <li className="py-2">
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                    <Icon type="generic-file" className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.name}>{file.name}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600 my-1">
                        <div
                            className={`h-1.5 rounded-full ${file.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${file.progress}%`, transition: 'width 0.2s ease-in-out' }}
                        ></div>
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2">
                   {getStatusIcon()}
                   {file.status === 'uploading' && (
                       <button
                           onClick={() => cancelUpload(file.id)}
                           className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 p-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-red-500"
                           aria-label={`Cancel upload for ${file.name}`}
                       >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                           </svg>
                       </button>
                   )}
                </div>
            </div>
            {file.status === 'error' && file.error && <p className="text-xs text-red-500 mt-1 pl-8">{file.error}</p>}
        </li>
    );
};


const UploadProgress: React.FC = () => {
    const { uploads } = useContext(UploadProgressContext);

    if (uploads.length === 0) {
        return null;
    }

    const uploadingCount = uploads.filter(u => u.status === 'uploading').length;
    const title = uploadingCount > 0 ? `Uploading ${uploadingCount} item(s)...` : 'Uploads complete';

    return (
        <div className="fixed bottom-4 right-4 w-full max-w-sm z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700">
                <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white">{title}</h3>
                </div>
                <ul className="p-4 max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                    {uploads.map(file => <UploadItem key={file.id} file={file} />)}
                </ul>
            </div>
        </div>
    );
};

export default UploadProgress;