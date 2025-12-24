# 🔧 Fix Backend Startup - Missing PDF Dependencies

## Issue

The backend server is failing to start with this error:

```
Error: Cannot find module '@sparticuz/chromium'
```

This is because the PDF generation dependencies haven't been installed yet.

---

## ✅ Solution: Install Missing Dependencies

I've already added the required dependencies to your `backend/package.json`:
- `@sparticuz/chromium` - Serverless-optimized Chromium
- `puppeteer-core` - Headless browser for PDF generation

**Now you just need to install them.**

---

## 🚀 Quick Fix (Run in your WSL terminal)

Since you're already in the backend directory, run:

```bash
# Navigate to project root
cd ~/code/Strategic_AI_Roadmaps

# Install all dependencies
pnpm install

# Return to backend and start server
cd backend
pnpm run dev
```

---

## Alternative: Use the Installation Script

I created a script for you:

```bash
cd ~/code/Strategic_AI_Roadmaps
chmod +x install-pdf-deps.sh
./install-pdf-deps.sh

# Then restart backend
cd backend
pnpm run dev
```

---

## What These Dependencies Do

### @sparticuz/chromium
- **Purpose**: Serverless-optimized Chromium binary
- **Used for**: Generating PDF reports from HTML templates
- **Size**: ~60MB (optimized for cloud deployment)

### puppeteer-core
- **Purpose**: Headless browser automation
- **Used for**: Controlling Chromium to render PDFs
- **Features**: Screenshot capture, PDF generation, page rendering

---

## Optional: Add PDF_SECRET to .env

For production security, add to `backend/.env`:

```bash
PDF_SECRET=your-secure-random-secret-here-change-in-production
```

**Note**: This has a default fallback, so it's not required for development.

---

## After Installation

Once `pnpm install` completes, your backend should start successfully with:

```bash
cd ~/code/Strategic_AI_Roadmaps/backend
pnpm run dev
```

Expected output:
```
🚀 Server running on port 3001
📊 Connected to database
✅ All routes initialized
```

---

## Troubleshooting

### If pnpm install still fails:

Try clearing the cache first:

```bash
cd ~/code/Strategic_AI_Roadmaps
rm -rf node_modules
pnpm store prune
pnpm install
```

### If you get path length errors:

The long Windows/WSL path can cause issues. Try:

```bash
cd ~
mkdir temp-install
cd temp-install
git clone /home/tonycamero/code/Strategic_AI_Roadmaps/.git .
pnpm install
```

Then copy the `node_modules` back to the original location.

---

## What's Installed

After running `pnpm install`, you'll have:

| Package | Version | Purpose |
|---------|---------|---------|
| @sparticuz/chromium | ^131.0.2 | Serverless Chromium |
| puppeteer-core | ^23.10.4 | Browser automation |
| jsonwebtoken | ^9.0.2 | JWT tokens (already installed) |

---

## Next Steps

1. ✅ Run `pnpm install` in project root
2. ✅ Start backend: `cd backend && pnpm run dev`
3. ✅ Test login from frontend
4. ✅ Verify no more module errors

---

**Status**: Dependencies added to package.json ✅  
**Action required**: Run `pnpm install`  
**Time**: ~30-60 seconds
