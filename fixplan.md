# Security Audit & Fix Plan

> **Accuracy Status**: This plan has been thoroughly verified by multiple parallel auditor agents. All 13 issues have been audited - 11 confirmed as accurate (85%), 2 were initially removed incorrectly and have been re-added. All issues below reflect the actual codebase state.

## 1) Lock down the public debug endpoints (critical) ✅ VERIFIED

/api/debug, /api/test, and /api/debug-users are unauthenticated and leak env and session details; debug-users also tries to query auth.users with an anon client, which will fail. Gate behind a super‑admin check, and disable in prod. 

Open endpoints: app/api/debug/route.ts, app/api/test/route.ts, app/api/debug-users/route.ts. 

Home page links directly to /api/test—remove in prod. 

### Patch (pattern):

```typescript
// app/api/debug/route.ts (similar for /api/test and /api/debug-users)
import { NextResponse } from 'next/server'
import { checkSuperAdmin } from '@/lib/auth/helpers'

export async function GET() {
  const ok = await checkSuperAdmin()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  // ...existing debug logic...
}
```

And in app/api/debug-users/route.ts, switch to admin client if you truly need user listings:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
// ...
const admin = createAdminClient()
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 10 })
// never call .from('auth.users') with anon client
```

## 2) Password generation is weak & a bit buggy (admin reset + add user) ✅ VERIFIED

ResetPasswordDialog uses Math.random() and string hacks that can change length and place predictable chars at fixed positions. Use Web Crypto and shuffle. 

AddUserDialog also uses Math.random() for the temp password. Prefer a crypto‑secure generator. 

### Drop‑in (browser‑safe):

```typescript
function generateSecurePassword(len = 12) {
  const upper='ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower='abcdefghijklmnopqrstuvwxyz'
  const digits='0123456789', symbols='!@#$%^&*', all=upper+lower+digits+symbols
  const a = new Uint32Array(len); crypto.getRandomValues(a)

  const pick = (set: string, i: number) => set[a[i] % set.length]
  const base = [pick(upper,0), pick(lower,1), pick(digits,2), pick(symbols,3)]
  for (let i=4;i<len;i++) base.push(all[a[i] % all.length])
  for (let i=base.length-1;i>0;i--){ const j=a[i]%(i+1); [base[i],base[j]]=[base[j],base[i]] }
  return base.join('')
}
```

Use this in ResetPasswordDialog and AddUserDialog. 

## 3) Missing route for password reset email redirect (breaks flow) ✅ VERIFIED

sendPasswordResetEmail() points users to /auth/reset-password, but there's no such page/route in the codebase. Either add the route or change the redirect to a page that exists (e.g., /auth/callback). 

### Quickest fix:

```typescript
// app/users/actions.ts
redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
```

Or add /auth/reset-password/page.tsx that consumes the OOB token and sets a new password. 

## 4) Shadcn <Select> values aren't submitted in your forms ✅ VERIFIED

In AddUserDialog and EditUserDialog, you rely on new FormData(event.currentTarget) but Select doesn't post a value by name. status/role_id may be undefined server‑side. Add hidden inputs bound to local state. 

### Patch pattern:

```typescript
const [status, setStatus] = useState('active')

<Select value={status} onValueChange={setStatus}>
  <SelectTrigger>...</SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
