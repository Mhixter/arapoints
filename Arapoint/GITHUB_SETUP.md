# GitHub & Deployment Setup Guide

## Quick Start: Push to GitHub

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the "+" icon → "New repository"
3. Name: `arapoint-platform`
4. Make it **Private**
5. Don't initialize with README (we have code already)
6. Click "Create repository"

### Step 2: Push Your Code

Run these commands in your Replit terminal:

```bash
# Initialize git if not already done
cd Arapoint
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Arapoint Platform"

# Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/arapoint-platform.git

# Push to GitHub
git push -u origin main
```

---

## Netlify Deployment

### Step 1: Connect to Netlify

1. Go to [Netlify](https://netlify.com) and log in
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Select your `arapoint-platform` repository
5. Configure build settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`

### Step 2: Environment Variables

In Netlify dashboard → Site settings → Environment variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.arapoint.com.ng` |
| `VITE_APP_ENV` | `production` |

### Step 3: Custom Domain (TrueHost)

1. In Netlify: Domain settings → Add custom domain → `arapoint.com.ng`
2. In TrueHost DNS panel, add these records:

| Type | Name | Value |
|------|------|-------|
| A | @ | `75.2.60.5` |
| CNAME | www | `[your-site].netlify.app` |

3. Wait for DNS propagation (up to 48 hours)
4. Netlify will auto-provision SSL

---

## Backend Deployment (Render.com)

### Step 1: Create Render Account

1. Go to [Render](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy Backend

1. Click "New +" → "Blueprint"
2. Connect your GitHub repo
3. Render will detect `render.yaml` and create services

### Step 3: Environment Variables

In Render dashboard, add these secrets to both services:

**API Service:**
```
DATABASE_URL=your_production_postgres_url
REDIS_URL=your_redis_url
JWT_SECRET=generate_strong_secret
JWT_REFRESH_SECRET=generate_strong_secret
RESEND_API_KEY=your_resend_key
PAYSTACK_SECRET_KEY=your_paystack_key
ENCRYPTION_KEY=32_character_key
```

**RPA Worker:**
```
DATABASE_URL=same_as_api
REDIS_URL=same_as_api
ENCRYPTION_KEY=same_as_api
NIMC_USERNAME=your_nimc_account
NIMC_PASSWORD=your_nimc_password
JAMB_USERNAME=your_jamb_account
JAMB_PASSWORD=your_jamb_password
VTBIZ_API_KEY=your_vtbiz_key
VTBIZ_SECRET_KEY=your_vtbiz_secret
BUYPOWER_API_KEY=your_buypower_key
```

### Step 4: API Subdomain

In TrueHost DNS panel:

| Type | Name | Value |
|------|------|-------|
| CNAME | api | `arapoint-api.onrender.com` |

---

## Database Setup (Neon)

### Step 1: Create Neon Database

1. Go to [Neon](https://neon.tech)
2. Create new project: `arapoint-production`
3. Choose Frankfurt region (closest to Nigeria)
4. Copy the connection string

### Step 2: Run Migrations

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://..."

# Push schema
npm run db:push
```

---

## GitHub Actions Secrets

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `NETLIFY_AUTH_TOKEN` | From Netlify user settings |
| `NETLIFY_SITE_ID` | From Netlify site settings |
| `RENDER_DEPLOY_HOOK_URL` | From Render → API service → Settings → Deploy Hook |
| `RENDER_RPA_DEPLOY_HOOK_URL` | From Render → RPA service → Settings → Deploy Hook |
| `VITE_API_URL` | `https://api.arapoint.com.ng` |
| `VITE_STAGING_API_URL` | `https://staging-api.arapoint.com.ng` |

---

## Complete DNS Configuration (TrueHost)

Final DNS records:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ | 75.2.60.5 | Netlify apex |
| CNAME | www | [site].netlify.app | Netlify www |
| CNAME | api | arapoint-api.onrender.com | Backend API |
| TXT | @ | netlify-verification=xxx | Netlify verify |

---

## RPA Provider Configuration

### Switching Providers

Edit `rpa/src/config/providers.json`:

```json
{
  "vtu": {
    "airtime": {
      "provider": "reloadly_api",  // Change this
      "fallback": "vtbiz_api"
    }
  }
}
```

Then restart the RPA worker. No code changes needed!

### Available Providers

| Service | Providers |
|---------|-----------|
| NIN | `nimc_portal`, `verifyme_api`, `youverify_api` |
| BVN | `nibss_portal`, `paystack_bvn` |
| JAMB | `jamb_portal` |
| WAEC | `waec_portal`, `waec_scratch_card` |
| Airtime/Data | `vtbiz_api`, `reloadly_api`, `vtpass_api` |
| Electricity | `buypower_api`, `baxi_api` |
| Cable TV | `baxi_api`, `vtpass_api` |

---

## Estimated Monthly Costs

| Service | Plan | Cost |
|---------|------|------|
| Netlify | Pro | $19 |
| Render API | Starter | $7 |
| Render RPA | Starter | $7 |
| Neon Database | Pro | $19 |
| Upstash Redis | Pay-as-you-go | ~$5 |
| **Total** | | **~$57/month** |

*Start with free tiers for testing ($0/month)*

---

## Support

- Netlify Docs: https://docs.netlify.com
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- Drizzle ORM: https://orm.drizzle.team
