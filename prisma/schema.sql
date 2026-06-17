-- ============================================
-- Legal Service Platform - SQLite Schema
-- Generated from Prisma Schema
-- ============================================

-- Note: SQLite uses TEXT for all strings, Boolean as INTEGER (0/1)
-- DateTime stored as ISO8601 TEXT

PRAGMA foreign_keys = ON;

-- Table: User
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  locale TEXT DEFAULT 'vi',
  avatarUrl TEXT,
  accountType TEXT DEFAULT 'customer' NOT NULL,
  lastActiveAt TEXT,
  isActive INTEGER DEFAULT 1 NOT NULL,
  emailVerified INTEGER DEFAULT 0 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "User" (email);

-- Table: UserPreferences
CREATE TABLE IF NOT EXISTS "UserPreferences" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL UNIQUE,
  emailOnReply INTEGER DEFAULT 1 NOT NULL,
  slaReminder INTEGER DEFAULT 1 NOT NULL,
  weeklySummary INTEGER DEFAULT 0 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (userId) REFERENCES "User" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_userPreferences_userId ON "UserPreferences" (userId);

-- Table: Tenant
CREATE TABLE IF NOT EXISTS "Tenant" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'platform' NOT NULL,
  settings TEXT DEFAULT '{}' NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table: Organization
CREATE TABLE IF NOT EXISTS "Organization" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenantId TEXT NOT NULL,
  name TEXT NOT NULL,
  businessType TEXT,
  registrationNumber TEXT,
  address TEXT,
  contactEmail TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  isDefault INTEGER DEFAULT 0 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (tenantId) REFERENCES "Tenant" (id)
);

CREATE INDEX IF NOT EXISTS idx_organization_tenantId ON "Organization" (tenantId);
CREATE INDEX IF NOT EXISTS idx_organization_status ON "Organization" (status);

-- Table: Partner
CREATE TABLE IF NOT EXISTS "Partner" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'law_firm' NOT NULL,
  contactEmail TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table: PartnerMember
CREATE TABLE IF NOT EXISTS "PartnerMember" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  partnerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL,
  isActive INTEGER DEFAULT 1 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (partnerId) REFERENCES "Partner" (id),
  FOREIGN KEY (userId) REFERENCES "User" (id),
  UNIQUE (partnerId, userId)
);

CREATE INDEX IF NOT EXISTS idx_partnerMember_partnerId ON "PartnerMember" (partnerId);
CREATE INDEX IF NOT EXISTS idx_partnerMember_userId ON "PartnerMember" (userId);

-- Table: ServiceType
CREATE TABLE IF NOT EXISTS "ServiceType" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  isActive INTEGER DEFAULT 1 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table: Engagement
CREATE TABLE IF NOT EXISTS "Engagement" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  partnerId TEXT NOT NULL,
  organizationId TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  startDate TEXT,
  endDate TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (partnerId) REFERENCES "Partner" (id),
  FOREIGN KEY (organizationId) REFERENCES "Organization" (id),
  UNIQUE (partnerId, organizationId)
);

CREATE INDEX IF NOT EXISTS idx_engagement_partnerId ON "Engagement" (partnerId);
CREATE INDEX IF NOT EXISTS idx_engagement_organizationId ON "Engagement" (organizationId);

-- Table: EngagementServiceScope
CREATE TABLE IF NOT EXISTS "EngagementServiceScope" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  engagementId TEXT NOT NULL,
  serviceTypeId TEXT NOT NULL,
  permissionLevel TEXT DEFAULT 'case_assigned' NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (engagementId) REFERENCES "Engagement" (id),
  FOREIGN KEY (serviceTypeId) REFERENCES "ServiceType" (id),
  UNIQUE (engagementId, serviceTypeId)
);

CREATE INDEX IF NOT EXISTS idx_engagementServiceScope_engagementId ON "EngagementServiceScope" (engagementId);
CREATE INDEX IF NOT EXISTS idx_engagementServiceScope_serviceTypeId ON "EngagementServiceScope" (serviceTypeId);

