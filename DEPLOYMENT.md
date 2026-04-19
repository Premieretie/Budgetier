# Budgetier - Production Deployment Guide

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Cloudflare    │──────▶│   Render (Node)  │──────▶│  PostgreSQL     │
│  budgetier.ink  │      │   api.budgetier  │      │  (Managed)      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## Prerequisites

- GitHub repository with code
- Render account (https://render.com)
- Cloudflare account with domain
- PostgreSQL database (Render managed or external)

---

## 1. Backend Deployment (Render)

### Step 1: Create Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the `Budgetier/backend` directory

### Step 2: Configure Service

| Setting | Value |
|---------|-------|
| **Name** | `budgetier-api` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or paid for production) |

### Step 3: Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-super-secret-random-string-min-32-chars
NODE_ENV=production

# Optional (defaults shown)
PORT=3000                    # Render sets this automatically
FRONTEND_URL=https://budgetier.ink
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Database Setup

If using **Render PostgreSQL**:
1. Create a Managed PostgreSQL instance in Render
2. Copy the **Internal Database URL** or **External Database URL**
3. Set it as `DATABASE_URL` environment variable

The database tables will be auto-created on first run.

---

## 2. Frontend Deployment

### Option A: Render Static Site (Easiest)

1. In Render Dashboard → **New +** → **Static Site**
2. Select your repository
3. Configure:
   - **Name**: `budgetier`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Root Directory**: `Budgetier/frontend`

4. **Environment Variables**:
   ```bash
   REACT_APP_API_URL=https://api.budgetier.ink
   ```

### Option B: Cloudflare Pages (CDN)

1. Go to Cloudflare Dashboard → Pages
2. Connect GitHub repository
3. Configure build:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Build Output**: `build`
   - **Root Directory**: `Budgetier/frontend`

4. **Environment Variables**:
   ```bash
   REACT_APP_API_URL=https://api.budgetier.ink
   ```

---

## 3. Cloudflare DNS Configuration

### For Main Domain (budgetier.ink)

1. Go to Cloudflare Dashboard → DNS
2. Add records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | @ | `budgetier.onrender.com` | Proxied |
| CNAME | www | `budgetier.onrender.com` | Proxied |

### For API Subdomain (api.budgetier.ink)

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | api | `budgetier-api.onrender.com` | DNS Only |

**Important**: API subdomain should be **DNS Only** (not proxied) to avoid Cloudflare interfering with API requests.

### SSL/TLS Settings

1. Go to SSL/TLS → Overview
2. Set to **Full (strict)**

---

## 4. Security Checklist

Before going live, verify:

- [ ] `.env` file is in `.gitignore` (both frontend and backend)
- [ ] `node_modules` in `.gitignore`
- [ ] No hardcoded passwords or secrets in code
- [ ] `JWT_SECRET` is a random string (not a simple password)
- [ ] `DATABASE_URL` uses SSL in production
- [ ] CORS is configured (already done in code)
- [ ] Rate limiting is enabled (already configured)

---

## 5. Post-Deployment Verification

### Test API Health
```bash
curl https://api.budgetier.ink/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

### Test Authentication
```bash
# Register a test user
curl -X POST https://api.budgetier.ink/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "consentGiven": true
  }'
```

### Test CORS
Open browser console on `https://budgetier.ink` and run:
```javascript
fetch('https://api.budgetier.ink/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Should succeed without CORS errors.

---

## 6. Monitoring & Logs

### Render Dashboard
- View real-time logs: `https://dashboard.render.com/web/budgetier-api/logs`
- Monitor metrics in the **Metrics** tab

### Health Check Endpoint
The app exposes `/api/health` for uptime monitoring.

---

## 7. Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` env var is set correctly
- Check browser console for blocked origins
- Look for `CORS blocked origin:` in Render logs

### Database Connection Failures
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Render IP
- Look for connection errors in logs

### 404 Errors
- Ensure API routes are prefixed with `/api`
- Check Render service is running (not suspended)
- Verify domain DNS is pointing correctly

### Authentication Issues
- Verify `JWT_SECRET` is set and consistent
- Check token expiration in `JWT_EXPIRES_IN`
- Ensure localStorage isn't corrupted (clear and retry)

---

## Environment Variable Reference

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing tokens |
| `NODE_ENV` | Yes | Set to `production` |
| `FRONTEND_URL` | No | Frontend domain (defaults to localhost) |
| `PORT` | No | Render sets this automatically |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (default: 15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |

### Frontend (Build-time)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Backend API URL |

---

## Support

For issues:
1. Check Render logs first
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for frontend errors
