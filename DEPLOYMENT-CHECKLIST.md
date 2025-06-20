# 🚀 INSAN MOBILE - Production Deployment Checklist

## Pre-Deployment Setup

### ✅ 1. Environment Preparation
- [ ] Copy `.env.production.example` to `.env.local`
- [ ] Fill in all required environment variables
- [ ] Generate VAPID keys: `npx web-push generate-vapid-keys`
- [ ] Test local build: `npm run build`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run linting: `npm run lint`

### ✅ 2. Supabase Database Setup
- [ ] Create new Supabase project for production
- [ ] Import schema: Run `supabase-schema.sql` in SQL Editor
- [ ] Run production setup: Execute `supabase-production-setup.sql`
- [ ] Verify RLS policies are active
- [ ] Test database connection with production credentials
- [ ] Set up automated backups in Supabase dashboard
- [ ] Configure database monitoring

### ✅ 3. Vercel Account Setup
- [ ] Create/login to Vercel account
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Connect GitHub repository to Vercel

## Deployment Process

### ✅ 4. Vercel Configuration
- [ ] Push code to GitHub repository
- [ ] Import project in Vercel dashboard
- [ ] Configure build settings:
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### ✅ 5. Environment Variables Setup
In Vercel Dashboard → Project → Settings → Environment Variables:

**Required Variables:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_APP_NAME`
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- [ ] `VAPID_PRIVATE_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`

**Optional Variables:**
- [ ] `GOOGLE_AI_API_KEY` (if using AI features)
- [ ] `NEXT_PUBLIC_GA_ID` (if using Google Analytics)
- [ ] `SENTRY_DSN` (if using error tracking)

### ✅ 6. Deploy to Production
- [ ] Deploy using: `npm run deploy` or `vercel --prod`
- [ ] Wait for deployment to complete
- [ ] Note the production URL
- [ ] Update `NEXT_PUBLIC_APP_URL` with actual domain
- [ ] Update `NEXTAUTH_URL` with actual domain
- [ ] Redeploy with updated URLs

## Post-Deployment Testing

### ✅ 7. Functionality Testing
- [ ] Test user registration/login
- [ ] Test admin dashboard access
- [ ] Test package creation and management
- [ ] Test courier assignment
- [ ] Test location management
- [ ] Test profile updates
- [ ] Test push notifications
- [ ] Test PWA installation
- [ ] Test offline functionality

### ✅ 8. Performance Testing
- [ ] Check Lighthouse scores
- [ ] Test loading speeds
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Verify PWA manifest
- [ ] Test service worker functionality

### ✅ 9. Security Testing
- [ ] Verify RLS policies work correctly
- [ ] Test unauthorized access attempts
- [ ] Check HTTPS is enforced
- [ ] Verify environment variables are not exposed
- [ ] Test API endpoints security

## Custom Domain Setup (Optional)

### ✅ 10. Domain Configuration
- [ ] Purchase/configure custom domain
- [ ] Add domain in Vercel dashboard
- [ ] Configure DNS records:
  - A record: `@` → Vercel IP
  - CNAME record: `www` → `your-project.vercel.app`
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate is issued
- [ ] Update environment variables with new domain
- [ ] Test custom domain access

## Monitoring & Maintenance

### ✅ 11. Setup Monitoring
- [ ] Configure Vercel Analytics
- [ ] Setup error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Setup database monitoring in Supabase
- [ ] Configure backup schedules
- [ ] Setup alert notifications

### ✅ 12. Documentation
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create user guides
- [ ] Document API endpoints
- [ ] Create troubleshooting guide

## Backup & Recovery

### ✅ 13. Backup Strategy
- [ ] Configure automated database backups
- [ ] Test backup restoration process
- [ ] Document recovery procedures
- [ ] Setup backup monitoring
- [ ] Create disaster recovery plan

## Final Verification

### ✅ 14. Production Readiness
- [ ] All tests passing
- [ ] Performance metrics acceptable
- [ ] Security measures in place
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Team trained on production system

## Quick Commands Reference

```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Test build locally
npm run build
npm run start

# Deploy to production
npm run deploy
# or
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Check environment variables
vercel env ls
```

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check TypeScript errors: `npm run typecheck`
   - Check linting errors: `npm run lint`
   - Verify environment variables

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Test connection in Supabase dashboard

3. **PWA Issues**
   - Check service worker registration
   - Verify manifest.json
   - Test offline functionality

4. **Push Notification Issues**
   - Verify VAPID keys
   - Check browser permissions
   - Test notification service

## Support Contacts

- **Technical Issues**: [Your Support Email]
- **Deployment Issues**: [DevOps Contact]
- **Database Issues**: [Database Admin]
- **Emergency Contact**: [Emergency Phone]

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Production URL**: ___________
**Version**: ___________

✅ **Deployment Complete!** 🎉