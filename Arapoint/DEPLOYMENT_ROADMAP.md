# Arapoint Production Deployment Roadmap

## Overview

This document outlines the complete production deployment strategy for Arapoint on arapoint.com.ng.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        arapoint.com.ng                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Netlify    │    │  Render/Fly  │    │   RPA Worker     │  │
│  │   Frontend   │◄──►│   Backend    │◄──►│   (Puppeteer)    │  │
│  │   (React)    │    │  (Node.js)   │    │                  │  │
│  └──────────────┘    └──────┬───────┘    └────────┬─────────┘  │
│                             │                      │            │
│                      ┌──────▼──────────────────────▼─────┐     │
│                      │         PostgreSQL + Redis        │     │
│                      │     (Neon/Supabase + Upstash)     │     │
│                      └───────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Code Preparation (Week 1)

### 1.1 GitHub Repository Setup
- [ ] Create GitHub repository: `arapoint/arapoint-platform`
- [ ] Configure branch protection on `main`
- [ ] Set up `develop` branch for staging
- [ ] Add `.gitignore`, `.env.example`, and documentation

### 1.2 Project Structure (Monorepo)
```
arapoint-platform/
├── client/                 # React frontend (Netlify)
├── server/                 # Express backend API (Render/Fly.io)
├── rpa/                    # RPA Robot worker (Render/Fly.io)
├── shared/                 # Shared types and utilities
├── .github/
│   └── workflows/          # CI/CD pipelines
├── netlify.toml            # Netlify configuration
├── render.yaml             # Render deployment config
├── package.json            # Root workspace config
└── README.md
```

### 1.3 Environment Variables Template
Create `.env.example` with all required variables.

---

## Phase 2: Database Setup (Week 1-2)

### 2.1 Production Database Options

| Provider | Pros | Cons | Monthly Cost |
|----------|------|------|--------------|
| **Neon** (Recommended) | Serverless, auto-scaling, free tier | Newer service | Free - $25+ |
| **Supabase** | Full BaaS, auth included | More complex | Free - $25+ |
| **PlanetScale** | MySQL, great for scale | Not PostgreSQL | Free - $29+ |

### 2.2 Database Migration Strategy
1. Export development database schema
2. Create production database with same schema
3. Run Drizzle migrations: `npm run db:push`
4. Verify all tables and relationships
5. Set up automated backups

