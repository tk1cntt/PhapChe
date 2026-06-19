# Shared Components Standards

**Purpose:** Document reusable UI component patterns, styling conventions, and usage guidelines

**Last Updated:** 2026-06-19

---

## Overview

Shared UI components provide consistent, reusable building blocks across all screens. All shared components follow standardized patterns for styling, props, and internationalization.

## Component Inventory

### Core Shared Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **StatCard** | Display metrics with icon and color variants | `src/components/shared/ui/StatCard.tsx` |
| **ErrorBoundary** | Catch React render errors with fallback UI | `src/components/shared/ui/ErrorBoundary.tsx` |
| **LoadingSkeleton** | Show loading states with variants | `src/components/shared/ui/LoadingSkeleton.tsx` |
| **EmptyState** | Display empty data states | `src/components/shared/ui/EmptyState.tsx` |

### Directory Structure

```
src/components/
├── shared/
│   └── ui/
│       ├── StatCard.tsx          # Metrics display
│       ├── ErrorBoundary.tsx     # Error catching
│       ├── LoadingSkeleton.tsx   # Loading states
│       ├── EmptyState.tsx        # Empty states
│       └── index.ts              # Barrel export
├── requests/                     # Request-specific components
├── admin/                        # Admin-specific components
└── ...
```

## Styling Standards

### Pure Tailwind CSS

All shared components use **only Tailwind CSS** — no Ant Design or other UI frameworks:

```typescript
// ✅ GOOD: Pure Tailwind
export function LoadingSkeleton({ variant = 'card' }: LoadingSkeletonProps) {
  return (
    <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full">
      {/* Tailwind classes only */}
    </div>
  );
}

// ❌ BAD: Using Ant Design
import { Skeleton } from 'antd';  // ❌ No Ant Design in shared components

export function LoadingSkeleton() {
  return <Skeleton active />;
}
```

### Rationale

- **Consistency:** Aligns with project decision to remove Ant Design
- **Lightweight:** No heavy UI framework dependencies
- **Customizable:** Full control over styling and behavior
- **Performance:** Smaller bundle size

### Tailwind Patterns

#### Shimmer Animation

```typescript
// Loading skeleton with shimmer effect
<div className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
```

#### Color Variants

```typescript
// StatCard color variants
const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};
```

## Component Specifications

### ErrorBoundary

**Purpose:** Catch React render errors and display fallback UI

```typescript
// src/components/shared/ui/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/shared/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**

```typescript
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<div>Custom error UI</div>}>
  <ComplexComponent />
</ErrorBoundary>
```

### LoadingSkeleton

**Purpose:** Show loading states with different variants

```typescript
// src/components/shared/ui/LoadingSkeleton.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const skeletonVariants = cva('animate-pulse bg-gray-200 rounded', {
  variants: {
    variant: {
      card: 'h-32 w-full',
      'table-row': 'h-12 w-full',
      'list-item': 'h-16 w-full',
      'text-line': 'h-4 w-3/4',
    },
  },
  defaultVariants: {
    variant: 'card',
  },
});

interface LoadingSkeletonProps extends VariantProps<typeof skeletonVariants> {
  count?: number;
}

export function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={skeletonVariants({ variant })}
          aria-label="Loading..."
        />
      ))}
    </>
  );
}
```

**Usage:**

```typescript
// Single card skeleton
<LoadingSkeleton variant="card" />

// Multiple table rows
<LoadingSkeleton variant="table-row" count={5} />

// Text lines
<LoadingSkeleton variant="text-line" count={3} />
```

### EmptyState

**Purpose:** Display empty data states with optional action

```typescript
// src/components/shared/ui/EmptyState.tsx
import { ReactNode } from 'react';
import { Button } from '@/components/shared/ui/Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**Usage:**

```typescript
// Simple empty state
<EmptyState
  title="No requests found"
  description="Try adjusting your filters"
/>

// With icon and action
<EmptyState
  icon={<InboxIcon className="w-16 h-16" />}
  title="No messages yet"
  description="Start a conversation by sending a message"
  action={{
    label: 'New Message',
    onClick: () => router.push('/messages/new')
  }}
/>
```

## Internationalization

### Per-Component Namespace

Each component has its own i18n namespace:

```json
// messages/vi.json
{
  "ErrorBoundary": {
    "title": "Đã xảy ra lỗi",
    "message": "Một lỗi không mong muốn đã xảy ra",
    "retry": "Thử lại"
  },
  "LoadingSkeleton": {
    "text": "Đang tải..."
  },
  "EmptyState": {
    "title": "Không có dữ liệu",
    "description": "Chưa có nội dung nào để hiển thị",
    "action": "Tạo mới"
  }
}
```

### Usage in Components

```typescript
import { useTranslations } from 'next-intl';

export function ErrorBoundary() {
  const t = useTranslations('ErrorBoundary');

  return (
    <div>
      <h2>{t('title')}</h2>
      <p>{t('message')}</p>
      <Button>{t('retry')}</Button>
    </div>
  );
}
```