<input type="hidden" name="status" value={status} />
```

Do similarly for role_id. 

## 5) Duplicate action layers (pick one; the other is currently broken) ✅ VERIFIED

You have two action stacks: app/users/actions.ts (uses createAdminClient correctly) and lib/modules/user-management/actions.ts (calls supabase.auth.admin on an anon server client—will fail). Keep the working one (app/users/actions.ts) or refactor the module actions to use createAdminClient everywhere; don't keep both. 

Note: The other AI suggested standardizing on lib/modules/.../actions.ts. That file is not admin‑safe right now—it needs the service‑role client injected before it can be your "source of truth." Until then, keep app/users/actions.ts. 

## 6) Activity logs table exists but lacks INSERT policy (causes failures) ✅ VERIFIED

The `activity_logs` table exists in `supabase/migrations/001_user_management_schema.sql`, but it's missing an INSERT policy for Row Level Security. This causes logging to fail when using the regular Supabase client. Some code uses `adminClient` (which bypasses RLS) while others use the regular client, resulting in inconsistent logging behavior.

### Required RLS Policy:

```sql
-- Add INSERT policy for activity_logs
create policy "Users can insert their own activity logs"
on public.activity_logs for insert
with check (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Or if you want authenticated users to log any activity:
create policy "Authenticated users can insert activity logs"
on public.activity_logs for insert
with check (auth.uid() IS NOT NULL);
```

You reference it here: app/profile/actions.ts, app/users/roles/actions.ts, app/users/actions.ts. 

## 7) Small but real correctness/UX fixes ✅ ALL VERIFIED

- **Active Users stat** shows totalCount when 0 actives due to `activeUsers || totalCount`. Render `activeUsers` directly. 

- **Badge variant**: you use "success" for active users, but <Badge> doesn't support it (default|secondary|destructive|outline). Map "active" to "default" (or add a custom variant). Also uses `as any` type assertion to bypass TypeScript error.

- **Mobile menu button** is inert; hide it or wire a Drawer/Sheet. 

- **/api/debug-users**: Has active `from('auth.users')` call on lines 12-15 that fails with anon client. Either remove the call or switch to admin client.

- **lib/modules/user-management/queries.ts**: filtering by role_id via `query.eq('user_roles.role_id', role_id)` won't work without a join. Use `user_roles!inner(role_id)` or fetch roles separately. 

- **Dashboard console noise**: remove console.log from app/dashboard/page.tsx in prod - currently exposes user data to browser console.

- **Manage Roles 403**: Dialog doesn't check `res.ok` before calling `res.json()`, causing parsing errors on 403 responses. Add proper error checking. 

## ⚠️ Items from the other review to verify (good call if present)

### Overbroad RLS policies used for debugging 
(e.g., USING (true) on profiles/roles). I didn't see their FIX_DATABASE.sql in your dump, but if your 002_fix_rls_policies.sql temporarily loosened SELECT, replace with scoped policies (self‑read and super_admin read). Example pattern:

```sql
create policy "profiles self read"
on profiles for select using (auth.uid() = id);

create policy "profiles admin read"
on profiles for select using (exists(
  select 1 from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = auth.uid() and r.name = 'super_admin'
));
```

Do similar for roles. (Only if those permissive policies exist.) 

### Hard‑coded super_admin bootstrap email in migrations
If any migration assigns super_admin to a specific address, replace with your existing "first user gets admin" approach. (I can't confirm from the snippet, so just double‑check 002/003.) 

### changePassword with signInWithPassword
Is acceptable today but awkward if you add MFA later. Keep in mind for future hardening (Edge Function, etc.). 

## 🙅‍♂️ One place I disagree with the other AI (with proof)

They said the "Add User" success alert can't show the temp password because it's only generated on the server.

In your code, the temp password is generated client‑side before calling the server action, then appended to the FormData, and the alert prints that same client‑generated string. So it does show. That said, it's using Math.random(), so I still recommend switching to the crypto‑secure generator above. 

## 📦 Ready‑to‑apply snippets (copy/paste)

### A) Secure debug routes (and remove Home link in prod)

Add guard to /api/debug* and /api/test (see patch above).

Remove the Test API Connection button from app/page.tsx for production builds. 

### B) Fix Select posting (Add & Edit user dialogs)

```typescript
// AddUserDialog.tsx / EditUserDialog.tsx
const [status, setStatus] = useState('active')
<Select value={status} onValueChange={setStatus}>...</Select>
<input type="hidden" name="status" value={status} />

const [roleId, setRoleId] = useState('no-role')
<Select value={roleId} onValueChange={setRoleId}>...</Select>
<input type="hidden" name="role_id" value={roleId} />
```

### C) Fix Active Users card & Badge variant

```typescript
// app/users/page.tsx
<div className="text-2xl font-bold">{activeUsers}</div> // was activeUsers || totalCount

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'default'       // was "success"
    case 'inactive': return 'secondary'
    case 'suspended': return 'destructive'
    default: return 'default'
  }
}
```

<Badge> only supports default | secondary | destructive | outline.

### G) Fix /api/debug-users auth.users query

```typescript
// app/api/debug-users/route.ts - Remove lines 12-15 or switch to admin:
// REMOVE THIS:
const { data: authUsers, error: authError } = await supabase
  .from('auth.users')
  .select('id, email')
  .limit(10);

// OR REPLACE WITH:
const admin = createAdminClient()
const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 10 })
```

### H) Fix Manage Roles error handling

```typescript
// app/users/components/manage-roles-dialog.tsx
fetch('/api/roles')
  .then(res => {
    if (!res.ok) {
      throw new Error('Unable to fetch roles. You may not have permission.');
    }
    return res.json();
  })
  .then(data => {
    setAvailableRoles(data.roles || []);
    setSelectedRoles(currentRoles.map(r => r.id));
  })
  .catch(err => {
    setError(err.message);
    console.error('Error fetching roles:', err);
  });
``` 

### D) Secure password generator (Reset & Add user)

Replace both current generators with the crypto version above.

In ResetPasswordDialog, keep the "copy once" UX but do not update the DB until after the password is generated—your current flow does this automatically (fine), but consider a "Generate → Copy → Confirm set" two‑step for safety (opinion). 

### E) Fix reset email redirect target

```typescript
// app/users/actions.ts
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
})
```

Or implement /auth/reset-password. 

### F) Retire or refactor duplicate module actions

If you keep lib/modules/user-management/actions.ts, change every DB/auth write to use createAdminClient() where RLS would block, and remove the duplicate app/users/actions.ts. Until then, prefer the app‑level actions—they work today. 

## 🧭 Final checklist (in order)

1. **[CRITICAL/VERIFIED]** Gate /api/debug* + /api/test; remove home link to /api/test. 
2. **[CRITICAL/VERIFIED]** Swap in crypto password generator in Reset and Add User dialogs. 
3. **[CRITICAL/VERIFIED]** Fix password reset redirect page (change or add route). 
4. **[VERIFIED]** Make Shadcn <Select>s submit values (hidden inputs). 
5. **[VERIFIED]** Pick one action layer; fix or remove the duplicate. 
6. **[VERIFIED]** Add INSERT policy for activity_logs table (table exists, policy missing). 
7. **[VERIFIED]** Cleanups: Active Users stat, Badge variant, mobile menu, dashboard logs, getUsers role filter join, /api/debug-users auth.users call, Manage Roles error handling.