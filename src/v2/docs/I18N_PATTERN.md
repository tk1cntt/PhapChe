# i18n Implementation Pattern

## Overview

v2 uses `next-intl` for internationalization with native Next.js App Router support.

## Configuration

### middleware.ts

```typescript
import createMiddleware from 'next-intl/middleware'
 
export default createMiddleware({
  locales: ['vi', 'en', 'zh', 'ja'],
  defaultLocale: 'vi'
})
```

### i18n/request.ts

```typescript
import {getRequestConfig} from 'next-intl/server'
 
export default getRequestConfig(async ({locale}) => ({
  messages: (await import(`../messages/${locale}.json`)).default
}))
```

## Usage in Components

### Server Components

```tsx
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('Dashboard')
  
  return (
    <h1>{t('title')}</h1>
    <p>{t('welcome', { name: user.name })}</p>
  )
}
```

### Client Components

```tsx
'use client'

import { useTranslations } from 'next-intl'

export function DashboardClient() {
  const t = useTranslations('Dashboard')
  
  return (
    <h1>{t('title')}</h1>
  )
}
```

## Message Structure

```json
{
  "Dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {name}",
    "stats": {
      "total": "Total Requests",
      "processing": "Processing"
    }
  }
}
```

## Locale Switching

Use the `LocaleSwitcher` component or navigate with locale:

```tsx
import { useRouter, usePathname } from 'next/navigation'

function LocaleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  
  const switchLocale = (locale: string) => {
    router.push(pathname.replace(/^\/[^\/]+/, `/${locale}`))
  }
  
  // ...
}
```

## Best Practices

1. **Always use keys**: Never hardcode text
2. **Use namespaces**: Separate concerns (Dashboard, Common, etc.)
3. **Plural support**: Use ICU message format for plurals
4. **Fallback**: Provide fallback messages in default locale
