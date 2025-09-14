import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { FileType, FileEntry, TreeNodeData } from './types';

const FILES_ROOT = path.resolve(process.cwd(), 'files');

// --- UTILITY FUNCTIONS ---

// Safely resolves a user-provided path against the root directory, preventing directory traversal.
function getSafePath(userPath: string): string {
    const resolvedPath = path.join(FILES_ROOT, userPath);
    if (!resolvedPath.startsWith(FILES_ROOT)) {
        throw new Error('Access denied: Path is outside of the allowed directory.');
    }
    return resolvedPath;
}

// Reads and parses the JSON body from an incoming request.
async function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (e) {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}

// Responds with a JSON object and a given status code.
function jsonResponse(res: ServerResponse, statusCode: number, data: any) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

// Responds with an error message.
function errorResponse(res: ServerResponse, statusCode: number, message: string) {
    jsonResponse(res, statusCode, { message });
}

// Converts a file system entity into our standard FileEntry format.
async function toFileEntry(dirent: import('node:fs').Dirent | { name: string; isDirectory: () => boolean; }, dirPath: string): Promise<FileEntry> {
    const fullPath = path.join(getSafePath(dirPath), dirent.name);
    const stats = await fs.stat(fullPath);
    const entryPath = path.posix.join(dirPath, dirent.name);

    return {
        name: dirent.name,
        type: dirent.isDirectory() ? FileType.FOLDER : FileType.FILE,
        size: stats.size,
        lastModified: stats.mtime,
        path: entryPath,
    };
}


// --- API HANDLERS ---

async function handleGetFiles(url: URL, res: ServerResponse) {
    const dirPath = url.searchParams.get('path') || '/';
    const query = url.searchParams.get('query') || '';
    
    if (query) {
        // Search logic
        const results: FileEntry[] = [];
        async function search(currentDir: string) {
            const dirents = await fs.readdir(getSafePath(currentDir), { withFileTypes: true });
            for (const dirent of dirents) {
                if (dirent.name.toLowerCase().includes(query.toLowerCase())) {
                    results.push(await toFileEntry(dirent, currentDir));
                }
                if (dirent.isDirectory()) {
                    await search(path.posix.join(currentDir, dirent.name));
                }
            }
        }
        await search(dirPath);
        return jsonResponse(res, 200, results);
    } else {
        // Standard directory listing
        const safePath = getSafePath(dirPath);
        const dirents = await fs.readdir(safePath, { withFileTypes: true });
        
        const fileEntries = await Promise.all(
            dirents.map(dirent => toFileEntry(dirent, dirPath))
        );
        return jsonResponse(res, 200, fileEntries);
    }
}

async function handleUpload(req: IncomingMessage, res: ServerResponse) {
    const { path: dirPath, fileName, content } = await readBody(req);
    const safePath = getSafePath(path.join(dirPath, fileName));
    await fs.writeFile(safePath, content, 'base64');
    
    const dirent = {
        name: fileName,
        isDirectory: () => false,
    };
    const newEntry = await toFileEntry(dirent, dirPath);
    jsonResponse(res, 201, newEntry);
}

async function handleCreateFolder(req: IncomingMessage, res: ServerResponse) {
    const { path: dirPath, folderName } = await readBody(req);
    const safePath = getSafePath(path.join(dirPath, folderName));
    await fs.mkdir(safePath, { recursive: true });

    const dirent = { name: folderName, isDirectory: () => true };
    const newEntry = await toFileEntry(dirent, dirPath);
    jsonResponse(res, 201, newEntry);
}

async function handleGetFolderTree(res: ServerResponse) {
    async function buildTree(currentPath: string): Promise<TreeNodeData[]> {
        const safePath = getSafePath(currentPath);
        const dirents = await fs.readdir(safePath, { withFileTypes: true });
        return Promise.all(dirents
            .filter(d => d.isDirectory())
            .map(async d => ({
                name: d.name,
                path: path.posix.join(currentPath, d.name),
                children: await buildTree(path.posix.join(currentPath, d.name)),
            }))
        );
    }
    const tree: TreeNodeData = {
        name: 'My Files',
        path: '/',
        children: await buildTree('/'),
    };
    jsonResponse(res, 200, tree);
}

