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
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

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

/** Generate a temporary vaultFileId for wizard-stage files */
function generateTempFileId(): string {
  return `wip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * File upload zone with drag-and-drop support.
 * Files are stored locally in wizard state during creation (no server upload).
 * Actual server upload happens at submit time.
 */
export default function FileUploadZone({
  files,
  onFileAdd,
  onFileRemove,
  locale = 'vi',
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [simulatingProgress, setSimulatingProgress] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
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
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Loại file không được hỗ trợ';
    }
    return null;
  }, []);

  const handleFileAdd = useCallback(
    (file: File) => {
      setSimulatingProgress(true);
      setSimulatedProgress(0);
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSimulatingProgress(false);
        return;
      }

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setSimulatedProgress(100);

          setTimeout(() => {
            onFileAdd({
              vaultFileId: generateTempFileId(),
              filename: file.name,
              size: file.size,
            });
            setSimulatingProgress(false);
            setSimulatedProgress(0);
          }, 200);
        }
        setSimulatedProgress(Math.min(progress, 100));
      }, 150);
    },
    [onFileAdd, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      for (const file of droppedFiles) {
        handleFileAdd(file);
      }
    },
    [handleFileAdd]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          handleFileAdd(selectedFiles[i]);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileAdd]
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
    if (!simulatingProgress && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [simulatingProgress]);

  return (
    <div className="w-full">
      <h2 className="step-title">Tài liệu đính kèm</h2>
      <p className="step-desc">
        Tải lên các tài liệu liên quan (không bắt buộc)
      </p>

      {/* Upload Zone */}
      <div
        onClick={handleZoneClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${simulatingProgress ? 'uploading' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload size={48} className="upload-icon" />
        <p className="upload-text">
          Kéo thả file vào đây hoặc click để chọn
        </p>
        <p className="upload-hint">
          Hỗ trợ: PDF, DOC, DOCX, JPG, PNG (tối đa 50MB)
        </p>
      </div>

      {/* Simulated Progress */}
      {simulatingProgress && (
        <div className="upload-progress">
          <div className="progress-info">
            <span>Đang tải lên...</span>
            <span>{Math.round(simulatedProgress)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${simulatedProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="uploaded-files-list">
          <h3 className="files-count">{files.length} file đã tải lên</h3>
          <div className="files-grid">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.filename);
              return (
                <div key={file.vaultFileId} className="uploaded-file-item">
                  <div className="file-info">
                    <div className="file-icon">
                      <FileIcon size={24} />
                    </div>
                    <div className="file-details">
                      <p>{file.filename}</p>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.vaultFileId)}
                    className="remove-btn"
                    aria-label="Xóa file"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {files.length === 0 && !simulatingProgress && (
        <p className="no-files">Chưa có file nào được tải lên</p>
      )}
    </div>
  );
}
