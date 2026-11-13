# Security Standards

This document outlines the security standards and practices for the Digital Payment application.

## Authentication & Authorization

### User Authentication
- All server actions must verify the user is authenticated before processing any request
- Use Supabase Auth (`supabase.auth.getUser()`) to validate user sessions
- Redirect unauthenticated users to `/login` immediately

### Role-Based Access Control (RBAC)
The application uses three user roles:
- **admin**: Full access to all features including editing any transaction
- **moderator**: Can manage balances and view transactions, but can only edit their own transactions
- **user**: Can create transactions and view data, but cannot manage balances

**Implementation Rules:**
1. Check user role before allowing any privileged operation
2. Use `getUserRole()` or `getUserRoleDetails()` from `@/lib/balance-access.ts`
3. Implement resource-level authorization for write operations

### Resource-Level Authorization
For operations that modify specific resources (e.g., editing a payment):
1. Fetch the resource first to verify it exists
2. Check if the user created the resource (for non-admin roles)
3. Allow admins to modify any resource
4. Allow moderators and users to only modify their own resources

**Example:**
```typescript
const role = await getUserRole(supabase, user.id)
const { data: payment } = await supabase
  .from('payments')
  .select('created_by')
  .eq('id', paymentId)
  .single()

if (!payment) return { error: 'Transaction not found.' }
if (role !== 'admin' && payment.created_by !== user.id) {
  return { error: 'You can only edit your own transactions.' }
}
```

## Input Validation

### Server-Side Validation
All user input must be validated on the server side, regardless of client-side validation:

1. **Type Validation**: Ensure input matches expected types (string, number, etc.)
2. **Format Validation**: Use regex for format validation (dates, times, IDs)
3. **Range Validation**: Check numeric values are within acceptable ranges
4. **Allowlist Validation**: Use allowlists for known valid values (payment types, devices)

**Examples:**
```typescript
// Date format validation
const validPaymentDate = /^\d{4}-\d{2}-\d{2}$/.test(paymentDate)
  && !Number.isNaN(parsedPaymentDate.getTime())
  && parsedPaymentDate.toISOString().slice(0, 10) === paymentDate

// Allowlist validation
if (!paymentTypeOptions.includes(type as (typeof paymentTypeOptions)[number])) {
  return { error: 'Invalid payment type.' }
}

// Range validation
if (!Number.isFinite(amount) || amount <= 0) {
  return { error: 'Amount must be greater than zero.' }
}
```

### Date & Time Validation
- Validate dates are not in the future (except where business logic permits)
- Use server time from `getServerTime()` to prevent client-side time manipulation
- Ensure times are valid for the selected date

## Data Access

### Row-Level Security (RLS)
Supabase Row-Level Security policies must be configured on all tables:
- `payments`: Users can only see transactions based on their role
- `balances`: Only admins and moderators can access balance data
- `user_roles`: Restrict access to role assignments

**Critical:** Never rely solely on application-level authorization. RLS provides a security boundary at the database level.

### Query Restrictions
- Always select only the fields needed for the operation
- Use `.eq()` with user ID or role-based filters
- Avoid `SELECT *` in production code

## Error Handling

### User-Facing Errors
- Use generic error messages for users to avoid information disclosure
- Don't expose database error codes or internal state to users
- Log detailed errors server-side for debugging

**Example:**
```typescript
// Bad - exposes database error
if (error) return { error: error.message }

// Good - generic message
if (error) return { error: 'Could not save the transaction. Check your access and try again.' }
```

### Server-Side Logging
- Log errors with minimal information needed for debugging
- Sanitize logs to avoid logging sensitive data
- Don't log credentials, secrets, or PII

## Secrets Management

### Environment Variables
- Never commit `.env.local` or any files containing real credentials
- Use `.env.example` as a template for required environment variables
- Document required environment variables in project README

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/public key

### Supabase Configuration
- Never commit `supabase/.temp/` or `supabase/.branches/` directories
- Commit only intentional Supabase configuration, migrations, and seed files
- Do not paste credential values into commit messages or issue reports

## Cross-Site Scripting (XSS) Prevention

### React Best Practices
- Never use `dangerouslySetInnerHTML` unless absolutely necessary
- Never use direct `innerHTML` manipulation
- Always use React's JSX for rendering user content
- Use `textContent` instead of `innerHTML` when displaying text

### Input Sanitization
- Trim whitespace from user input before processing
- Validate input format before storing in database
- Escape data when rendering in contexts where React doesn't auto-escape

## Cross-Site Request Forgery (CSRF) Prevention

### Server Actions
- Next.js server actions automatically include CSRF protection
- All form submissions should use server actions, not direct API calls
- Verify the form originates from your application

## Security Checklist

Before committing code changes, verify:

- [ ] All server actions check for authenticated user
- [ ] User role is verified before privileged operations
- [ ] Resource-level authorization is implemented for write operations
- [ ] Input validation is comprehensive and server-side
- [ ] Dates and times are validated against server time
- [ ] Error messages are generic and don't expose internals
- [ ] No sensitive data is logged or exposed
- [ ] No `dangerouslySetInnerHTML` or `innerHTML` usage
- [ ] Environment variables are documented in `.env.example`
- [ ] `.env.local` is not committed
- [ ] Supabase RLS policies are configured for all tables

## Security Audits

Conduct security reviews:
- Before major releases
- After adding new authentication/authorization features
- When integrating third-party services
- Annually or after security updates to dependencies

## Reporting Security Issues

If you discover a security vulnerability:
1. Do not create a public issue
2. Report it to the project maintainers privately
3. Include steps to reproduce the vulnerability
4. Wait for confirmation before disclosing publicly

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
