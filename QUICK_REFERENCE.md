# Quick Reference Guide - AMELIA-Mini

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Live App** | https://amelia-mini.vercel.app | Production site |
| **GitHub** | https://github.com/RegulusRizal/AMELIA-Mini | Source code |
| **Vercel Dashboard** | https://vercel.com/roy-yabuts-projects/amelia-mini | Deployment management |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/aigrahysczmodaqpbbqp | Database & Auth |

## 🔑 Environment Variables

```bash
# In .env.local (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://aigrahysczmodaqpbbqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...Y22UQfhVc7SzojOu1lY0ER3KdFpRQj7CecQnc_mIfBc
SUPABASE_SERVICE_ROLE_KEY=eyJ...tHT8eYV1ilAHPy6vySpdG-PORiITDEYynMQs9XXQuN8
```

## 📁 Project Structure
```
app/
├── auth/
│   ├── login/         # Sign in/up page
│   ├── callback/      # Email confirmation
│   └── logout/        # Sign out handler
├── dashboard/         # Protected user area
├── api/
│   ├── test/         # Test Supabase connection
│   └── debug/        # Debug authentication
└── page.tsx          # Home page

lib/supabase/
├── auth.ts           # Auth helper functions
├── client.ts         # Client-side Supabase
└── server.ts         # Server-side Supabase

middleware.ts         # Route protection
```

## 🚀 Common Commands

### Development
```bash
npm run dev           # Start local server (http://localhost:3000)
npm run build         # Build for production
npm run lint          # Check code quality
```

### Deployment
```bash
git push origin master    # Auto-deploys to Vercel
vercel                    # Manual preview deploy
vercel --prod            # Manual production deploy
vercel env pull          # Get environment variables
```

### Git
```bash
git add -A               # Stage all changes
git commit -m "message"  # Commit changes
git push origin master   # Push to GitHub (triggers deploy)
git status              # Check current status
```

## 🧪 API Endpoints

### Test Connection
```bash
# Check if Supabase is connected
curl https://amelia-mini.vercel.app/api/test | json_pp
```

### Debug Authentication
```bash
# Get detailed auth status
curl https://amelia-mini.vercel.app/api/debug | json_pp
```

### Local Testing
```bash
# Same endpoints work locally
curl http://localhost:3000/api/test
curl http://localhost:3000/api/debug
```

## 🔐 Authentication Flow

### Sign Up
1. Go to `/auth/login`
2. Click "Don't have an account? Sign Up"
3. Enter email and password (min 6 characters)
4. Check email for confirmation link
5. Click link to confirm account
6. Automatically redirected to dashboard

### Sign In
1. Go to `/auth/login`
2. Enter email and password
3. Click "Sign In"
4. Redirected to dashboard

### Sign Out
1. From dashboard or home page
2. Click "Sign Out" button
3. Session cleared and redirected to login

## 📊 Route Protection

| Route | Protection | Redirect |
|-------|------------|----------|
| `/` | Public | None |
| `/auth/login` | Public (redirects if logged in) | → `/dashboard` |
| `/dashboard` | Protected | → `/auth/login` |
| `/api/*` | Public | None |

## 🐛 Troubleshooting

### Can't Access Dashboard
- Check authentication: https://amelia-mini.vercel.app/api/debug
- Ensure email is confirmed
- Try signing out and back in

### Build Errors
```bash
npm run build        # Test locally first
npm run dev         # Check for runtime errors
```

### Environment Variables Not Working
```bash
# Verify .env.local exists
cat .env.local

# For Vercel, check dashboard:
vercel env ls
```

### Database Connection Issues
- Check Supabase project status
- Verify API keys are correct
- Test with `/api/test` endpoint

## 📝 File Templates

### Create New API Route
```typescript
// app/api/[name]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  // Your logic here
  return NextResponse.json({ data: 'response' })
}
```

### Create Protected Page
```typescript
// app/[page]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return <div>Protected content</div>
}
```

## 🎯 Current Features

✅ **Working**
- User registration
- Email confirmation
- Login/logout
- Protected dashboard
- Session persistence
- API endpoints

⏳ **Not Implemented Yet**
- Password reset
- Social auth (Google, GitHub)
- User profiles
- Database tables
- Email templates

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

*Last Updated: September 4, 2025*
*Quick access to all project resources and commands*