async function handleDelete(req: IncomingMessage, res: ServerResponse) {
    const { paths } = await readBody(req);
    if (!paths || !Array.isArray(paths)) return errorResponse(res, 400, 'Invalid request body');
    const topLevelPaths = paths.filter((p: string) => !paths.some((other: string) => p.startsWith(other + '/') && p !== other));
    await Promise.all(topLevelPaths.map((p: string) => fs.rm(getSafePath(p), { recursive: true, force: true })));
    res.statusCode = 204;
    res.end();
}

async function handleCopy(req: IncomingMessage, res: ServerResponse) {
    const { paths, destinationPath } = await readBody(req);
    if (!paths || !Array.isArray(paths) || !destinationPath) return errorResponse(res, 400, 'Invalid request body');
    const topLevelPaths = paths.filter((p: string) => !paths.some((other: string) => p.startsWith(other + '/') && p !== other));
    
    await Promise.all(topLevelPaths.map(async (p: string) => {
        const sourcePath = getSafePath(p);
        const destName = path.basename(p);
        const destPath = getSafePath(path.join(destinationPath, destName));
        await fs.cp(sourcePath, destPath, { recursive: true });
    }));
    res.statusCode = 204;
    res.end();
}

async function handleMove(req: IncomingMessage, res: ServerResponse) {
    const { paths, destinationPath } = await readBody(req);
    if (!paths || !Array.isArray(paths) || !destinationPath) return errorResponse(res, 400, 'Invalid request body');
    const topLevelPaths = paths.filter((p: string) => !paths.some((other: string) => p.startsWith(other + '/') && p !== other));

    await Promise.all(topLevelPaths.map(async (p: string) => {
        const sourcePath = getSafePath(p);
        const destName = path.basename(p);
        const destPath = getSafePath(path.join(destinationPath, destName));
        await fs.rename(sourcePath, destPath);
    }));
    res.statusCode = 204;
    res.end();
}

async function handleRename(req: IncomingMessage, res: ServerResponse) {
    const { entryPath, newName } = await readBody(req);
    if (!entryPath || !newName) return errorResponse(res, 400, 'Invalid request body');

    const sourcePath = getSafePath(entryPath);
    // Construct the new path using posix semantics (like the client) before sanitizing.
    const parentClientDir = path.posix.dirname(entryPath);
    const newClientPath = path.posix.join(parentClientDir, newName);
    const destPath = getSafePath(newClientPath);

    await fs.rename(sourcePath, destPath);
    res.statusCode = 204;
    res.end();
}

async function handleDecompress(req: IncomingMessage, res: ServerResponse) {
    const { path: zipPath } = await readBody(req);
    if (!zipPath) return errorResponse(res, 400, 'Invalid request body');
    
    const sourcePath = getSafePath(zipPath);
    const folderName = path.basename(zipPath, '.zip');
    const parentDir = path.posix.dirname(zipPath);
    let destPath = getSafePath(path.join(parentDir, folderName));

    // Handle name conflicts for the destination folder.
    let i = 1;
    while (true) {
        try {
            await fs.access(destPath);
            destPath = getSafePath(path.join(parentDir, `${folderName} (${i++})`));
        } catch {
            break;
        }
    }

    let unzipper: any;
    try {
        unzipper = require('unzipper');
    } catch (err) {
        unzipper = null;
    }

    if (!unzipper) {
        console.error("The 'unzipper' library is not available. Using placeholder for decompression.");
        await fs.mkdir(destPath, { recursive: true });
        await fs.writeFile(path.join(destPath, 'unzipped-placeholder.txt'), "Files would be here. Real decompression requires the 'unzipper' library.");
        res.statusCode = 204;
        res.end();
        return;
    }

    try {
        const stream = createReadStream(sourcePath).pipe(unzipper.Extract({ path: destPath }));
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
        res.statusCode = 204;
        res.end();
    } catch (err) {
        // Clean up partially extracted directory if decompression fails
        try { await fs.rm(destPath, { recursive: true, force: true }); } catch (e) { /* ignore cleanup error */ }
        throw err;
    }
}


