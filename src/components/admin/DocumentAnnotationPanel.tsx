'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Info,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { AiAnnotationContent } from './AiAnnotationContent';
import '@/styles/pages/admin/annotation-panel.css';

// ── Types ────────────────────────────────────────────────────

export interface Annotation {
  id: string;
  fileKey: string;
  authorId: string;
  authorName: string;
  content: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'warning';
  category: 'issue' | 'suggestion' | 'question' | 'comment';
  position: { line?: number; lineStart?: number; lineEnd?: number; snippet?: string } | null;
  status: 'open' | 'resolved' | 'dismissed';
  aiGenerated: boolean;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnnotationPanelProps {
  requestId: string;
  fileKey: string | null;
  fileName: string | null;
  reloadKey?: number;
}

// ── Helpers ──────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, className: 'severity-critical', color: 'var(--color-danger)' },
  warning: { icon: AlertTriangle, className: 'severity-warning', color: '#f59e0b' },
  info: { icon: Info, className: 'severity-info', color: 'var(--color-primary)' },
} as const;

// ── Component ────────────────────────────────────────────────

export function DocumentAnnotationPanel({
  requestId,
  fileKey,
  fileName,
  reloadKey,
}: DocumentAnnotationPanelProps) {
  const t = useTranslations('ChatActivity');

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formContent, setFormContent] = useState('');
  const [formSeverity, setFormSeverity] = useState<Annotation['severity']>('info');
  const [formCategory, setFormCategory] = useState<'issue' | 'suggestion' | 'question' | 'comment'>('issue');
  const [formError, setFormError] = useState<string | null>(null);

  // ── Load annotations ──

  const loadAnnotations = useCallback(async () => {
    if (!fileKey) {
      setAnnotations([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/requests/${requestId}/files/annotations?fileKey=${fileKey}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setAnnotations(data.annotations ?? []);
    } catch {
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  }, [requestId, fileKey]);

  useEffect(() => {
    setShowForm(false);
    setEditingId(null);
    loadAnnotations();
  }, [fileKey, loadAnnotations, reloadKey]);

  // ── CRUD handlers ──

  const resetForm = useCallback(() => {
    setFormContent('');
    setFormSeverity('info');
    setFormCategory('issue');
    setFormError(null);
    setShowForm(false);
    setEditingId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formContent.trim()) {
      setFormError(t('annotationPlaceholder'));
      return;
    }
    if (!fileKey) return;

    setSaving(true);
    setFormError(null);

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/requests/${requestId}/files/annotations/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: formContent.trim(),
            severity: formSeverity,
            category: formCategory,
          }),
        });
        if (!res.ok) throw new Error('Failed to update');
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? { ...a, content: formContent.trim(), severity: formSeverity, category: formCategory, updatedAt: new Date().toISOString() }
              : a,
          ),
        );
      } else {
        const res = await fetch(`/api/admin/requests/${requestId}/files/annotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileKey,
            content: formContent.trim(),
            severity: formSeverity,
            category: formCategory,
          }),
        });
        if (!res.ok) throw new Error('Failed to create');
        const data = await res.json();
        setAnnotations((prev) => [data.annotation, ...prev]);
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [formContent, formSeverity, formCategory, fileKey, editingId, requestId, t, resetForm]);

  const handleEdit = useCallback((ann: Annotation) => {
    setFormContent(ann.content);
    setFormSeverity(ann.severity as 'info' | 'warning' | 'critical');
    setFormCategory(ann.category as 'issue' | 'suggestion' | 'question' | 'comment');
    setEditingId(ann.id);
    setShowForm(true);
    setFormError(null);
  }, []);

  const handleResolve = useCallback(async (ann: Annotation) => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/files/annotations/${ann.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ann.status === 'resolved' ? 'open' : 'resolved' }),
      });
      if (!res.ok) throw new Error('Failed');
      setAnnotations((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, status: a.status === 'resolved' ? 'open' : 'resolved' as const } : a)),
      );
    } catch {
      // silent
    }
  }, [requestId]);

  const handleDelete = useCallback(async (ann: Annotation) => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/files/annotations/${ann.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
    } catch {
      // silent
    }
  }, [requestId]);

  // ── Empty state (no file selected) ──

  if (!fileKey) {
    return (
      <div className="annotation-panel">
        <div className="annotation-panel-header">
          <h3 className="annotation-panel-title">
            <MessageSquare size={14} />
            {t('annotationTitle')}
          </h3>
        </div>
        <div className="annotation-panel-empty">
          <p>{t('fileSelectHint')}</p>
        </div>
      </div>
    );
  }

  const openCount = annotations.filter((a) => a.status === 'open').length;

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="annotation-panel">
      {/* Header */}
      <div className="annotation-panel-header">
        <h3 className="annotation-panel-title">
          <MessageSquare size={14} />
          {t('annotationTitle')}
          {fileName && (
            <span className="annotation-panel-filename">· {fileName}</span>
          )}
        </h3>
        {openCount > 0 && (
          <span className="annotation-panel-count">{openCount}</span>
        )}
        <button
          type="button"
          className="annotation-panel-add-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={showForm && !editingId}
        >
          <Plus size={14} />
          {t('annotationAdd')}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="annotation-form">
          <textarea
            className="annotation-form-textarea"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder={t('annotationPlaceholder')}
            rows={3}
            autoFocus
          />
          <div className="annotation-form-controls">
            <div className="annotation-form-selects">
              <select
                className="annotation-form-select"
                value={formSeverity}
                onChange={(e) => setFormSeverity(e.target.value as typeof formSeverity)}
              >
                <option value="info">{t('annotationSeverityInfo')}</option>
                <option value="warning">{t('annotationSeverityWarning')}</option>
                <option value="critical">{t('annotationSeverityCritical')}</option>
              </select>
              <select
                className="annotation-form-select"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as typeof formCategory)}
              >
                <option value="issue">{t('annotationCategoryIssue')}</option>
                <option value="suggestion">{t('annotationCategorySuggestion')}</option>
                <option value="question">{t('annotationCategoryQuestion')}</option>
                <option value="comment">{t('annotationCategoryComment')}</option>
              </select>
            </div>
            <div className="annotation-form-actions">
              {formError && <span className="annotation-form-error">{formError}</span>}
              <button
                type="button"
                className="annotation-form-cancel"
                onClick={resetForm}
              >
                <X size={14} />
                {t('annotationCancel')}
              </button>
              <button
                type="button"
                className="annotation-form-save"
                onClick={handleSave}
                disabled={saving || !formContent.trim()}
              >
                {saving ? <Loader2 size={14} className="spinning" /> : <Check size={14} />}
                {t('annotationSave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="annotation-panel-loading">
          <Loader2 size={16} className="spinning" />
        </div>
      )}

      {/* Empty (loaded, no annotations) */}
      {!loading && annotations.length === 0 && (
        <div className="annotation-panel-empty">
          <p>{t('annotationNoNotes')}</p>
        </div>
      )}

      {/* Annotation list */}
      {!loading && annotations.length > 0 && (
        <div className="annotation-list">
          {annotations.map((ann) => {
            const sevConfig = SEVERITY_CONFIG[ann.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info;
            const SevIcon = sevConfig.icon;
            const isResolved = ann.status === 'resolved';

            return (
              <div
                key={ann.id}
                className={`annotation-item${isResolved ? ' resolved' : ''}${ann.severity === 'critical' ? ' critical' : ''}`}
              >
                <div className="annotation-item-header">
                  <span className={`annotation-item-severity ${sevConfig.className}`}>
                    <SevIcon size={12} />
                    {t(`annotationSeverity${ann.severity.charAt(0).toUpperCase() + ann.severity.slice(1)}` as any)}
                  </span>
                  {ann.aiGenerated && (
                    <span className="annotation-item-ai-badge">
                      <Sparkles size={10} />
                      AI
                    </span>
                  )}
                  <span className="annotation-item-category">
                    {t(`annotationCategory${ann.category.charAt(0).toUpperCase() + ann.category.slice(1)}` as any)}
                  </span>
                  {ann.aiConfidence !== undefined && (
                    <span className="annotation-item-confidence">
                      {(ann.aiConfidence * 100).toFixed(0)}%
                    </span>
                  )}
                  {ann.position?.line && (
                    <span className="annotation-item-line">
                      📍 dòng {ann.position.line}
                    </span>
                  )}
                  <span className="annotation-item-author">
                    {ann.authorName}
                  </span>
                  <span className="annotation-item-time">
                    {new Date(ann.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="annotation-item-content">
                  {ann.aiGenerated ? (
                    <AiAnnotationContent content={ann.content} compact />
                  ) : (
                    ann.content
                  )}
                </div>
                <div className="annotation-item-actions">
                  {ann.aiGenerated && ann.status === 'open' && (
                    <>
                      <button
                        type="button"
                        className="annotation-item-action accept"
                        onClick={() => handleResolve(ann)}
                        title="Chấp nhận AI finding"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        className="annotation-item-action dismiss"
                        onClick={() => handleDelete(ann)}
                        title="Bỏ qua AI finding"
                      >
                        <X size={12} />
                      </button>
                    </>
                  )}
                  {!ann.aiGenerated && (
                    <>
                      <button
                        type="button"
                        className="annotation-item-action"
                        onClick={() => handleEdit(ann)}
                        title={t('annotationEdit')}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        className={`annotation-item-action${isResolved ? ' resolved' : ''}`}
                        onClick={() => handleResolve(ann)}
                        title={t('annotationResolve')}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        className="annotation-item-action danger"
                        onClick={() => handleDelete(ann)}
                        title={t('annotationDelete')}
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
