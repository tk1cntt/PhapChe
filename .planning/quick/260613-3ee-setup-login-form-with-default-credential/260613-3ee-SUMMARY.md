---
quick_id: 260613-3ee
description: Setup login form with default credentials and auth redirect
status: completed
date: 2026-06-12
---

# Summary: Login Form Default Credentials + Auth Redirect

## Changes Made

### 1. Updated Middleware (`src/middleware.ts`)

- Now passes `returnUrl` query parameter when redirecting unauthenticated users
- Uses `encodeURIComponent` for safe URL encoding
- Example: `/vi/sign-in?returnUrl=%2Fvi%2Fdashboard`

### 2. Updated SignInForm (`src/components/auth/SignInForm.tsx`)

- Reads `returnUrl` from query params using `useSearchParams`
- After successful login, redirects to `returnUrl` if present, else `/vi/dashboard`
- Pre-fills default credentials: `customer.demo@example.test` / `Demo@123456`
- Uses `form.setFieldsValue` and `initialValues` for default values

## Files Changed

1. `src/middleware.ts` - Pass returnUrl in redirect
2. `src/components/auth/SignInForm.tsx` - Handle returnUrl + default credentials

## Usage

1. User visits `/vi/create` without auth
2. Middleware redirects to `/vi/sign-in?returnUrl=%2Fvi%2Fcreate`
3. Login page pre-filled with demo credentials
4. User clicks login
5. Redirects to `/vi/create` after successful login
