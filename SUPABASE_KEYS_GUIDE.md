# How to Get Your Supabase Keys

## Step 1: API Settings Page (Now Open in Browser)
I've opened the Supabase API settings page. You should see:

### 1. Project URL
- Already added: `https://aigrahysczmodaqpbbqp.supabase.co`

### 2. anon (public) Key
- Look for: **`anon` `public`** section
- This is a LONG string starting with `eyJ...`
- Click the **Copy** button next to it
- This key is safe for client-side code

### 3. service_role (secret) Key  
- Look for: **`service_role` `secret`** section
- This is also a LONG string starting with `eyJ...`
- Click the **Copy** button next to it
- ⚠️ NEVER expose this key in client-side code!

## Step 2: Update Your .env.local

Once you have both keys, tell me and I'll update the .env.local file for you.

Or manually update `/Users/royshemuelyabut/AMELIA-Mini/.env.local`:

```bash
# Supabase Configuration
# Project: AMELIA-Mini (aigrahysczmodaqpbbqp)
NEXT_PUBLIC_SUPABASE_URL=https://aigrahysczmodaqpbbqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
```

## What Each Key Does

- **anon key**: Public key for client-side operations (authentication, basic queries)
- **service_role key**: Admin key for server-side operations (bypasses Row Level Security)

## Security Notes
✅ `NEXT_PUBLIC_*` variables are exposed to the browser (okay for anon key)
❌ Never prefix service_role key with `NEXT_PUBLIC_`
✅ The anon key is designed to be public
⚠️ The service_role key must stay secret