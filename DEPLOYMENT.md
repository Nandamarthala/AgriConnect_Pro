# Deployment Guide

## Project structure

- **Frontend:** repository root. React and Vite files are under `src/` and `public/`.
- **Backend:** `backend/`. Node.js, Express, Mongoose, API routes, and backend secrets are here.
- **Database:** MongoDB Atlas.
- **Frontend hosting:** Vercel.
- **Backend hosting:** Render.

## 1. Create MongoDB Atlas

1. Create a free Atlas project and cluster.
2. Create a database user with read/write access.
3. In Network Access, allow `0.0.0.0/0` for Render.
4. Copy the connection string and replace `<username>`, `<password>`, and the database name:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/connectpro?retryWrites=true&w=majority
```

Do not commit this value. Enter it only in Render environment variables.

## 2. Deploy the backend to Render

1. Push this repository to GitHub.
2. Open https://dashboard.render.com and select **New > Blueprint**.
3. Connect `Nandamarthala/AgriConnect_Pro`.
4. Render reads `render.yaml` and the backend `rootDir: backend`.
5. If creating a Web Service manually, use **Root Directory** `backend`, **Build Command** `npm ci && npm run build`, and **Start Command** `npm start`.
6. Create each required environment variable below.
7. Deploy, then verify:

```text
https://YOUR-SERVICE.onrender.com/api/health
```

### Render environment variables

| Variable | Required | Value/source |
|---|---:|---|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `10000`, or allow Render to provide it |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Generate a random 64-byte secret |
| `JWT_EXPIRES_IN` | Yes | `7d` |
| `CLIENT_URL` | Yes | Vercel frontend URL |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary dashboard |
| `OPENWEATHER_API_KEY` | Optional | OpenWeather dashboard |
| `PLANTID_API_KEY` | Optional | Plant.id dashboard; required for live disease scans |
| `EMAIL_USER` | Required for password recovery | Gmail address |
| `EMAIL_PASS` | Required for password recovery | Gmail app password |

Generate `JWT_SECRET` locally with:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

Do not use the example value or reuse a password.

Disease detection returns an explicit unavailable response until a valid
`PLANTID_API_KEY` is configured. It does not show synthetic results as diagnoses.
Successful scan results are stored in MongoDB per authenticated account. Cloudinary
is optional; without its credentials, scan results are saved without archived
image URLs.

## 3. Deploy the frontend to Vercel

1. Import the GitHub repository in Vercel.
2. Keep the framework preset as Vite.
3. Add this environment variable:

```text
VITE_API_URL=https://YOUR-SERVICE.onrender.com/api
```

4. Deploy and copy the production Vercel URL.

The backend health check at `/api/health` reports whether MongoDB is connected.
Production password reset codes are randomly generated, stored as keyed hashes,
expire after 10 minutes, and are delivered by email.

Local demo accounts are created only when `NODE_ENV` is not `production`.
Production deployments do not receive demo users or a default administrator
credential. Provision production administrators through a trusted, access-
controlled database process; do not promote accounts through public profile
updates.

For local demonstrations only, `DEMO_PASSWORD_RESET_ENABLED=true` accepts the
fixed code `126128` for synthetic `connectpro.test.*@example.com` accounts while
using a localhost MongoDB database in `development` or `test`. It is disabled
in production and does not work with remote MongoDB hosts. Never use this mode
for real accounts or enable it on a deployed service.

## 4. Connect frontend and backend

In Render, set `CLIENT_URL` to the Vercel production URL:

```text
https://YOUR-PROJECT.vercel.app
```

Multiple origins can be comma-separated:

```text
https://YOUR-PROJECT.vercel.app,https://another-preview.vercel.app
```

Redeploy the backend after changing `CLIENT_URL`, and redeploy the frontend after changing `VITE_API_URL`.