### Key Naming Convention

```
{ComponentName}.{element}

Examples:
- ErrorBoundary.title
- ErrorBoundary.message
- ErrorBoundary.retry
- LoadingSkeleton.text
- EmptyState.title
- EmptyState.description
- EmptyState.action
```

## Toast Notifications

### react-hot-toast

Use `react-hot-toast` for toast notifications (lightweight, Tailwind-stylable):

```typescript
import toast from 'react-hot-toast';

// Success toast
toast.success('Request created successfully');

// Error toast
toast.error('Failed to load requests');

// Info toast
toast('Processing your request...');

// Custom styled toast
toast.success('Saved!', {
  style: {
    background: '#10b981',
    color: '#ffffff',
  },
});
```

### Toast Positioning

Configure global toast position:

```typescript
// src/app/layout.tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
```

### Toast with Errors

```typescript
function CreateRequestForm() {
  const createRequest = useCreateRequest();

  const handleSubmit = async (data: CreateRequestInput) => {
    try {
      await createRequest.mutateAsync(data);
      toast.success('Request created');
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  return <Form onSubmit={handleSubmit} />;
}
```

## Component Props Standards

### Required Props

All required props must be explicitly typed:

```typescript
interface EmptyStateProps {
  title: string;        // Required
  description?: string; // Optional
}
```

### Optional Props

Use TypeScript optional properties:

```typescript
interface LoadingSkeletonProps {
  variant?: 'card' | 'table-row' | 'list-item';
  count?: number;
}
```

### Event Handlers

Use `on` prefix for event handlers:

```typescript
interface EmptyStateProps {
  action?: {
    label: string;
    onClick: () => void;  // ✅ on prefix
  };
}

interface ButtonProps {
  onClick?: () => void;    // ✅ on prefix
  onFocus?: () => void;    // ✅ on prefix
}
```

### Children Pattern

Use `children` for content:

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;  // ✅ Standard children pattern
}
```

## Testing Standards

### Unit Tests

Co-locate tests with components:

```typescript
// src/components/shared/ui/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders fallback UI on error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

### Accessibility Tests

```typescript
it('has proper aria labels', () => {
  render(<LoadingSkeleton />);
  expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
});
```

## Best Practices

### ✅ Do: Use Variants for Styling Differences

```typescript
// GOOD: Variants for different styles
const skeletonVariants = cva('animate-pulse', {
  variants: {
    variant: {
      card: 'h-32',
      'table-row': 'h-12',
    },
  },
});

// BAD: Conditional className strings
const className = variant === 'card' ? 'h-32' : 'h-12';
```

### ✅ Do: Provide Sensible Defaults

```typescript
// GOOD: Default values
export function LoadingSkeleton({ variant = 'card', count = 1 }: Props) {
  // ...
}

// BAD: Required props for common cases
export function LoadingSkeleton({ variant, count }: Props) {
  // Must always pass variant and count
}
```

### ✅ Do: Use Semantic HTML

```typescript
// GOOD: Semantic elements
export function EmptyState({ title }: Props) {
  return (
    <div role="status">
      <h3>{title}</h3>
    </div>
  );
}

// BAD: Non-semantic divs
export function EmptyState({ title }: Props) {
  return (
    <div>
      <div className="text-lg font-bold">{title}</div>
    </div>
  );
}
```

### ❌ Don't: Add Business Logic

```typescript
// BAD: Business logic in shared component
export function EmptyState() {
  const router = useRouter();
  const { user } = useAuth();

  // ❌ Component-specific logic
  if (user.role === 'admin') {
    return <AdminEmptyState />;
  }

  return <div>No data</div>;
}

// GOOD: Pass behavior via props
export function EmptyState({ action }: Props) {
  return (
    <div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
```

### ❌ Don't: Use Inline Styles

```typescript
// BAD: Inline styles
<div style={{ padding: '16px', backgroundColor: '#f3f4f6' }}>

// GOOD: Tailwind classes
<div className="p-4 bg-gray-100">
```

## Migration from Ant Design

### Replacement Guide

| Ant Design Component | Shared Component | Notes |
|---------------------|------------------|-------|
| `<Skeleton />` | `<LoadingSkeleton />` | Use variants |
| `<Empty />` | `<EmptyState />` | Pass icon, title, action |
| `<Result status="error" />` | `<ErrorBoundary />` | Wrap error-prone components |
| `<Alert />` | Toast via `react-hot-toast` | For notifications |

### Migration Steps

1. **Identify usage:** Find Ant Design component imports
2. **Replace with shared component:** Import from `@/components/shared/ui`
3. **Update props:** Map Ant Design props to shared component props
4. **Test thoroughly:** Verify visual and functional equivalence
5. **Remove Ant Design import:** Clean up unused imports

---

*Document: SHARED_COMPONENTS.md*
*Part of: Phase 73 - Shared Foundation*
