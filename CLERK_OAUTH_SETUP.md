# Clerk OAuth Setup Guide

## Current Status

Your authentication buttons are now properly connected to Clerk! Here's what's working:

✅ **Email/Password Login** - Fully functional
✅ **Email/Password Registration** - Fully functional  
✅ **OAuth Buttons** - Now connected to Clerk (but need provider configuration)
⚠️ **Magic Link** - Shows "coming soon" message (can be enabled in Clerk)

## Why OAuth Buttons Weren't Working

The OAuth buttons (Google, Apple, Microsoft) were just logging to console with `TODO` comments. I've now implemented the actual Clerk OAuth flow, but you need to **enable these providers in your Clerk dashboard**.

## How to Enable OAuth Providers

### Step 1: Access Your Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Sign in to your account
3. Select your application: **square-antelope-19** (based on your publishable key)

### Step 2: Enable OAuth Providers

1. In the left sidebar, click **"User & Authentication"**
2. Click **"Social Connections"** (or "SSO Connections")
3. You'll see a list of available providers:
   - Google
   - Apple
   - Microsoft
   - GitHub
   - Facebook
   - Twitter/X
   - LinkedIn
   - And many more...

### Step 3: Configure Each Provider

#### For Google OAuth:

1. Click **"Google"** in the provider list
2. Toggle **"Enable"** to ON
3. You have two options:
   - **Use Clerk's development keys** (easiest for testing)
   - **Use your own OAuth credentials** (for production)

**For Development/Testing:**
- Just toggle "Enable" and Clerk will use their development keys
- This works immediately for testing

**For Production:**
- You'll need to create a Google Cloud project
- Enable Google+ API
- Create OAuth 2.0 credentials
- Add authorized redirect URIs:
  - `https://square-antelope-19.clerk.accounts.dev/v1/oauth_callback`
  - `http://localhost:5173/sso-callback` (for local development)

#### For Apple OAuth:

1. Click **"Apple"** in the provider list
2. Toggle **"Enable"** to ON
3. For development, use Clerk's keys
4. For production, you'll need:
   - Apple Developer account
   - Services ID
   - Key ID and Team ID
   - Private key file

#### For Microsoft OAuth:

1. Click **"Microsoft"** in the provider list
2. Toggle **"Enable"** to ON
3. For development, use Clerk's keys
4. For production, you'll need:
   - Azure AD application
   - Client ID and Client Secret
   - Redirect URI configured

### Step 4: Test OAuth Flow

1. Save your changes in Clerk dashboard
2. Go to your local app: http://localhost:5173/login
3. Click any OAuth button (Google, Apple, Microsoft)
4. You should be redirected to the provider's login page
5. After successful login, you'll be redirected back to your app

## How OAuth Flow Works

```
User clicks "Google" button
    ↓
App calls Clerk's authenticateWithRedirect()
    ↓
User redirected to Google login
    ↓
User authenticates with Google
    ↓
Google redirects to Clerk callback URL
    ↓
Clerk processes authentication
    ↓
Clerk redirects to /sso-callback in your app
    ↓
App completes authentication
    ↓
User redirected to dashboard (or profile completion if new user)
```

## Testing Without CloudFlare Tunnel

**You do NOT need CloudFlare tunnel or a hosted website to test OAuth!**

Here's why:
- Clerk handles the OAuth callback URLs
- Your local app (localhost:5173) just needs to handle the final redirect
- Clerk's development keys work with localhost

## What I Fixed

1. **Implemented OAuth handlers** in LoginPage.tsx and RegisterPage.tsx
2. **Created SSOCallbackPage** to handle OAuth redirects
3. **Added route** for /sso-callback
4. **Added Clerk types** for TypeScript support

## Current Implementation

### LoginPage.tsx
```typescript
const handleOAuthLogin = async (provider: OAuthProviderId) => {
  const clerk = window.Clerk
  await clerk.authenticateWithRedirect({
    strategy: `oauth_${provider}`,
    redirectUrl: '/sso-callback',
    redirectUrlComplete: '/',
  })
}
```

### RegisterPage.tsx
```typescript
const handleOAuthLogin = async (provider: OAuthProviderId) => {
  const clerk = window.Clerk
  await clerk.authenticateWithRedirect({
    strategy: `oauth_${provider}`,
    redirectUrl: '/sso-callback',
    redirectUrlComplete: '/profile-completion',
  })
}
```

## Next Steps

1. **Enable OAuth providers in Clerk dashboard** (see Step 2 above)
2. **Test each provider** by clicking the buttons
3. **Monitor browser console** for any errors
4. **Check Clerk dashboard logs** if authentication fails

## Troubleshooting

### "OAuth provider not enabled" error
- Go to Clerk dashboard and enable the provider
- Make sure you saved the changes

### "Redirect URI mismatch" error
- Check that your Clerk callback URL is correct
- For local development: `http://localhost:5173/sso-callback`
- For production: `https://yourdomain.com/sso-callback`

### OAuth button does nothing
- Check browser console for errors
- Make sure Clerk is initialized (check for `window.Clerk`)
- Verify VITE_CLERK_PUBLISHABLE_KEY is set in .env

### User stuck on "Completing sign in..." page
- Check that handleRedirectCallback is working
- Look for errors in browser console
- Check Clerk dashboard logs

## Magic Link Setup (Optional)

To enable Magic Link authentication:

1. Go to Clerk dashboard
2. Click **"User & Authentication"** → **"Email, Phone, Username"**
3. Under **"Authentication strategies"**, enable **"Email link"**
4. Update the code in LoginPage.tsx to use Clerk's magic link API

## Production Considerations

Before going to production:

1. **Replace Clerk development keys** with your own OAuth credentials
2. **Configure production redirect URIs** in each OAuth provider
3. **Set up custom domain** in Clerk (optional but recommended)
4. **Enable email verification** for new accounts
5. **Configure session settings** (timeout, multi-session, etc.)
6. **Set up webhooks** for user events (optional)

## Resources

- [Clerk OAuth Documentation](https://clerk.com/docs/authentication/social-connections/overview)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Google OAuth Setup](https://clerk.com/docs/authentication/social-connections/google)
- [Apple OAuth Setup](https://clerk.com/docs/authentication/social-connections/apple)
- [Microsoft OAuth Setup](https://clerk.com/docs/authentication/social-connections/microsoft)

---

**Your Clerk Instance**: square-antelope-19.clerk.accounts.dev
**Dashboard**: https://dashboard.clerk.com
**Local App**: http://localhost:5173