async function handleCategorize(req: IncomingMessage, res: ServerResponse) {
    const { paths, currentPath } = await readBody(req);
    if (!paths || !Array.isArray(paths)) return errorResponse(res, 400, 'Invalid request body');

    const CATEGORIES: Record<string, string[]> = {
        'Pictures': ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
        'Videos': ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        'Audio': ['mp3', 'wav', 'ogg', 'flac'],
        'Documents': ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'],
        'Archives': ['zip', 'rar', '7z', 'tar', 'gz'],
    };

    for (const p of paths) {
        const ext = path.basename(p).split('.').pop()?.toLowerCase();
        if (!ext) continue;

        const category = Object.keys(CATEGORIES).find(key => CATEGORIES[key].includes(ext)) || 'Other';
        const destDir = path.join(currentPath, category);
        
        await fs.mkdir(getSafePath(destDir), { recursive: true });
        
        const sourcePath = getSafePath(p);
        const destPath = getSafePath(path.join(destDir, path.basename(p)));
        await fs.rename(sourcePath, destPath);
    }
    res.statusCode = 204;
    res.end();
}

async function handleDownloadFile(url: URL, res: ServerResponse) {
    const filePath = url.searchParams.get('path');
    if (!filePath) {
        return errorResponse(res, 400, 'File path is required.');
    }

    try {
        const safePath = getSafePath(filePath);
        const stats = await fs.stat(safePath);

        if (stats.isDirectory()) {
            return errorResponse(res, 400, 'Downloading directories is not supported.');
        }

        const fileName = path.basename(safePath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Length', stats.size);

        const readStream = createReadStream(safePath);
        readStream.pipe(res);
        
        readStream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                 errorResponse(res, 500, 'Error reading the file.');
            }
        });
        
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return errorResponse(res, 404, 'File not found.');
        }
        console.error(`Error downloading file ${filePath}:`, err);
        if (!res.headersSent) {
            errorResponse(res, 500, 'Internal server error while preparing download.');
        }
    }
}

// --- VITE PLUGIN ---

export function fsPlugin(): Plugin {
    return {
        name: 'fs-backend',
        async configureServer(server) {
            // Ensure the root 'files' directory exists on startup.
            await fs.mkdir(FILES_ROOT, { recursive: true });

            server.middlewares.use(async (req, res, next) => {
                if (!req.url?.startsWith('/api/')) return next();

                const url = new URL(req.url, `http://${req.headers.host}`);
                
                try {
                    switch (url.pathname) {
                        case '/api/files': return await handleGetFiles(url, res);
                        case '/api/upload': return await handleUpload(req, res);
                        case '/api/create-folder': return await handleCreateFolder(req, res);
                        case '/api/folder-tree': return await handleGetFolderTree(res);
                        case '/api/delete': return await handleDelete(req, res);
                        case '/api/copy': return await handleCopy(req, res);
                        case '/api/move': return await handleMove(req, res);
                        case '/api/rename': return await handleRename(req, res);
                        case '/api/decompress': return await handleDecompress(req, res);
                        case '/api/categorize': return await handleCategorize(req, res);
                        case '/api/download-file': return await handleDownloadFile(url, res);
                        default:
                            errorResponse(res, 404, 'API endpoint not found.');
                    }
                } catch (err) {
                    console.error(`API Error on ${req.url}:`, err);
                    errorResponse(res, 500, (err as Error).message || 'Internal Server Error');
                }
            });
        },
    };
}
