# Seed Data Standards

**Purpose:** Document seed data framework patterns, organization, and execution strategy

**Last Updated:** 2026-06-19

---

## Overview

Seed data provides realistic, consistent sample data for development and testing environments. All seed data follows standardized patterns for organization, execution, and relationship management.

## File Organization

### Structure: By Business Layer

Seed files are organized by business domain layers in `prisma/seed/`:

```
prisma/
├── seed/
│   ├── index.ts           # Orchestrator - sequential execution
│   ├── foundation.ts      # Users, Organizations, Workspaces
│   ├── operations.ts      # Requests, Audit events, Vault files, Messages
│   └── partners.ts        # Partners and partner-related data
├── seed.ts                # Entry point (calls seed/index.ts)
└── schema.prisma
```

### Layer Responsibilities

| Layer | Entities | Rationale |
|-------|----------|-----------|
| **foundation.ts** | Users, Orgs, Workspaces, Memberships | Base entities that other data depends on |
| **operations.ts** | Requests, Audit Events, Vault Files, Messages | Operational data flowing through the system |
| **partners.ts** | Partners, Engagements, Partner Members | External partner relationships |

### Why Business Layers?

- **Clear data flow:** Foundation → Operations → Partners mirrors real business dependencies
- **Easy to understand:** Developers can see which layer provides base data
- **Maintainable:** Related entities stay together

## Export Pattern

### Default Export

Each seed file exports a default async function:

```typescript
// prisma/seed/foundation.ts
import { prisma } from '../../src/lib/prisma';

export default async function seedFoundation() {
  console.log('🏗️  Seeding foundation data...');

  // Users
  const users = await seedUsers();

  // Organizations
  const orgs = await seedOrganizations();

  // Workspaces
  const workspaces = await seedWorkspaces(users, orgs);

  return { users, orgs, workspaces };
}
```

### Orchestrator Pattern

`index.ts` imports and executes in order:

```typescript
// prisma/seed/index.ts
import seedFoundation from './foundation';
import seedOperations from './operations';
import seedPartners from './partners';

export default async function seed() {
  // Wipe all data first
  await wipeAllTables();

  // Execute in business layer order
  const foundation = await seedFoundation();
  await seedOperations(foundation);
  await seedPartners(foundation);
}
```

## Execution Strategy

### Sequential with Transaction

Seed files execute sequentially within a single database transaction:

```typescript
// prisma/seed/index.ts
export default async function seed() {
  await prisma.$transaction(async (tx) => {
    // Wipe all tables (cascade delete handles dependencies)
    await wipeAllTables(tx);

    // Sequential execution by business layer
    const foundation = await seedFoundation(tx);
    await seedOperations(tx, foundation);
    await seedPartners(tx, foundation);
  });
}
```

### Wipe Strategy: All Tables

Before seeding, wipe ALL tables to ensure clean state:

```typescript
async function wipeAllTables(tx: PrismaTransactionClient) {
  // Order doesn't matter with cascade delete
  const tables = [
    'auditEvent', 'message', 'vaultFile', 'legalRequest',
    'workspaceMember', 'workspace', 'organization', 'user'
  ];

  for (const table of tables) {
    await tx[table].deleteMany({});
  }
}
```

### Error Handling: All-or-Nothing

If any seed fails, entire transaction rolls back:

```typescript
try {
  await seed();
  console.log('✅ Seed completed successfully');
} catch (error) {
  console.error('❌ Seed failed, rolling back:', error);
  // Transaction auto-rolls back on error
  process.exit(1);
}
```

## Relationship Management

### Foreign Key Strategy: Cascade Delete

All foreign keys use cascade delete to prevent orphaned records:

```prisma
// schema.prisma
model LegalRequest {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  // ...
}

model Workspace {
  id             String           @id @default(cuid())
  requests       LegalRequest[]   // Auto-deleted when workspace deleted
  // ...
}
```

### Topological Sort: Automatic Seeding Order

Entities with fewer dependencies seed first:

```typescript
// foundation.ts - seeds first (no dependencies)
const users = await seedUsers();           // No FK
const orgs = await seedOrganizations();    // No FK

// operations.ts - seeds second (depends on foundation)
const requests = await seedRequests(users, orgs);  // FK to users, orgs
const auditEvents = await seedAuditEvents(requests);  // FK to requests
```

### Data Volume Targets