-- Table: Workspace
CREATE TABLE IF NOT EXISTS "Workspace" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  isActive INTEGER DEFAULT 1 NOT NULL,
  organizationId TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (organizationId) REFERENCES "Organization" (id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_organizationId ON "Workspace" (organizationId);
CREATE INDEX IF NOT EXISTS idx_workspace_slug ON "Workspace" (slug);

-- Table: WorkspaceMembership
CREATE TABLE IF NOT EXISTS "WorkspaceMembership" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  role TEXT DEFAULT 'customer' NOT NULL,
  isActive INTEGER DEFAULT 1 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (userId) REFERENCES "User" (id),
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  UNIQUE (userId, workspaceId)
);

CREATE INDEX IF NOT EXISTS idx_workspaceMembership_userId ON "WorkspaceMembership" (userId);
CREATE INDEX IF NOT EXISTS idx_workspaceMembership_workspaceId ON "WorkspaceMembership" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_workspaceMembership_role ON "WorkspaceMembership" (role);
CREATE INDEX IF NOT EXISTS idx_workspaceMembership_workspaceId_role ON "WorkspaceMembership" (workspaceId, role);
CREATE INDEX IF NOT EXISTS idx_workspaceMembership_role_isActive ON "WorkspaceMembership" (role, isActive);

-- Table: LegalRequest
CREATE TABLE IF NOT EXISTS "LegalRequest" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  matterType TEXT,
  status TEXT DEFAULT 'draft_intake' NOT NULL,
  slaDeadline TEXT,
  createdById TEXT NOT NULL,
  assignedSpecialistId TEXT,
  assignedReviewerId TEXT,
  engagementId TEXT,
  assignedPartnerId TEXT,
  deletedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (createdById) REFERENCES "User" (id),
  FOREIGN KEY (assignedSpecialistId) REFERENCES "User" (id),
  FOREIGN KEY (assignedReviewerId) REFERENCES "User" (id),
  FOREIGN KEY (engagementId) REFERENCES "Engagement" (id),
  FOREIGN KEY (assignedPartnerId) REFERENCES "Partner" (id)
);

CREATE INDEX IF NOT EXISTS idx_legalRequest_workspaceId ON "LegalRequest" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_legalRequest_createdById ON "LegalRequest" (createdById);
CREATE INDEX IF NOT EXISTS idx_legalRequest_assignedSpecialistId ON "LegalRequest" (assignedSpecialistId);
CREATE INDEX IF NOT EXISTS idx_legalRequest_assignedReviewerId ON "LegalRequest" (assignedReviewerId);
CREATE INDEX IF NOT EXISTS idx_legalRequest_status ON "LegalRequest" (status);
CREATE INDEX IF NOT EXISTS idx_legalRequest_engagementId ON "LegalRequest" (engagementId);
CREATE INDEX IF NOT EXISTS idx_legalRequest_assignedPartnerId ON "LegalRequest" (assignedPartnerId);
CREATE INDEX IF NOT EXISTS idx_legalRequest_deletedAt ON "LegalRequest" (deletedAt);
CREATE INDEX IF NOT EXISTS idx_legalRequest_workspaceId_status ON "LegalRequest" (workspaceId, status);
CREATE INDEX IF NOT EXISTS idx_legalRequest_assignedSpecialistId_status ON "LegalRequest" (assignedSpecialistId, status);

-- Table: MatterType
CREATE TABLE IF NOT EXISTS "MatterType" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT,
  key TEXT NOT NULL,
  label_vi TEXT,
  label_en TEXT,
  label_zh TEXT,
  label_ja TEXT,
  description_vi TEXT,
  description_en TEXT,
  description_zh TEXT,
  description_ja TEXT,
  schemaVersion TEXT NOT NULL,
  questionSchema TEXT NOT NULL,
  isActive INTEGER DEFAULT 1 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  UNIQUE (workspaceId, key)
);

CREATE INDEX IF NOT EXISTS idx_matterType_workspaceId ON "MatterType" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_matterType_isActive ON "MatterType" (isActive);