### 2.3 Connection Pooling
- Use connection pooler for production (PgBouncer or Neon's built-in)
- Configure max connections based on plan limits

---

## Phase 3: Frontend Deployment - Netlify (Week 2)

### 3.1 Netlify Configuration

**netlify.toml:**
```toml
[build]
  base = "client"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
  VITE_API_URL = "https://api.arapoint.com.ng"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

### 3.2 Custom Domain Setup
1. Add domain in Netlify: `arapoint.com.ng`
2. Configure DNS at TrueHost:
   - `A` record: `@` → Netlify Load Balancer IP
   - `CNAME` record: `www` → `[your-site].netlify.app`
3. Enable HTTPS (automatic via Let's Encrypt)

### 3.3 Environment Variables (Netlify Dashboard)
- `VITE_API_URL`: https://api.arapoint.com.ng
- `VITE_APP_ENV`: production

---

## Phase 4: Backend Deployment (Week 2-3)

### 4.1 Recommended: Render.com

**render.yaml:**
```yaml
services:
  - type: web
    name: arapoint-api
    env: node
    region: frankfurt  # Closest to Nigeria
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: arapoint-db
          property: connectionString

  - type: worker
    name: arapoint-rpa
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm run rpa:start
```

### 4.2 Alternative: Fly.io

```toml
# fly.toml
app = "arapoint-api"
primary_region = "fra"  # Frankfurt

[http_service]
  internal_port = 5000
  force_https = true

[env]
  NODE_ENV = "production"
```

### 4.3 DNS Configuration for API
- `CNAME` record: `api` → `arapoint-api.onrender.com`

---

## Phase 5: RPA Robot Deployment (Week 3)

### 5.1 Provider Abstraction Layer

The RPA system uses a **provider pattern** that makes switching third-party services easy:

```typescript
// config/providers.json
{
  "identity": {
    "nin": {
      "provider": "nimc_direct",
      "fallback": "verifyme_api"
    },
    "bvn": {
      "provider": "nibss_direct",
      "fallback": "paystack_bvn"
    }
  },
  "education": {
    "jamb": {
      "provider": "jamb_portal",
      "fallback": null
    }
  }
}
```

### 5.2 Switching Providers

To switch a provider:
1. Update `config/providers.json` with new provider name
2. Add credentials to environment variables
3. Restart RPA worker

No code changes required!

### 5.3 Supported Provider Types

| Service | Primary Provider | Alternative Providers |
|---------|------------------|----------------------|
| NIN | NIMC Portal (RPA) | VerifyMe API, Youverify API |
| BVN | NIBSS Portal (RPA) | Paystack BVN, Flutterwave |
| JAMB | JAMB Portal (RPA) | - |
| WAEC | WAEC Portal (RPA) | Africa's Talking |
| VTU | VTBiz, Reloadly | Flutterwave, Paystack |
| Electricity | BuyPower API | BEDC Direct, Baxi |
| Cable | Baxi API | VTPass, Reloadly |

---

## Phase 6: CI/CD Pipeline (Week 3)

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy-frontend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=client/dist

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
```

---

## Phase 7: DNS Configuration at TrueHost (Week 3)

### 7.1 Required DNS Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 75.2.60.5 (Netlify) | 3600 |
| CNAME | www | [site].netlify.app | 3600 |
| CNAME | api | arapoint-api.onrender.com | 3600 |
| TXT | @ | netlify-verification=xxx | 3600 |

### 7.2 TrueHost DNS Panel Steps
1. Login to TrueHost control panel
2. Navigate to DNS Management
3. Add records as shown above
4. Wait for propagation (up to 48 hours)

---

## Phase 8: Security & Monitoring (Week 4)

### 8.1 Security Checklist
- [ ] Enable HTTPS on all domains
- [ ] Configure CORS for API
- [ ] Set up rate limiting
- [ ] Enable database connection encryption
- [ ] Store secrets in environment variables (never commit)
- [ ] Enable 2FA on all hosting accounts

### 8.2 Monitoring Setup
- **Uptime:** UptimeRobot (free) or Better Uptime
- **Error Tracking:** Sentry
- **Analytics:** Plausible or Google Analytics
- **Logs:** Render/Fly.io built-in logging

---

## Environment Variables Checklist

### Frontend (Netlify)
```env
VITE_API_URL=https://api.arapoint.com.ng
VITE_APP_ENV=production
```

### Backend (Render/Fly.io)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secure-secret
JWT_REFRESH_SECRET=your-refresh-secret
RESEND_API_KEY=re_...
PAYSTACK_SECRET_KEY=sk_live_...
ENCRYPTION_KEY=your-32-char-key
```

### RPA Worker
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ENCRYPTION_KEY=your-32-char-key

# Provider Credentials (add as needed)
NIMC_USERNAME=...
NIMC_PASSWORD=...
JAMB_USERNAME=...
JAMB_PASSWORD=...
VTBIZ_API_KEY=...
BUYPOWER_API_KEY=...
```

---

## Cost Estimate (Monthly)

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Frontend | Netlify | Pro | $19 |
| Backend API | Render | Starter | $7 |
| RPA Worker | Render | Starter | $7 |
| Database | Neon | Pro | $19 |
| Redis | Upstash | Pay-as-you-go | ~$5 |
| Domain | TrueHost | Annual | ~$15/year |
| **Total** | | | **~$57/month** |

*Note: Can start with free tiers for testing (~$0/month)*

---

## Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/arapoint/arapoint-platform.git
cd arapoint-platform
npm install

# Development
npm run dev          # Start all services locally

# Production build
npm run build        # Build all packages

# Database
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio

# Deployment
npm run deploy       # Deploy to production
```

---

## Support & Resources

- **Netlify Docs:** https://docs.netlify.com
- **Render Docs:** https://render.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Drizzle ORM:** https://orm.drizzle.team

---

*Last Updated: December 2024*
