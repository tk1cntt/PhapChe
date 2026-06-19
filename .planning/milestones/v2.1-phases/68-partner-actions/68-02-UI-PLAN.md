---
phase: "68"
plan: "02"
type: execute
wave: 1
depends_on: ["68-01"]
files_modified:
  - src/components/partners/ui/StatusUpdateForm.tsx
  - src/components/partners/ui/CommentList.tsx
  - src/components/partners/ui/CommentForm.tsx
  - src/components/partners/ui/DocumentList.tsx
  - src/components/partners/ui/DocumentUpload.tsx
  - src/app/partners/requests/[id]/page.tsx
autonomous: true
requirements:
  - P-ACT-05 to P-ACT-08
must_haves:
  - Partner action UI components
  - Request detail page with actions
---

# Phase 68: Partner Actions — UI Plan

## Overview

**Phase:** 68
**Plan:** 02 - UI Implementation
**Objective:** Complete UI for partner actions (status update, comments, document upload)
**Depends on:** Plan 01 (API)

## Tasks

### Task 1: StatusUpdateForm Component

```typescript
// src/components/partners/ui/StatusUpdateForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface StatusUpdateFormProps {
  requestId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

const ALLOWED_STATUSES = [
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'waiting_customer', label: 'Chờ khách hàng' },
  { value: 'review_pending', label: 'Chờ duyệt' },
  { value: 'completed', label: 'Hoàn thành' },
];

export function StatusUpdateForm({ requestId, currentStatus, onSuccess }: StatusUpdateFormProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/partner/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">{t('partner.status.label')}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          disabled={isSubmitting}
        >
          {ALLOWED_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">{t('partner.status.note')}</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={3}
          placeholder={t('partner.status.notePlaceholder')}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || status === currentStatus}
        className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
      >
        {isSubmitting ? t('common.saving') : t('partner.status.update')}
      </button>
    </form>
  );
}
```

### Task 2: CommentList & CommentForm Components

```typescript
// src/components/partners/ui/CommentList.tsx
'use client';

import { useTranslation } from '@/lib/i18n/client';

interface Comment {
  id: string;
  content: string;
  author: { id: string; name: string; email: string };
  authorType: string;
  isInternal: boolean;
  createdAt: string;
}

interface CommentListProps {
  comments: Comment[];
  onRefresh?: () => void;
}

export function CommentList({ comments }: CommentListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{t('partner.comments.title')}</h3>
      
      {comments.length === 0 ? (
        <p className="text-gray-500">{t('partner.comments.empty')}</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg ${
                comment.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">
                  {comment.author.name}
                  {comment.isInternal && (
                    <span className="ml-2 text-xs text-yellow-600">(Nội bộ)</span>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Task 3: CommentForm Component

```typescript
// src/components/partners/ui/CommentForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface CommentFormProps {
  requestId: string;
  onSuccess?: (comment: unknown) => void;
}

export function CommentForm({ requestId, onSuccess }: CommentFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/partner/requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isInternal }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add comment');
      }

      const data = await res.json();
      setContent('');
      setIsInternal(false);
      onSuccess?.(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-md border-gray-300"
          rows={3}
          placeholder={t('partner.comments.placeholder')}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="mr-2"
          />
          {t('partner.comments.internal')}
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
        >
          {isSubmitting ? t('common.sending') : t('partner.comments.send')}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
```

### Task 4: DocumentList & DocumentUpload Components

```typescript
// src/components/partners/ui/DocumentList.tsx
'use client';

import { useTranslation } from '@/lib/i18n/client';

interface Document {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const { t } = useTranslation();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{t('partner.documents.title')}</h3>
      
      {documents.length === 0 ? (
        <p className="text-gray-500">{t('partner.documents.empty')}</p>
      ) : (
        <div className="divide-y">
          {documents.map((doc) => (
            <div key={doc.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{doc.filename}</p>
                <p className="text-xs text-gray-500">
                  {formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                </p>
                {doc.description && (
                  <p className="text-sm text-gray-600">{doc.description}</p>
                )}
              </div>
              <button className="text-primary text-sm hover:underline">
                {t('partner.documents.download')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Task 5: DocumentUpload Component

```typescript
// src/components/partners/ui/DocumentUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface DocumentUploadProps {
  requestId: string;
  onSuccess?: (doc: unknown) => void;
}

export function DocumentUpload({ requestId, onSuccess }: DocumentUploadProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);

      const res = await fetch(`/api/partner/requests/${requestId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload');
      }

      const data = await res.json();
      setFile(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError(t('partner.documents.sizeError'));
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-dark"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('partner.documents.descriptionPlaceholder')}
          className="w-full rounded-md border-gray-300"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!file || isUploading}
        className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
      >
        {isUploading ? t('common.uploading') : t('partner.documents.upload')}
      </button>
    </form>
  );
}
```

## Success Criteria

1. ✅ StatusUpdateForm component created
2. ✅ CommentList and CommentForm components created
3. ✅ DocumentList and DocumentUpload components created
4. ✅ Partner request detail page created
5. ⏳ Unit tests for components - deferred to test phase
6. ⏳ E2E tests - deferred to test phase

## Output

Create `.planning/phases/68-partner-actions/68-02-SUMMARY.md` when done