-- Table: IntakeSubmission
CREATE TABLE IF NOT EXISTS "IntakeSubmission" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  requestId TEXT NOT NULL UNIQUE,
  workspaceId TEXT,
  matterTypeKey TEXT NOT NULL,
  schemaVersion TEXT NOT NULL,
  answers TEXT NOT NULL,
  answerLabels TEXT NOT NULL,
  submittedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id)
);

CREATE INDEX IF NOT EXISTS idx_intakeSubmission_workspaceId_matterTypeKey ON "IntakeSubmission" (workspaceId, matterTypeKey);
CREATE INDEX IF NOT EXISTS idx_intakeSubmission_submittedAt ON "IntakeSubmission" (submittedAt);

-- Table: RequestAssignment
CREATE TABLE IF NOT EXISTS "RequestAssignment" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  requestId TEXT NOT NULL,
  userId TEXT NOT NULL,
  kind TEXT DEFAULT 'specialist' NOT NULL,
  reason TEXT,
  partnerId TEXT,
  engagementId TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  createdById TEXT NOT NULL,
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id),
  FOREIGN KEY (userId) REFERENCES "User" (id),
  FOREIGN KEY (createdById) REFERENCES "User" (id),
  FOREIGN KEY (partnerId) REFERENCES "Partner" (id),
  FOREIGN KEY (engagementId) REFERENCES "Engagement" (id)
);

CREATE INDEX IF NOT EXISTS idx_requestAssignment_requestId ON "RequestAssignment" (requestId);
CREATE INDEX IF NOT EXISTS idx_requestAssignment_userId ON "RequestAssignment" (userId);
CREATE INDEX IF NOT EXISTS idx_requestAssignment_kind ON "RequestAssignment" (kind);
CREATE INDEX IF NOT EXISTS idx_requestAssignment_partnerId ON "RequestAssignment" (partnerId);
CREATE INDEX IF NOT EXISTS idx_requestAssignment_engagementId ON "RequestAssignment" (engagementId);
CREATE INDEX IF NOT EXISTS idx_requestAssignment_userId_kind ON "RequestAssignment" (userId, kind);
CREATE INDEX IF NOT EXISTS idx_requestAssignment_requestId_kind ON "RequestAssignment" (requestId, kind);

-- Table: RoutingCapability
CREATE TABLE IF NOT EXISTS "RoutingCapability" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  userId TEXT NOT NULL,
  matterTypeKey TEXT NOT NULL,
  kind TEXT DEFAULT 'specialist' NOT NULL,
  isActive INTEGER DEFAULT 1 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (userId) REFERENCES "User" (id),
  UNIQUE (workspaceId, userId, matterTypeKey, kind)
);

CREATE INDEX IF NOT EXISTS idx_routingCapability_workspaceId ON "RoutingCapability" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_routingCapability_userId ON "RoutingCapability" (userId);
CREATE INDEX IF NOT EXISTS idx_routingCapability_workspaceId_matterTypeKey_kind_isActive ON "RoutingCapability" (workspaceId, matterTypeKey, kind, isActive);

-- Table: Document
CREATE TABLE IF NOT EXISTS "Document" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  requestId TEXT NOT NULL,
  title TEXT NOT NULL,
  deletedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id)
);

CREATE INDEX IF NOT EXISTS idx_document_workspaceId ON "Document" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_document_requestId ON "Document" (requestId);
CREATE INDEX IF NOT EXISTS idx_document_deletedAt ON "Document" (deletedAt);

-- Table: DocumentVersion
CREATE TABLE IF NOT EXISTS "DocumentVersion" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  documentId TEXT NOT NULL,
  templateId TEXT NOT NULL,
  templateVersion INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  inputSnapshot TEXT NOT NULL,
  generatedContent TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (documentId) REFERENCES "Document" (id)
);

CREATE INDEX IF NOT EXISTS idx_documentVersion_documentId ON "DocumentVersion" (documentId);
CREATE INDEX IF NOT EXISTS idx_documentVersion_templateId ON "DocumentVersion" (templateId);
CREATE INDEX IF NOT EXISTS idx_documentVersion_status ON "DocumentVersion" (status);

