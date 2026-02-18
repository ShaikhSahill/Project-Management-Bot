# ProjectAlloc Deployment Guide

## Architecture Overview
- **Frontend**: React/Vite → Vercel
- **Backend**: Node.js/Express → Render  
- **AI Service**: Python/FastAPI → Render
- **Database**: MongoDB Atlas (free tier)

---

## Step 1: MongoDB Atlas Setup (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free M0 tier)
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/projectalloc?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your credentials

---

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Create .gitignore
echo "node_modules/
.env
__pycache__/
*.pyc
dist/
.DS_Store" > .gitignore

# Add all files
git add .
git commit -m "Initial commit - ProjectAlloc"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/ProjectAlloc.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy AI Service to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `projectalloc-ai`
   - **Root Directory**: `ai-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `GEMINI_API_KEY` = your Gemini API key
6. Click **"Create Web Service"**
7. Copy the service URL (e.g., `https://projectalloc-ai.onrender.com`)

---

## Step 4: Deploy Backend to Render

1. Click **"New +"** → **"Web Service"**
2. Connect same GitHub repo
3. Configure:
   - **Name**: `projectalloc-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `AI_SERVICE_URL` = `https://projectalloc-ai.onrender.com` (from Step 3)
   - `NODE_ENV` = `production`
5. Click **"Create Web Service"**
6. Copy the URL (e.g., `https://projectalloc-backend.onrender.com`)

---

## Step 5: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repo
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
5. Add Environment Variables:
   - `VITE_API_URL` = `https://projectalloc-backend.onrender.com/api`
6. Click **"Deploy"**
7. Your app is live at `https://your-project.vercel.app`

---

## Step 6: Seed Production Database

Option A: Use the deployed backend API
```bash
# After deployment, visit:
https://projectalloc-backend.onrender.com/api/seed
```

Option B: Run locally pointing to production DB
```bash
# Set MONGODB_URI to your Atlas connection string
cd server
MONGODB_URI="mongodb+srv://..." node src/scripts/seedData.js
```

---

## Environment Variables Summary

### AI Service (Render)
| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Google Gemini API key |

### Backend (Render)
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AI_SERVICE_URL` | https://projectalloc-ai.onrender.com |
| `NODE_ENV` | production |

### Frontend (Vercel)
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | https://projectalloc-backend.onrender.com/api |

---

## Troubleshooting

### "Service Unavailable" on first request
- Render free tier spins down after 15 mins of inactivity
- First request takes ~30 seconds to wake up
- Consider upgrading to paid plan for always-on

### CORS Errors
- Backend already has CORS configured for all origins
- If issues persist, check browser console for specific errors

### MongoDB Connection Failed
- Ensure IP whitelist includes `0.0.0.0/0` in Atlas
- Check connection string format

### Gemini API Errors
- Verify API key is valid
- Check [Google AI Studio](https://makersuite.google.com) for quota

---

## Estimated Costs (Free Tier)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | FREE |
| Render (x2) | Free | FREE |
| MongoDB Atlas | M0 | FREE |
| Gemini API | Free tier | FREE* |

*Gemini free tier: 60 requests/minute

---

## Live URLs After Deployment

- **Frontend**: `https://projectalloc.vercel.app`
- **Backend API**: `https://projectalloc-backend.onrender.com`
- **AI Service**: `https://projectalloc-ai.onrender.com`
