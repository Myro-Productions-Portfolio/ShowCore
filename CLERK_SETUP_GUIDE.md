# Clerk Authentication Setup Guide

## Dependencies Installed

Backend:
- @clerk/clerk-sdk-node ✅

Frontend:
- @clerk/clerk-react ✅

## Step 1: Get Your Clerk API Keys

From your Clerk Dashboard (https://dashboard.clerk.com):

1. Select your application (or create a new one)
2. Go to "API Keys" in the left sidebar
3. Copy these keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Add Environment Variables

### Backend (.env)

Add to `backend/.env`:

```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

### Frontend (.env)

Create `apps/web/.env`:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**Note:** Frontend uses `VITE_` prefix for environment variables.

## Step 3: Configure Clerk Application Settings

In Clerk Dashboard:

1. **Application Name:** ShowCore
2. **Application URL:** http://localhost:5173 (for development)
3. **Sign-in/Sign-up:**
   - Enable Email/Password
   - Enable Google (optional)
   - Enable GitHub (optional)
4. **Session Settings:**
   - Session lifetime: 7 days (default)
   - Multi-session: Disabled (default)

## Step 4: Implementation Files

I'll create these files for you:

### Backend Files
- `backend/src/lib/clerk.ts` - Clerk client initialization
- `backend/src/middleware/clerk-auth.ts` - Clerk authentication middleware
- `backend/src/trpc/context.ts` - Updated context with Clerk user

### Frontend Files
- `apps/web/src/lib/clerk.tsx` - Clerk provider setup
- `apps/web/src/components/auth/SignIn.tsx` - Sign in component
- `apps/web/src/components/auth/SignUp.tsx` - Sign up component
- `apps/web/src/components/auth/UserButton.tsx` - User menu component

## Step 5: Test Users

Once Clerk is set up, you can create test accounts:

### Option 1: Sign Up via UI
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Create accounts for yourself, Ross, and JJ

### Option 2: Create via Clerk Dashboard
1. Go to Clerk Dashboard → Users
2. Click "Create User"
3. Add email and password
4. User will receive verification email (or skip verification in test mode)

## Step 6: Sync Clerk Users to Database

When a user signs in with Clerk, we need to create/update their record in our database:

```typescript
// This will be in the auth middleware
const clerkUser = await clerkClient.users.getUser(auth.userId)

// Find or create user in our database
let user = await prisma.user.findUnique({
  where: { email: clerkUser.emailAddresses[0].emailAddress }
})

if (!user) {
  user = await prisma.user.create({
    data: {
      email: clerkUser.emailAddresses[0].emailAddress,
      emailVerified: true,
      role: 'USER',
    }
  })
}
```

## Step 7: Testing

### Test Authentication Flow
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd apps/web && npm run dev`
3. Go to http://localhost:5173
4. Click "Sign Up" and create an account
5. Verify you can sign in/out
6. Check that user appears in database

### Test Protected Routes
1. Try accessing protected API endpoints without auth (should fail)
2. Sign in and try again (should succeed)
3. Test admin-only endpoints (should fail for non-admin users)

## Step 8: Create Admin User

To make yourself an admin:

```sql
-- Connect to database
psql -h localhost -p 5432 -U postgres -d showcore

-- Update your user to admin
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

Or via Prisma Studio:
```bash
cd backend
npx prisma studio
# Navigate to User table
# Find your user
# Change role to ADMIN
```

## Quick Reference

### Clerk Dashboard URLs
- Dashboard: https://dashboard.clerk.com
- API Keys: https://dashboard.clerk.com/last-active?path=api-keys
- Users: https://dashboard.clerk.com/last-active?path=users
- Settings: https://dashboard.clerk.com/last-active?path=settings

### Environment Variables Needed
Backend:
- CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

Frontend:
- VITE_CLERK_PUBLISHABLE_KEY

### Test Accounts to Create
1. Your admin account (your email)
2. Ross's account (ross@example.com or his real email)
3. JJ's account (jj@example.com or his real email)

## Next Steps

Once you have your API keys:
1. Add them to .env files (backend and frontend)
2. I'll implement the Clerk integration
3. Restart backend and frontend servers
4. Test sign up/sign in
5. Create test accounts for Ross and JJ

---

**Ready for your API keys!** Let me know when you have them and I'll implement the integration.
