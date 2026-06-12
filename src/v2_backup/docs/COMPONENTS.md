# Component Patterns

## Overview

Components in v2 follow these patterns for consistency and reusability.

## Component Organization

```
src/v2/components/
├── ui/           # Re-exports from shared @/components/ui
├── dashboard/    # Dashboard-specific components
├── forms/        # Form components
└── admin/        # Admin portal components
```

## UI Components

Use shared components from `@/components/ui`:

```tsx
import { Button, Card, Input } from '@/components/ui'
```

## Component Conventions

### File Naming
- PascalCase for component files: `DashboardCard.tsx`
- camelCase for utility files: `formatDate.ts`

### Component Structure

```tsx
// 1. Imports
import { useState } from 'react'
import { Card } from '@/components/ui'

// 2. Props interface
interface Props {
  title: string
  value: number
}

// 3. Component function
export function StatCard({ title, value }: Props) {
  // 4. Hooks first
  const [hovered, setHovered] = useState(false)
  
  // 5. Handlers
  const handleClick = () => { ... }
  
  // 6. Render
  return (
    <Card onMouseEnter={() => setHovered(true)}>
      <h3>{title}</h3>
      <span>{value}</span>
    </Card>
  )
}

// 7. Named export
export { StatCard }
```

### Styling

- Use CSS modules for component-specific styles
- Use Tailwind for utility classes
- Avoid inline styles except for dynamic values

### Props

- Always define Props interface
- Use `?` for optional props
- Provide default values when sensible

## Best Practices

1. **Single responsibility**: One component, one purpose
2. **Composition**: Build complex UIs from simple components
3. **Reusability**: Extract shared logic to hooks or utils
4. **Type safety**: No `as any` casts