-- Table: Review
CREATE TABLE IF NOT EXISTS "Review" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  requestId TEXT NOT NULL,
  documentId TEXT NOT NULL,
  reviewerId TEXT NOT NULL,
  documentVersionId TEXT,
  status TEXT DEFAULT 'in_progress' NOT NULL,
  decision TEXT,
  generalComment TEXT,
  completedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id),
  FOREIGN KEY (documentId) REFERENCES "Document" (id),
  FOREIGN KEY (reviewerId) REFERENCES "User" (id)
);

CREATE INDEX IF NOT EXISTS idx_review_workspaceId ON "Review" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_review_requestId ON "Review" (requestId);
CREATE INDEX IF NOT EXISTS idx_review_documentId ON "Review" (documentId);
CREATE INDEX IF NOT EXISTS idx_review_reviewerId ON "Review" (reviewerId);
CREATE INDEX IF NOT EXISTS idx_review_documentVersionId ON "Review" (documentVersionId);
CREATE INDEX IF NOT EXISTS idx_review_status ON "Review" (status);

-- Table: ReviewChecklistAnswer
CREATE TABLE IF NOT EXISTS "ReviewChecklistAnswer" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reviewId TEXT NOT NULL,
  checklistItemId TEXT NOT NULL,
  passed INTEGER DEFAULT 0 NOT NULL,
  comment TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (reviewId) REFERENCES "Review" (id) ON DELETE CASCADE,
  UNIQUE (reviewId, checklistItemId)
);

CREATE INDEX IF NOT EXISTS idx_reviewChecklistAnswer_reviewId ON "ReviewChecklistAnswer" (reviewId);

-- Table: DocumentTemplate
CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  matterTypeKey TEXT NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  label_vi TEXT,
  label_en TEXT,
  label_zh TEXT,
  label_ja TEXT,
  description_vi TEXT,
  description_en TEXT,
  description_zh TEXT,
  description_ja TEXT,
  variableSchema TEXT DEFAULT '[]' NOT NULL,
  content TEXT NOT NULL,
  previousVersionId TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (previousVersionId) REFERENCES "DocumentTemplate" (id),
  UNIQUE (workspaceId, matterTypeKey, version)
);

CREATE INDEX IF NOT EXISTS idx_documentTemplate_workspaceId_matterTypeKey ON "DocumentTemplate" (workspaceId, matterTypeKey);
CREATE INDEX IF NOT EXISTS idx_documentTemplate_workspaceId_status ON "DocumentTemplate" (workspaceId, status);

-- Table: VaultFile
CREATE TABLE IF NOT EXISTS "VaultFile" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  requestId TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  organizationId TEXT,
  actorId TEXT NOT NULL,
  filename TEXT,
  storageKey TEXT,
  fileKind TEXT,
  source TEXT,
  documentVersionId TEXT,
  fromStatus TEXT,
  toStatus TEXT,
  reason TEXT,
  size INTEGER,
  contentType TEXT,
  deletedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id),
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (actorId) REFERENCES "User" (id)
);

CREATE INDEX IF NOT EXISTS idx_vaultFile_requestId ON "VaultFile" (requestId);
CREATE INDEX IF NOT EXISTS idx_vaultFile_workspaceId ON "VaultFile" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_vaultFile_organizationId ON "VaultFile" (organizationId);
CREATE INDEX IF NOT EXISTS idx_vaultFile_actorId ON "VaultFile" (actorId);
CREATE INDEX IF NOT EXISTS idx_vaultFile_fileKind ON "VaultFile" (fileKind);
CREATE INDEX IF NOT EXISTS idx_vaultFile_documentVersionId ON "VaultFile" (documentVersionId);
CREATE INDEX IF NOT EXISTS idx_vaultFile_deletedAt ON "VaultFile" (deletedAt);

