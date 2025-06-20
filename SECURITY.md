# Security Guidelines for INSAN MOBILE

## 🔒 Environment Variables Security

### Critical Security Rules

1. **NEVER commit sensitive data to version control**
   - `.env.local` is in `.gitignore` - keep it there
   - Always use `.env.example` as template
   - Regenerate all keys if accidentally committed

2. **Server-side vs Client-side Variables**
   ```bash
   # ✅ Safe for client-side (prefixed with NEXT_PUBLIC_)
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
   
   # ⚠️ Server-side ONLY (no NEXT_PUBLIC_ prefix)
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

3. **Key Rotation Schedule**
   - Rotate Supabase keys every 90 days
   - Rotate VAPID keys every 180 days
   - Monitor for unauthorized access

## 🛡️ Authentication Security

### Current Implementation
- ✅ JWT token validation
- ✅ Role-based access control (RBAC)
- ✅ Protected routes
- ✅ Session management
- ✅ Auto token refresh

### Security Checklist
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Supabase ORM)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Secure headers

## 🔍 Input Validation

### Forms with Validation
1. **Login Form** (`src/pages/LoginPage.tsx`)
   - Email/username validation
   - Password strength requirements
   - Rate limiting on failed attempts

2. **User Management** (`src/pages/UsersPage.tsx`)
   - Role validation
   - Email format validation
   - Phone number validation

3. **Package Management** (`src/pages/PackagesPage.tsx`)
   - Package ID validation
   - Status enum validation
   - Date validation

4. **Location Management** (`src/pages/LocationsPage.tsx`)
   - Coordinate validation
   - Address sanitization

### Validation Schema Location
- `src/lib/validations/` - Zod schemas for all forms
- `src/lib/security.ts` - Security utilities

## 🚀 Deployment Security

### Vercel Deployment
1. **Environment Variables Setup**
   ```bash
   # Add via Vercel Dashboard or CLI
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
   vercel env add VAPID_PRIVATE_KEY production
   ```

2. **Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy

### Firebase Hosting
1. **Environment Configuration**
   ```bash
   firebase functions:config:set \
     supabase.url="your_url" \
     supabase.anon_key="your_key"
   ```

2. **Hosting Security**
   - HTTPS enforcement
   - Security headers in `firebase.json`
   - Service Worker security

## 📱 PWA Security

### Service Worker Security
- ✅ Secure caching strategies
- ✅ HTTPS requirement
- ✅ Origin validation
- ✅ Content integrity checks

### Push Notifications Security
- ✅ VAPID key authentication
- ✅ Subscription validation
- ✅ Message encryption
- ✅ User consent management

## 🔧 Security Utilities

### Available Security Functions
```typescript
// src/lib/security.ts
import { 
  sanitizeInput,
  validateEmail,
  validatePhone,
  hashPassword,
  verifyPassword,
  generateSecureToken
} from '@/lib/security';
```

### Authentication Middleware
```typescript
// src/lib/auth-middleware.ts
import { authMiddleware } from '@/lib/auth-middleware';

// Protects API routes
export default authMiddleware({
  requiredRole: 'admin',
  allowedMethods: ['GET', 'POST']
});
```

## 🚨 Security Monitoring

### Logging and Monitoring
- ✅ Authentication attempts
- ✅ Failed login tracking
- ✅ API rate limiting
- ✅ Error logging (without sensitive data)

### Security Alerts
- Monitor Supabase dashboard for unusual activity
- Set up alerts for failed authentication attempts
- Monitor API usage patterns

## 🔄 Security Updates

### Regular Security Tasks
1. **Weekly**
   - Review authentication logs
   - Check for dependency updates
   - Monitor error rates

2. **Monthly**
   - Security audit of new features
   - Review user permissions
   - Update security documentation

3. **Quarterly**
   - Rotate API keys
   - Security penetration testing
   - Review and update security policies

## 📞 Security Incident Response

### If Security Breach Detected
1. **Immediate Actions**
   - Rotate all API keys immediately
   - Revoke compromised user sessions
   - Document the incident

2. **Investigation**
   - Check Supabase logs
   - Review authentication patterns
   - Identify affected users

3. **Recovery**
   - Update security measures
   - Notify affected users
   - Implement additional monitoring

## 📋 Security Checklist for Production

- [ ] All API keys moved to environment variables
- [ ] `.env.local` not committed to git
- [ ] Supabase RLS policies configured
- [ ] Input validation on all forms
- [ ] Authentication middleware active
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Error handling doesn't expose sensitive data
- [ ] Rate limiting implemented
- [ ] Monitoring and logging active
- [ ] Backup and recovery plan in place

---

**Last Updated:** January 2025  
**Next Review:** April 2025