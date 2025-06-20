# Environment Setup Guide

## Overview
This guide provides instructions for setting up environment variables for the INSAN MOBILE PWA across different deployment platforms.

## Environment Variables

### Required Variables

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

#### App Configuration
```bash
NEXT_PUBLIC_APP_URL=https://insan-mobile-1.vercel.app
NEXT_PUBLIC_APP_NAME="INSAN MOBILE"
NODE_ENV=production
```

#### Push Notifications (VAPID Keys)
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

## Platform-Specific Setup

### 1. Vercel Deployment

#### Option A: Using Vercel Dashboard
1. Go to your project settings in Vercel Dashboard
2. Navigate to "Environment Variables"
3. Add each variable with the values above
4. Set environment to "Production"

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_NAME production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add NODE_ENV production

# Deploy
vercel --prod
```

#### Option C: Using vercel.json (Already Configured)
The `vercel.json` file has been updated with all environment variables.

### 2. Firebase Hosting

#### Setup Firebase Environment
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Set environment variables in Firebase
firebase functions:config:set \
  supabase.url="your_supabase_url_here" \
  supabase.anon_key="your_supabase_anon_key_here" \
  supabase.service_role_key="your_supabase_service_role_key_here" \
  app.url="your_app_url_here" \
  vapid.public_key="your_vapid_public_key_here"

# Deploy
firebase deploy
```

### 3. Manual/Self-Hosted Deployment

#### Create .env file
```bash
# Copy the provided .env file to your server
cp .env /path/to/your/deployment/

# Or create manually
cat > .env << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_APP_URL=your_app_url_here
NEXT_PUBLIC_APP_NAME="INSAN MOBILE"
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
NODE_ENV=production
EOF
```

## Security Considerations

### Environment Variable Security
- ✅ **NEXT_PUBLIC_*** variables are safe to expose to the client
- ⚠️ **SUPABASE_SERVICE_ROLE_KEY** should only be used server-side
- ⚠️ **VAPID_PRIVATE_KEY** should be kept secure and server-side only

### Best Practices
1. Never commit `.env` files to version control
2. Use different keys for development and production
3. Rotate keys regularly
4. Monitor usage in Supabase dashboard
5. Set up proper CORS policies in Supabase

## Verification

### Test Environment Setup
```bash
# Check if environment variables are loaded
npm run build
npm start

# Test in browser console
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Supabase Connection Test
```javascript
// Test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test connection
const { data, error } = await supabase.from('users').select('count')
console.log('Supabase connection:', data ? 'Success' : 'Failed', error)
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure `.env` file is in project root
   - Restart development server
   - Check variable names (case-sensitive)

2. **Supabase connection errors**
   - Verify URL and keys are correct
   - Check Supabase project status
   - Verify CORS settings

3. **Push notifications not working**
   - Ensure VAPID keys are correctly set
   - Check browser permissions
   - Verify service worker registration

### Support
For deployment issues, contact: sunan.parains@gmail.com

---

**Note**: This configuration is set up for the production deployment at `https://insan-mobile-1.vercel.app/` with the provided Supabase instance and VAPID keys.