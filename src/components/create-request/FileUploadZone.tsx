'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, File, Image as ImageIcon } from 'lucide-react';
import type { UploadedFile } from '@/lib/types/wizard';

interface FileUploadZoneProps {
  files: UploadedFile[];
  onFileAdd: (file: UploadedFile) => void;
  onFileRemove: (fileId: string) => void;
  locale?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

/**
 * Get icon based on file type
 */
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png'].includes(ext || '')) return ImageIcon;
  return File;
}

/**
 * Format file size to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * File upload zone with drag-and-drop support and progress tracking
 */
export default function FileUploadZone({
  files,
  onFileAdd,
  onFileRemove,
  locale = 'vi',
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File vượt quá 50MB';
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Loại file không được hỗ trợ';
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              onFileAdd({
                vaultFileId: response.id || response.fileId || `temp-${Date.now()}`,
                filename: file.name,
                size: file.size,
              });
              setUploadProgress(0);
            } catch {
              setError('Không thể xử lý phản hồi từ server');
            }
          } else {
            setError('Không thể tải lên file');
          }
          setUploading(false);
        });

        xhr.addEventListener('error', () => {
          setError('Lỗi mạng khi tải lên file');
          setUploading(false);
        });

        xhr.open('POST', '/api/intake/attach-file');
        xhr.send(formData);
      } catch {
        setError('Không thể tải lên file');
        setUploading(false);
      }
    },
    [onFileAdd, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        uploadFile(droppedFiles[0]);
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        uploadFile(selectedFiles[0]);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadFile]
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      if (window.confirm('Xóa file này?')) {
        onFileRemove(fileId);
      }
    },
    [onFileRemove]
  );

  const handleZoneClick = useCallback(() => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [uploading]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài liệu đính kèm</h2>
      <p className="text-sm text-gray-600 mb-6">
        Tải lên các tài liệu liên quan (không bắt buộc)
      </p>

      {/* Upload Zone */}
      <div
        onClick={handleZoneClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-700 mb-2">
          Kéo thả file vào đây hoặc click để chọn
        </p>
        <p className="text-xs text-gray-500">
          Hỗ trợ: PDF, DOC, DOCX, JPG, PNG (tối đa 50MB)
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Đang tải lên...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {files.length} file đã tải lên
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.filename);
              return (
                <div
                  key={file.vaultFileId}
                  className="relative border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.vaultFileId)}
                    className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Xóa file"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                  <FileIcon size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-900 font-medium line-clamp-2 mb-1">
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {files.length === 0 && !uploading && (
        <p className="text-sm text-gray-500 text-center mt-4">
          Chưa có file nào được tải lên
        </p>
      )}
    </div>
  );
}
