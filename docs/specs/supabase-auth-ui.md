# SPECIFICATION: Supabase Auth UI Integration

## 1. Context & Objective
We want to provide sign-in and password recovery using the pre-built components from Supabase Auth UI. Authentication uses the user's email address and password. Account creation, passwordless sign-in, and third-party providers are not offered in the app.
- **Out of Scope**: Custom HTML form inputs, multi-factor authentication (MFA), or custom CSS overrides outside of the theme tokens.
- **Success Criteria**: A functional, stylized authentication form visible on `/login` that correctly authenticates users and redirects them to `/dashboard`.

## 2. Technical Stack Context
*   **Framework**: Next.js 15 (App Router)
*   **Auth Provider**: Supabase Browser & SSR Client
*   **UI Components**: `@supabase/auth-ui-react` and `@supabase/auth-ui-shared`
*   **UI & Styling**: shadcn/ui and Tailwind CSS (integrated via the Auth UI theme object)

## 3. Data Model & Architecture

### Environment Variables
The agent must verify these variables exist in `.env.local` before building:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### File Architecture Boundaries
The agent is **only** permitted to create or modify files within these paths:
- `src/app/login/page.tsx` (Login page layout)
- `src/components/auth/AuthForm.tsx` (Isolated Supabase Auth UI wrapper component)
- `src/middleware.ts` (Global route protection checking session status)
*Do not alter any global state management hooks or global theme wrappers.*

## 4. Implementation Tasks (Step-by-Step Checklist)
*Execute these tasks sequentially. Run tests or build checks after completing each item.*

- [ ] **Task 1: Install Required Packages**
  - Run the terminal command to install dependencies: `npm install @supabase/auth-ui-react @supabase/auth-ui-shared`
  - Ensure the packages are appended correctly to `package.json` without updating other dependencies.

- [ ] **Task 2: Build the Auth Wrapper Component (`src/components/auth/AuthForm.tsx`)**
  - Create a Client Component (`"use client"`).
  - Import `Auth` from `@supabase/auth-ui-react` and `ThemeSupa` from `@supabase/auth-ui-shared`.
  - Pass the active browser supabase client created via `@supabase/ssr`.
  - Configure the `appearance` object to match the application's visual tokens using `ThemeSupa`.
  - Do not enable magic-link or third-party social providers.
  - Do not expose account creation; retain a separate password-recovery action.
  - Set the `view` property to default to `"sign_in"`.
  - Set `redirectTo` to point dynamically to `${window.location.origin}/auth/callback`.

- [ ] **Task 3: Implement the Login Page (`src/app/login/page.tsx`)**
  - Create a clean page layout that centers the `AuthForm` component in a card container.
  - Wrap the container in a standard flexbox or grid to center it vertically and horizontally on the viewport.
  - Implement a check: if the user already has an active session, instantly redirect them to `/dashboard` using Next.js `redirect`.

- [ ] **Task 4: Next.js Middleware Session Refresh (`src/middleware.ts`)**
  - Ensure the middleware intercepts traffic to `/dashboard/:path*`.
  - Use the `@supabase/ssr` middleware pattern to refresh the user's session token on the fly.
  - If no session exists or the token is expired, redirect the user strictly to `/login`.

## 5. Reference Code Quality Blueprint
The agent must follow this structural configuration for the Supabase Auth UI initialization:

```typescript
"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Adjust based on your exact supabase client util

export default function AuthForm() {
  const supabase = createClientComponentClient();

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-zinc-900">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3b82f6', // Tailwind blue-500
                brandAccent: '#2563eb', // Tailwind blue-600
              },
            },
          },
        }}
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
        onlyThirdPartyProviders={false}
      />
    </div>
  );
}
```

## 6. Execution Commands & Definition of Done
Before completing the feature branch, the AI Agent must execute and pass the following checklist:

1. **Lint & Typecheck**: Run `npm run lint` and `npx tsc --noEmit`. Must compile with zero typescript validation warnings.
2. **Build Success**: Run `npm run build` locally to verify that static site optimization and Server Component rendering pass cleanly.
3. **Cleanup**: Strip away any arbitrary testing markup, unneeded logs, or debugging placeholders inside the `src/app/login/page.tsx` directory.