| Entity | Count | Rationale |
|--------|-------|-----------|
| Users | 10 | Multiple roles (admin, specialist, customer) |
| Organizations | 3 | Different business types |
| Workspaces | 5 | Across orgs |
| Requests | 50 | Various statuses, types, priorities |
| Audit Events | 100 | Realistic history |
| Vault Files | 20 | With folders, tags |
| Messages | 30 | Across multiple threads |
| Partners | 5 | With engagements |

## Data Quality Standards

### Realistic Vietnamese Data

```typescript
const users = [
  { email: 'nguyen.van.a@example.com', name: 'Nguyễn Văn A' },
  { email: 'tran.thi.b@example.com', name: 'Trần Thị B' },
  // Realistic Vietnamese names, not "User 1", "User 2"
];

const requests = [
  {
    title: 'Tư vấn hợp đồng lao động',
    description: 'Cần tư vấn về điều khoản hợp đồng lao động cho nhân viên mới',
    priority: 'medium',
    // Realistic Vietnamese legal request descriptions
  },
];
```

### Relationship Preservation

All relationships must be valid and queryable:

```typescript
// Good: Valid foreign keys
const request = await tx.legalRequest.create({
  data: {
    workspaceId: workspace.id,  // Real workspace ID
    createdById: user.id,       // Real user ID
  }
});

// Bad: Hardcoded IDs that don't exist
const request = await tx.legalRequest.create({
  data: {
    workspaceId: 'fake-id-123',  // ❌ Doesn't exist
  }
});
```

## Running Seed Scripts

### Commands

```bash
# Standard seed (wipe + seed)
npm run seed

# Seed with verbose logging
SEED_VERBOSE=true npm run seed

# Check seed status
npx prisma db seed --dry-run
```

### Expected Output

```
🏗️  Seeding foundation data...
  ✅ Created 10 users
  ✅ Created 3 organizations
  ✅ Created 5 workspaces

⚙️  Seeding operations data...
  ✅ Created 50 requests
  ✅ Created 100 audit events
  ✅ Created 20 vault files
  ✅ Created 30 messages

🤝 Seeding partners data...
  ✅ Created 5 partners
  ✅ Created 8 engagements

✅ Seed completed successfully
```

## Testing Seed Data

### Validation Tests

```typescript
// prisma/seed/index.test.ts
import { prisma } from '../../src/lib/prisma';
import seed from './index';

describe('Seed Data', () => {
  beforeEach(async () => {
    await seed();
  });

  test('creates expected user count', async () => {
    const count = await prisma.user.count();
    expect(count).toBe(10);
  });

  test('preserves relationships', async () => {
    const request = await prisma.legalRequest.findFirst({
      include: { workspace: true, createdBy: true }
    });
    expect(request?.workspace).toBeDefined();
    expect(request?.createdBy).toBeDefined();
  });
});
```

## Migration Guidelines

### Adding New Entities

1. **Determine layer:** Foundation, Operations, or Partners?
2. **Add to appropriate file:** Add seed function to that file
3. **Respect dependencies:** Seed after entities it depends on
4. **Update volume targets:** Add to data volume table
5. **Add validation tests:** Ensure data created correctly

### Modifying Existing Entities

1. **Update seed function:** Modify data generation logic
2. **Maintain relationships:** Don't break foreign keys
3. **Test thoroughly:** Run seed and verify all data
4. **Update volume if needed:** Adjust counts as necessary

## Anti-Patterns

### ❌ Don't Use Upsert

```typescript
// BAD: Upsert keeps old data
await prisma.user.upsert({
  where: { email: 'test@example.com' },
  update: {},
  create: { ... }
});

// GOOD: Wipe + create ensures clean state
await prisma.user.create({ data: { ... } });
```

### ❌ Don't Skip Transaction

```typescript
// BAD: Partial seed on error
await seedFoundation();  // If fails, data is inconsistent

// GOOD: Wrap in transaction
await prisma.$transaction(async (tx) => {
  await seedFoundation(tx);
});
```

### ❌ Don't Hardcode IDs

```typescript
// BAD: Hardcoded IDs break on wipe
const request = await tx.legalRequest.create({
  data: { workspaceId: 'workspace-123' }  // ❌
});

// GOOD: Use returned IDs
const workspace = await tx.workspace.create({ ... });
const request = await tx.legalRequest.create({
  data: { workspaceId: workspace.id }  // ✅
});
```

---

*Document: SEED_DATA.md*
*Part of: Phase 73 - Shared Foundation*