-- Table: Folder
CREATE TABLE IF NOT EXISTS "Folder" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  name_vi TEXT,
  name_en TEXT,
  name_zh TEXT,
  name_ja TEXT,
  parentId TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (parentId) REFERENCES "Folder" (id),
  UNIQUE (workspaceId, parentId, name_vi)
);

CREATE INDEX IF NOT EXISTS idx_folder_workspaceId ON "Folder" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_folder_parentId ON "Folder" (parentId);

-- Table: Tag
CREATE TABLE IF NOT EXISTS "Tag" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  key TEXT NOT NULL,
  label_vi TEXT,
  label_en TEXT,
  label_zh TEXT,
  label_ja TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  UNIQUE (workspaceId, key)
);

CREATE INDEX IF NOT EXISTS idx_tag_workspaceId ON "Tag" (workspaceId);

-- Table: VaultFileFolder (junction)
CREATE TABLE IF NOT EXISTS "VaultFileFolder" (
  vaultFileId TEXT NOT NULL,
  folderId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  PRIMARY KEY (vaultFileId, folderId),
  FOREIGN KEY (vaultFileId) REFERENCES "VaultFile" (id),
  FOREIGN KEY (folderId) REFERENCES "Folder" (id)
);

CREATE INDEX IF NOT EXISTS idx_vaultFileFolder_folderId ON "VaultFileFolder" (folderId);

-- Table: VaultFileTag (junction)
CREATE TABLE IF NOT EXISTS "VaultFileTag" (
  vaultFileId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  PRIMARY KEY (vaultFileId, tagId),
  FOREIGN KEY (vaultFileId) REFERENCES "VaultFile" (id),
  FOREIGN KEY (tagId) REFERENCES "Tag" (id)
);

CREATE INDEX IF NOT EXISTS idx_vaultFileTag_tagId ON "VaultFileTag" (tagId);

-- Table: WorkflowTransition
CREATE TABLE IF NOT EXISTS "WorkflowTransition" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  requestId TEXT NOT NULL,
  fromStatus TEXT NOT NULL,
  toStatus TEXT NOT NULL,
  actorId TEXT NOT NULL,
  reason TEXT,
  metadata TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id),
  FOREIGN KEY (actorId) REFERENCES "User" (id)
);

CREATE INDEX IF NOT EXISTS idx_workflowTransition_requestId ON "WorkflowTransition" (requestId);
CREATE INDEX IF NOT EXISTS idx_workflowTransition_actorId ON "WorkflowTransition" (actorId);
CREATE INDEX IF NOT EXISTS idx_workflowTransition_fromStatus_toStatus ON "WorkflowTransition" (fromStatus, toStatus);

-- Table: AuditEvent
CREATE TABLE IF NOT EXISTS "AuditEvent" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  actorId TEXT,
  workspaceId TEXT NOT NULL,
  organizationId TEXT,
  action TEXT NOT NULL,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  requestId TEXT,
  correlationId TEXT,
  metadataSummary TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (actorId) REFERENCES "User" (id),
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id)
);

CREATE INDEX IF NOT EXISTS idx_auditEvent_actorId ON "AuditEvent" (actorId);
CREATE INDEX IF NOT EXISTS idx_auditEvent_workspaceId ON "AuditEvent" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_auditEvent_organizationId ON "AuditEvent" (organizationId);
CREATE INDEX IF NOT EXISTS idx_auditEvent_requestId ON "AuditEvent" (requestId);
CREATE INDEX IF NOT EXISTS idx_auditEvent_targetType_targetId ON "AuditEvent" (targetType, targetId);
CREATE INDEX IF NOT EXISTS idx_auditEvent_correlationId ON "AuditEvent" (correlationId);
CREATE INDEX IF NOT EXISTS idx_auditEvent_organizationId_createdAt ON "AuditEvent" (organizationId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_auditEvent_actorId_createdAt ON "AuditEvent" (actorId, createdAt DESC);

-- Table: Account (better-auth)
CREATE TABLE IF NOT EXISTS "Account" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  idToken TEXT,
  password TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (userId) REFERENCES "User" (id) ON DELETE CASCADE,
  UNIQUE (providerId, accountId)
);

