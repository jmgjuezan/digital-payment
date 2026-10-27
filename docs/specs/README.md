# Business Logic Specifications

This folder contains the application's feature and business-rule specifications. The detailed specification is the source of truth; this page is an overview.

## Supabase Authentication

See [supabase-auth-ui.md](supabase-auth-ui.md) for the full authentication specification.

### Sign-in rules

- Users authenticate with an email address and password.
- Passwordless sign-in, including magic links, is disabled.
- Third-party social providers are disabled.
- The login interface includes sign-up and password-recovery links.
- After successful sign-in, users are sent to `/dashboard`.
- A user who already has a valid session and opens `/login` is redirected to `/dashboard`.

### Protected access

- `/dashboard` and `/transactions/new` require an authenticated Supabase session.
- Requests without a valid session are redirected to `/login`.
- Supabase SSR session handling refreshes session cookies where needed.
- Server routes and actions verify the user session before reading or writing protected data.

### Supabase configuration and data access

- Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the deployment or local environment.
- The publishable key is public client configuration, not a secret. Never expose a Supabase `service_role` key in client code or a `NEXT_PUBLIC_` variable.
- Database access must be protected by Supabase Row Level Security policies. Client-provided values are untrusted and must be validated on the server.

### Scope

- Use Supabase Auth UI for the authentication form and its theme configuration.
- Do not replace the authentication UI with custom form inputs or add MFA unless the specification changes.
- Keep auth UI and route-protection changes within the file boundaries described in [supabase-auth-ui.md](supabase-auth-ui.md).

## Adding Specifications

Add a detailed Markdown specification for each new feature under `docs/specs/`, then update this overview with its business rules and a relative link. Keep this index concise and avoid duplicating detailed implementation instructions.
