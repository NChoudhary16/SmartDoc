---
description: How to run the AI Document Automater (Ethereal) full-stack application
---

# Running the AI Document Automater

## Prerequisites
- Node.js 18+ installed
- Valid `GEMINI_API_KEY` in `server/.env`
- (Optional) Supabase credentials for vector DB features

## Steps

// turbo-all

1. Install all dependencies from the root directory:
```bash
npm install
```

2. Start both client and server concurrently:
```bash
npm run dev
```

This runs:
- **Next.js Frontend** on http://localhost:3000
- **Express Backend** on http://localhost:5000

## Alternative: Run Individually

3. Run only the frontend:
```bash
cd client && npm run dev
```

4. Run only the backend (with hot-reload):
```bash
cd server && npm run dev
```

5. Run backend without nodemon:
```bash
cd server && node index.js
```

## Verify

6. Open http://localhost:3000 in a browser — you should see the Ethereal dashboard
7. Open http://localhost:5000 — should return `{"message":"DocuFlow AI API is running"}`
8. Navigate to http://localhost:3000/admin — should show the Admin Review Center

## Seed Templates (Optional)

9. Seed document templates into Supabase (requires valid Supabase + Gemini credentials):
```bash
cd server && node seedTemplates.js
```
