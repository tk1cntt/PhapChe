'use client';

import { useTranslations } from 'next-intl';

interface Document {
  id: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  size: number;
  description?: string | null;
  createdAt: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => void;
  onDownload?: (storageKey: string, filename: string) => void;
}

export function DocumentList({ documents, onDelete, onDownload }: DocumentListProps) {
  const t = useTranslations();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.includes('pdf')) {
      return (
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const handleDownload = (doc: Document) => {
    if (onDownload) {
      onDownload(doc.storageKey, doc.filename);
    } else {
      // Default download behavior using storageKey
      window.open(`/api/storage/download?key=${encodeURIComponent(doc.storageKey)}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">{t('partner.documents.title')}</h3>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2">{t('partner.documents.empty')}</p>
        </div>
      ) : (
        <div className="divide-y border-b">
          {documents.map((doc) => (
            <div key={doc.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(doc.mimeType)}
                <div>
                  <p className="font-medium text-sm">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    {formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  {doc.description && (
                    <p className="text-sm text-gray-600">{doc.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(doc)}
                  className="text-primary text-sm hover:underline"
                >
                  {t('partner.documents.download')}
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
