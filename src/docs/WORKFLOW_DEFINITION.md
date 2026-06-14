# Workflow Definition Pattern

**Purpose:** Document workflow state machine pattern with database storage

**Last Updated:** 2026-06-14

---

## Overview

Workflows are defined as state machines in the database, allowing administrators to:
- Configure workflow states without code changes
- Define role-based transition permissions
- Track workflow history per request

## Schema

### WorkflowDefinition

```typescript
interface WorkflowDefinition {
  id: string;
  code: string;           // "legal_request", "review_process"
  name: string;            // "Yêu cầu pháp lý"
  nameKey?: string;        // i18n key
  description?: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  initialState: string;    // Code of initial state
  version: number;
  status: 'draft' | 'published' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}
```

### WorkflowState

```typescript
interface WorkflowState {
  code: string;          // "draft_intake", "assigned"
  name: string;           // "Bản nháp"
  nameKey?: string;       // i18n key
  description?: string;
  order: number;          // Display order
  color?: string;         // UI color (hex)
  icon?: string;          // UI icon identifier
  requiresAssignment: boolean;
  canEdit: boolean;        // Can request be edited in this state
  isTerminal: boolean;     // Final state (closed, cancelled)
}
```

### WorkflowTransition

```typescript
interface WorkflowTransition {
  id: string;
  from: string;           // Source state code
  to: string;             // Target state code
  allowedRoles: Role[];    // Who can trigger this transition
  actionLabel?: string;   // "Giao việc", "Phê duyệt"
  actionLabelKey?: string;
  confirmRequired: boolean;
  confirmMessage?: string;
  confirmMessageKey?: string;
  requiresNote: boolean;   // Note/memo required
  notificationTemplate?: string;
}
```

## Example: Legal Request Workflow

```typescript
const legalRequestWorkflow: WorkflowDefinition = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  code: 'legal_request',
  name: 'Quy trình xử lý yêu cầu pháp lý',
  states: [
    {
      code: 'draft_intake',
      name: 'Bản nháp',
      order: 1,
      color: '#8c8c8c',
      icon: 'edit',
      requiresAssignment: false,
      canEdit: true,
      isTerminal: false
    },
    {
      code: 'intake_submitted',
      name: 'Đã gửi',
      order: 2,
      color: '#1677ff',
      icon: 'send',
      requiresAssignment: false,
      canEdit: false,
      isTerminal: false
    },
    {
      code: 'triage',
      name: 'Phân loại',
      order: 3,
      color: '#fa8c16',
      icon: 'folder',
      requiresAssignment: false,
      canEdit: true,
      isTerminal: false
    },
    {
      code: 'assigned',
      name: 'Đã giao',
      order: 4,
      color: '#722ed1',
      icon: 'user-add',
      requiresAssignment: true,
      canEdit: true,
      isTerminal: false
    },
    {
      code: 'in_progress',
      name: 'Đang xử lý',
      order: 5,
      color: '#13c2c2',
      icon: 'loading',
      requiresAssignment: true,
      canEdit: true,
      isTerminal: false
    },
    {
      code: 'pending_review',
      name: 'Chờ phê duyệt',
      order: 6,
      color: '#eb2f96',
      icon: 'audit',
      requiresAssignment: true,
      canEdit: false,
      isTerminal: false
    },
    {
      code: 'revision_required',
      name: 'Yêu cầu sửa đổi',
      order: 7,
      color: '#faad14',
      icon: 'edit',
      requiresAssignment: true,
      canEdit: true,
      isTerminal: false
    },
    {
      code: 'approved',
      name: 'Đã phê duyệt',
      order: 8,
      color: '#52c41a',
      icon: 'check-circle',
      requiresAssignment: true,
      canEdit: false,
      isTerminal: false
    },
    {
      code: 'delivered',
      name: 'Đã bàn giao',
      order: 9,
      color: '#1890ff',
      icon: 'delivery',
      requiresAssignment: false,
      canEdit: false,
      isTerminal: false
    },
    {
      code: 'closed',
      name: 'Đã đóng',
      order: 10,
      color: '#d9d9d9',
      icon: 'lock',
      requiresAssignment: false,
      canEdit: false,
      isTerminal: true
    },
    {
      code: 'cancelled',
      name: 'Đã hủy',
      order: 11,
      color: '#ff4d4f',
      icon: 'close-circle',
      requiresAssignment: false,
      canEdit: false,
      isTerminal: true
    }
  ],
  transitions: [
    // Customer actions
    {
      from: 'draft_intake',
      to: 'intake_submitted',
      allowedRoles: ['customer'],
      actionLabel: 'Gửi yêu cầu',
      confirmRequired: true,
      confirmMessage: 'Bạn có chắc muốn gửi yêu cầu này?'
    },
    // Coordinator actions
    {
      from: 'intake_submitted',
      to: 'triage',
      allowedRoles: ['coordinator_admin'],
      actionLabel: 'Tiếp nhận'
    },
    {
      from: 'triage',
      to: 'assigned',
      allowedRoles: ['coordinator_admin'],
      actionLabel: 'Giao việc',
      requiresAssignment: true,
      requiresNote: true
    },
    // Specialist actions
    {
      from: 'assigned',
      to: 'in_progress',
      allowedRoles: ['specialist'],
      actionLabel: 'Bắt đầu xử lý'
    },
    {
      from: 'in_progress',
      to: 'pending_review',
      allowedRoles: ['specialist'],
      actionLabel: 'Gửi phê duyệt'
    },
    // Reviewer actions
    {
      from: 'pending_review',
      to: 'approved',
      allowedRoles: ['reviewer'],
      actionLabel: 'Phê duyệt'
    },
    {
      from: 'pending_review',
      to: 'revision_required',
      allowedRoles: ['reviewer'],
      actionLabel: 'Yêu cầu sửa đổi',
      requiresNote: true
    },
    // Revision loop
    {
      from: 'revision_required',
      to: 'in_progress',
      allowedRoles: ['specialist'],
      actionLabel: 'Sửa đổi và gửi lại'
    },
    // Delivery
    {
      from: 'approved',
      to: 'delivered',
      allowedRoles: ['coordinator_admin', 'specialist'],
      actionLabel: 'Bàn giao',
      confirmRequired: true
    },
    // Closure
    {
      from: 'delivered',
      to: 'closed',
      allowedRoles: ['customer', 'coordinator_admin'],
      actionLabel: 'Đóng yêu cầu'
    },
    // Cancellation
    {
      from: 'draft_intake',
      to: 'cancelled',
      allowedRoles: ['customer'],
      actionLabel: 'Hủy yêu cầu',
      requiresNote: true
    }
  ],
  initialState: 'draft_intake',
  version: 1,
  status: 'published'
};
```