-- Table: Session (better-auth)
CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (userId) REFERENCES "User" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_token ON "Session" (token);
CREATE INDEX IF NOT EXISTS idx_session_userId ON "Session" (userId);

-- Table: Verification (better-auth)
CREATE TABLE IF NOT EXISTS "Verification" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table: File
CREATE TABLE IF NOT EXISTS "File" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  requestId TEXT,
  storageDriver TEXT DEFAULT 'local' NOT NULL,
  bucket TEXT,
  objectKey TEXT NOT NULL,
  originalName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  size INTEGER NOT NULL,
  checksum TEXT,
  category TEXT DEFAULT 'request_upload' NOT NULL,
  visibility TEXT DEFAULT 'private' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (requestId) REFERENCES "LegalRequest" (id),
  FOREIGN KEY (createdById) REFERENCES "User" (id)
);

CREATE INDEX IF NOT EXISTS idx_file_workspaceId ON "File" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_file_requestId ON "File" (requestId);
CREATE INDEX IF NOT EXISTS idx_file_category ON "File" (category);
CREATE INDEX IF NOT EXISTS idx_file_status ON "File" (status);
CREATE INDEX IF NOT EXISTS idx_file_createdById ON "File" (createdById);

-- Table: FileVersion
CREATE TABLE IF NOT EXISTS "FileVersion" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  fileId TEXT NOT NULL,
  versionNumber INTEGER NOT NULL,
  storageDriver TEXT DEFAULT 'local' NOT NULL,
  bucket TEXT,
  objectKey TEXT NOT NULL,
  size INTEGER NOT NULL,
  checksum TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (fileId) REFERENCES "File" (id) ON DELETE CASCADE,
  FOREIGN KEY (createdById) REFERENCES "User" (id)
);

CREATE INDEX IF NOT EXISTS idx_fileVersion_fileId ON "FileVersion" (fileId);
CREATE INDEX IF NOT EXISTS idx_fileVersion_createdById ON "FileVersion" (createdById);

-- Table: FileAccessLog
CREATE TABLE IF NOT EXISTS "FileAccessLog" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  fileId TEXT NOT NULL,
  userId TEXT,
  action TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (fileId) REFERENCES "File" (id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES "User" (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fileAccessLog_fileId ON "FileAccessLog" (fileId);
CREATE INDEX IF NOT EXISTS idx_fileAccessLog_userId ON "FileAccessLog" (userId);
CREATE INDEX IF NOT EXISTS idx_fileAccessLog_action ON "FileAccessLog" (action);
CREATE INDEX IF NOT EXISTS idx_fileAccessLog_createdAt ON "FileAccessLog" (createdAt);

-- Table: Message
CREATE TABLE IF NOT EXISTS "Message" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspaceId TEXT NOT NULL,
  organizationId TEXT,
  legalRequestId TEXT,
  senderId TEXT NOT NULL,
  recipientId TEXT NOT NULL,
  content TEXT NOT NULL,
  isRead INTEGER DEFAULT 0 NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (workspaceId) REFERENCES "Workspace" (id),
  FOREIGN KEY (legalRequestId) REFERENCES "LegalRequest" (id),
  FOREIGN KEY (senderId) REFERENCES "User" (id),
  FOREIGN KEY (recipientId) REFERENCES "User" (id)
);

CREATE INDEX IF NOT EXISTS idx_message_workspaceId ON "Message" (workspaceId);
CREATE INDEX IF NOT EXISTS idx_message_organizationId ON "Message" (organizationId);
CREATE INDEX IF NOT EXISTS idx_message_legalRequestId ON "Message" (legalRequestId);
CREATE INDEX IF NOT EXISTS idx_message_senderId ON "Message" (senderId);
CREATE INDEX IF NOT EXISTS idx_message_recipientId ON "Message" (recipientId);
CREATE INDEX IF NOT EXISTS idx_message_isRead ON "Message" (isRead);
