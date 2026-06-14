# Code Standards

**Purpose:** Document naming conventions and coding patterns

**Last Updated:** 2026-06-14

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.tsx | `StatCard.tsx` |
| React Hooks | camelCase | `useAuth` |
| Functions | camelCase | `getUserById` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `UserProfile` |
| Enums | PascalCase | `RequestStatus` |
| Enum Values | UPPER_SNAKE_CASE | `DRAFT_INTAKE` |
| Files (non-component) | kebab-case.ts | `user-service.ts` |
| Directories | kebab-case | `user-management` |
| Database Tables | snake_case | `legal_requests` |
| CSS Classes | kebab-case | `.stat-card` |
| Environment Variables | UPPER_SNAKE_CASE | `NEXT_PUBLIC_APP_URL` |

## File Naming

### Components

```bash
# Components: PascalCase.tsx
src/components/
├── shared/
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── StatCard.tsx
├── requests/
│   ├── RequestList.tsx
│   └── RequestDetail.tsx
└── admin/
    └── UserTable.tsx
```

### Non-Component Files

```bash
# Services, utils, types: kebab-case.ts
src/lib/
├── requests/
│   ├── services/
│   │   ├── create-request.ts
│   │   └── update-request.ts
│   └── validators/
│       └── request-validator.ts
└── types/
    └── index.ts
```

## TypeScript Conventions

### Interfaces vs Types

```typescript
// Use interface for object shapes (extensible)
interface User {
  id: string;
  email: string;
  name: string;
}

// Use type for unions, intersections, aliases
type Status = 'active' | 'inactive' | 'pending';
type UserId = string;
```

### Export Patterns

```typescript
// Named exports (preferred for utilities)
export function formatDate(date: Date): string { ... }

// Default exports (for components)
export default function StatCard() { ... }

// Re-exports from index
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

### Null Handling

```typescript
// Prefer optional chaining and nullish coalescing
const name = user?.profile?.name ?? 'Anonymous';

// Avoid non-null assertion unless absolutely certain
const id = user!.id; // Only when you know user exists
```

## React Conventions

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/Button';
import type { UserCardProps } from './types';

// 2. Type definitions
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

// 3. Component
export function UserCard({ user, onEdit }: UserCardProps) {
  // 4. Hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // 5. Effects
  useEffect(() => {
    // effect logic
  }, []);

  // 6. Handlers
  const handleClick = () => {
    onEdit(user.id);
  };

  // 7. Render
  return (
    <Card onClick={handleClick}>
      <Avatar src={user.avatar} />
      <span>{user.name}</span>
    </Card>
  );
}

// 8. Default export
export default UserCard;
```

### Hooks

```typescript
// Custom hooks: use{Verb}{Noun} or use{Noun}
function useUserById(id: string) { ... }
function useFetchRequests(filters: Filters) { ... }

// Built-in hooks order
1. useState
2. useReducer
3. useEffect
4. useMemo
5. useCallback
6. useRef
```

## Import Order

```typescript
// 1. React / Next.js
import { useState } from 'react';
import { useRouter } from 'next/router';

// 2. External libraries
import { z } from 'zod';
import { format } from 'date-fns';
import { Button, Card } from 'antd';

// 3. Internal absolute imports
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/shared/ui/StatCard';
import { REQUEST_STATUS } from '@/lib/types';

// 4. Relative imports
import { UserAvatar } from './UserAvatar';
import './styles.css';
```

## Error Handling

```typescript
// Custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Try-catch with typed errors
try {
  await createRequest(data);
} catch (error) {
  if (error instanceof ValidationError) {
    return { error: error.code, field: error.field };
  }
  throw error;
}
```

## Comments

```typescript
// Single line: // Comment
// Explains WHY, not WHAT

// JSDoc for functions
/**
 * Creates a new request for the given user.
 * 
 * @param input - Validated request input
 * @param userId - ID of the requesting user
 * @returns Created request object
 * @throws {ValidationError} If input is invalid
 */

// TODO comments with tracking
// TODO: (USER-123) Add support for bulk operations
```

## Code Formatting

- Use Prettier for formatting
- Use ESLint for linting
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in multiline

---

*Document: CODE_STANDARDS.md*
*Part of: Phase 55 - Architecture Standards*