## Transition Log

Every state change is logged:

```typescript
interface WorkflowTransitionLog {
  id: string;
  requestId: string;
  fromState: string;
  toState: string;
  triggeredBy: string;          // User ID
  triggeredAt: Date;
  note?: string;
  metadata?: Record<string, unknown>;
}
```

## Workflow Engine

```typescript
interface WorkflowEngine {
  // Get available transitions for current state
  getAvailableTransitions(
    requestId: string,
    userId: string,
    userRole: Role
  ): WorkflowTransition[];

  // Execute a transition
  executeTransition(
    requestId: string,
    transition: WorkflowTransition,
    triggeredBy: string,
    note?: string
  ): Promise<WorkflowTransitionLog>;

  // Check if transition is allowed
  canTransition(
    requestId: string,
    toState: string,
    userRole: Role
  ): boolean;

  // Get workflow status
  getWorkflowStatus(requestId: string): WorkflowDefinition;
}
```

## State Color Palette

| State | Color | Usage |
|-------|-------|-------|
| draft_intake | #8c8c8c | Gray - Draft |
| intake_submitted | #1677ff | Blue - Submitted |
| triage | #fa8c16 | Orange - In Review |
| assigned | #722ed1 | Purple - Assigned |
| in_progress | #13c2c2 | Cyan - Active |
| pending_review | #eb2f96 | Magenta - Awaiting |
| revision_required | #faad14 | Yellow - Needs Work |
| approved | #52c41a | Green - Complete |
| delivered | #1890ff | Light Blue - Delivered |
| closed | #d9d9d9 | Light Gray - Closed |
| cancelled | #ff4d4f | Red - Cancelled |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workflows | List all workflow definitions |
| GET | /api/workflows/:code | Get workflow by code |
| POST | /api/workflows | Create workflow definition |
| PUT | /api/workflows/:id | Update workflow definition |
| GET | /api/requests/:id/workflow | Get workflow status for request |
| POST | /api/requests/:id/workflow/transition | Execute state transition |

---

*Document: WORKFLOW_DEFINITION.md*
*Part of: Phase 55 - Architecture Standards*
