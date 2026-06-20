-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "domainId" TEXT,
    "serviceType" TEXT,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "files" TEXT NOT NULL DEFAULT '[]',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "contactInfo" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Draft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Draft_userId_status_idx" ON "drafts"("userId", "status");

-- CreateIndex
CREATE INDEX "Draft_updatedAt_idx" ON "drafts"("updatedAt");

-- AlterTable
ALTER TABLE "LegalRequest" ADD COLUMN "contactInfo" TEXT;

-- AlterTable
ALTER TABLE "LegalRequest" ADD COLUMN "submittedAt" DATETIME;

-- RedefineTables for priority default
CREATE TABLE "new_LegalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "matterType" TEXT,
    "matterTypeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft_intake',
    "slaDeadline" DATETIME,
    "contactInfo" TEXT,
    "submittedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "assignedSpecialistId" TEXT,
    "assignedReviewerId" TEXT,
    "engagementId" TEXT,
    "assignedPartnerId" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LegalRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LegalRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LegalRequest_assignedSpecialistId_fkey" FOREIGN KEY ("assignedSpecialistId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LegalRequest_assignedReviewerId_fkey" FOREIGN KEY ("assignedReviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LegalRequest_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagements" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LegalRequest_assignedPartnerId_fkey" FOREIGN KEY ("assignedPartnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LegalRequest_matterTypeId_fkey" FOREIGN KEY ("matterTypeId") REFERENCES "MatterType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LegalRequest" SELECT * FROM "LegalRequest";
DROP TABLE "LegalRequest";
ALTER TABLE "new_LegalRequest" RENAME TO "LegalRequest";

-- Recreate indexes
CREATE INDEX "LegalRequest_workspaceId_idx" ON "LegalRequest"("workspaceId");
CREATE INDEX "LegalRequest_createdById_idx" ON "LegalRequest"("createdById");
CREATE INDEX "LegalRequest_assignedSpecialistId_idx" ON "LegalRequest"("assignedSpecialistId");
CREATE INDEX "LegalRequest_assignedReviewerId_idx" ON "LegalRequest"("assignedReviewerId");
CREATE INDEX "LegalRequest_status_idx" ON "LegalRequest"("status");
CREATE INDEX "LegalRequest_engagementId_idx" ON "LegalRequest"("engagementId");
CREATE INDEX "LegalRequest_assignedPartnerId_idx" ON "LegalRequest"("assignedPartnerId");
CREATE INDEX "LegalRequest_deletedAt_idx" ON "LegalRequest"("deletedAt");
CREATE INDEX "LegalRequest_workspaceId_status_idx" ON "LegalRequest"("workspaceId", "status");
CREATE INDEX "LegalRequest_assignedSpecialistId_status_idx" ON "LegalRequest"("assignedSpecialistId", "status");
