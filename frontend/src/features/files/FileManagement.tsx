
import { useEffect, useState } from 'react';
import { FileService } from '../../services/FileService';
import { FileEntity } from '../../api/web-api-client';

const FileManagement = () => {
    const [files, setFiles] = useState<FileEntity[]>([]);
    const [currentParentId, setCurrentParentId] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pathHistory, setPathHistory] = useState<{ id: number | undefined, name: string }[]>([{ id: undefined, name: "Home" }]);

    useEffect(() => {
        loadFiles(currentParentId);
    }, [currentParentId]);

    const loadFiles = async (parentId?: number) => {
        try {
            setLoading(true);
            const data = await FileService.getAll(parentId);
            setFiles(data);
        } catch (err) {
            setError("Failed to load files.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folder: FileEntity) => {
        setCurrentParentId(folder.id);
        setPathHistory([...pathHistory, { id: folder.id, name: folder.name || "Unknown" }]);
    };

    const handleBack = () => {
        if (pathHistory.length <= 1) return;
        const newHistory = [...pathHistory];
        newHistory.pop();
        setPathHistory(newHistory);
        setCurrentParentId(newHistory[newHistory.length - 1].id);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        try {
            await FileService.uploadFile(e.target.files[0], currentParentId);
            loadFiles(currentParentId);
        } catch (err) {
            alert("Upload failed");
            console.error(err);
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt("Folder Name:");
        if (!name) return;
        try {
            await FileService.createFolder(name, currentParentId);
            loadFiles(currentParentId);
        } catch (err) {
            alert("Create folder failed");
            console.error(err);
        }
    };

    if (loading && files.length === 0) return <div>Loading Files...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-heading text-primary">Dateien</h1>
                <div className="space-x-2">
                    <button onClick={handleCreateFolder} className="btn-secondary">New Folder</button>
                    <label className="btn-primary cursor-pointer">
                        Upload
                        <input type="file" className="hidden" onChange={handleUpload} />
                    </label>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-600 mb-4">
                {pathHistory.length > 1 && (
                    <button onClick={handleBack} className="mr-2 text-primary hover:underline">Back</button>
                )}
                {pathHistory.map((item, index) => (
                    <span key={index}>
                        {index > 0 && " / "}
                        <span className={index === pathHistory.length - 1 ? "font-bold" : ""}>{item.name}</span>
                    </span>
                ))}
            </div>

            {error && <div className="text-red-500">{error}</div>}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {files.map((file) => (
                            <tr key={file.id}
                                className={file.isFolder ? "cursor-pointer hover:bg-gray-50" : ""}
                                onClick={() => file.isFolder && handleNavigate(file)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                    <span className="mr-2 text-xl">{file.isFolder ? "📁" : "📄"}</span>
                                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{file.isFolder ? "-" : ((file.size || 0) / 1024).toFixed(1) + " KB"}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{file.isFolder ? "Folder" : (file.contentType || "Unknown")}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {!file.isFolder && (
                                        <a href={`/api/Files/${file.id}/download`} target="_blank" rel="noreferrer" className="text-primary hover:text-red-900 mr-4" onClick={(e) => e.stopPropagation()}>Download</a>
                                    )}
                                    <button
                                        className="text-red-600 hover:text-red-900"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete?")) {
                                                if (file.id) {
                                                    await FileService.deleteFile(file.id);
                                                    loadFiles(currentParentId);
                                                }
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Empty folder</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FileManagement;
