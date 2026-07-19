'use client';

import { useTranslations } from 'next-intl';

export interface AuditEntry {
  actorName: string;
  action: string;
  targetType: string;
  targetLabel: string;
  description: string;
  time: string;
}

interface AuditTimelineProps {
  entries?: AuditEntry[];
  currentUserName?: string;
}

/** Map audit action keys → i18n keys */
const ACTION_I18N_MAP: Record<string, string> = {
  'request.created': 'auditAction.requestCreated',
  'request.status_changed': 'auditAction.requestStatusChanged',
  'request.assigned': 'auditAction.requestAssigned',
  'review.started': 'auditAction.reviewStarted',
  'review.approved': 'auditAction.reviewApproved',
  'review.rejected': 'auditAction.reviewRejected',
  'review.checklist_answered': 'auditAction.reviewChecklistAnswered',
  'intake.draft_created': 'auditAction.intakeDraftCreated',
  'intake.submitted': 'auditAction.intakeSubmitted',
  'intake.answers_saved': 'auditAction.intakeAnswersSaved',
  'user.created': 'auditAction.userCreated',
  'user.role_updated': 'auditAction.userRoleUpdated',
  'user.deactivated': 'auditAction.userDeactivated',
  'workspace.membership_assigned': 'auditAction.workspaceMembershipAssigned',
  'document.draft_generated': 'auditAction.documentDraftGenerated',
  'document.submitted_for_review': 'auditAction.documentSubmittedForReview',
  'template.created': 'auditAction.templateCreated',
  'template.published': 'auditAction.templatePublished',
  'template.deprecated': 'auditAction.templateDeprecated',
  'delivery.ready_notified': 'auditAction.deliveryReadyNotified',
  'vault.file_stored': 'auditAction.vaultFileStored',
  'vault.file_deleted': 'auditAction.vaultFileDeleted',
  'vault.access_requested': 'auditAction.vaultAccessRequested',
  'vault.metadata_accessed': 'auditAction.vaultMetadataAccessed',
  'folder.created': 'auditAction.folderCreated',
  'tag.created': 'auditAction.tagCreated',
  'vault_file.tagged': 'auditAction.vaultFileTagged',
  'vault_file.untagged': 'auditAction.vaultFileUntagged',
  'vault_file.moved_to_folder': 'auditAction.vaultFileMovedToFolder',
  'ai.chat.message': 'auditAction.aiChatMessage',
  'access_denied': 'auditAction.accessDenied',
  'permission_change': 'auditAction.permissionChange',
  'unauthorized_access_attempt': 'auditAction.unauthorizedAccess',
};

/** Map targetType → i18n key */
const TARGET_TYPE_MAP: Record<string, string> = {
  'REQUEST': 'targetType.request',
  'WORKSPACE': 'targetType.workspace',
  'USER': 'targetType.user',
  'DOCUMENT': 'targetType.document',
  'TEMPLATE': 'targetType.template',
  'REVIEW': 'targetType.review',
  'VAULT_FILE': 'targetType.vaultFile',
  'FOLDER': 'targetType.folder',
  'MESSAGE': 'targetType.message',
};

function formatActionLabel(action: string, t: ReturnType<typeof useTranslations>): string {
  const i18nKey = ACTION_I18N_MAP[action];
  if (i18nKey) {
    try {
      return t(i18nKey);
    } catch {
      // fall through to formatted fallback
    }
  }
  // Fallback: format raw key into readable text
  return action
    .replace(/\./g, ' › ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTargetType(targetType: string, t: ReturnType<typeof useTranslations>): string {
  const key = TARGET_TYPE_MAP[targetType];
  if (key) {
    try {
      return t(key);
    } catch {
      // fall through
    }
  }
  return targetType.toLowerCase().replace(/_/g, ' ');
}

function resolveActorName(actorName: string, currentUserName: string | undefined, t: ReturnType<typeof useTranslations>): string {
  if (currentUserName && actorName === currentUserName) {
    return t('auditMe');
  }
  return actorName;
}

export default function AuditTimeline({ entries = [], currentUserName }: AuditTimelineProps) {
  const t = useTranslations('AdminDashboard');

  return (
    <div className="panel">
      {/* Panel Title */}
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {t('timelinePanel')}
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '16px 0' }}>
            {t('noTimeline')}
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot" />
              <strong>
                {resolveActorName(entry.actorName, currentUserName, t)} — {formatActionLabel(entry.action, t)}
              </strong>
              <p>
                <span className="target-type-label">[{formatTargetType(entry.targetType, t)}]</span>{' '}
                {entry.description}
              </p>
              <div className="timeline-time">{entry.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
