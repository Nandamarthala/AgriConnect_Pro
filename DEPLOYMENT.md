# Deployment

AgriConnect Pro uses separate services: a Vite frontend on Vercel, an Express
API on Render, MongoDB Atlas for production data, and Cloudinary for image
storage.

## Current production URLs

- **Frontend:** <https://agri-connect-pro-tan.vercel.app/>
- **API health:** <https://agriconnect-pro.onrender.com/api/health>
- **Frontend API base URL:** `https://agriconnect-pro.onrender.com/api`

Use the current Vercel production domain as Render's `CLIENT_URL`. If the
production domain changes, update the environment variable and redeploy Render.

## 1. Configure MongoDB Atlas

1. Create a MongoDB Atlas cluster and a database user with the access the
   application requires.
2. Configure Atlas Network Access to allow the Render service to connect.
3. Copy the Atlas connection string and replace its username, password, and
   database name. URL-encode special characters in the password.
4. Store the URI in Render as `MONGODB_URI`. Never commit it or paste it into
   public chat.

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/connectpro?retryWrites=true&w=majority
```

## 2. Deploy the API to Render

The repository includes [render.yaml](./render.yaml).

1. In the [Render Dashboard](https://dashboard.render.com), create or update a
   Blueprint connected to `Nandamarthala/AgriConnect_Pro`, branch `main`.
2. Confirm the service root directory is `backend`.
3. The build command is `npm ci && npm run build`; the start command is
   `npm start`.
4. Set the environment variables below in the Render service. Render provides
   `PORT`; do not hard-code it unless the service setup requires it.
5. Deploy and wait for the health check to pass.

| Variable | Requirement | Purpose |
|---|---|---|
| `NODE_ENV` | Required: `production` | Disables development-only behavior |
| `MONGODB_URI` | Required | MongoDB Atlas connection string |
| `JWT_SECRET` | Required | Private, cryptographically random signing secret |
| `JWT_EXPIRES_IN` | Optional; defaults to `7d` | Token lifetime |
| `CLIENT_URL` | Required | Exact Vercel origin, without `/api` or a trailing slash |
| `CLOUDINARY_CLOUD_NAME` | Required for image storage | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Required for image storage | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Required for image storage | Cloudinary API secret |
| `PLANTID_API_KEY` | Required for live disease analysis | Plant.id API key |
| `OPENWEATHER_API_KEY` | Optional | Live weather; otherwise sample fallback data is used |
| `EMAIL_USER` | Required for email password recovery | Email account used by the API |
| `EMAIL_PASS` | Required for email password recovery | Email provider app password |

The Cloudinary variables must come from the same Cloudinary account. Profile
and equipment image uploads require valid Cloudinary credentials. Disease scan
uploads can be analyzed without Cloudinary, but scan images will not be archived
there.

Generate a signing secret locally; do not use this command's output in a public
chat or commit it to the repository:

```powershell
$bytes = New-Object byte[] 64
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
[BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
```

After deployment, verify:

```text
https://YOUR-SERVICE.onrender.com/api/health
```

The response should report `"status":"ok"` and `"database":"connected"`.

## 3. Deploy the frontend to Vercel

1. Import `Nandamarthala/AgriConnect_Pro` from GitHub and select the `main`
   branch.
2. Deploy the standalone Vite frontend from the repository root. Do not import
   the backend as a Vercel service; the API is hosted on Render.
3. Use Vite, build command `npm run build`, and output directory `dist`.
4. Set this Production environment variable (also set it for Preview if you
   use preview deployments):

```text
VITE_API_URL=https://agriconnect-pro.onrender.com/api
```

5. Deploy and confirm the Vercel domain is assigned to the project.

The root [vercel.json](./vercel.json) contains the single-page-app rewrite needed
for direct navigation to frontend routes such as `/login`.

## 4. Connect the services

Set Render's `CLIENT_URL` to the exact Vercel production origin:

```text
https://agri-connect-pro-tan.vercel.app
```

Do not add a trailing slash or `/api`. The backend allows multiple origins as a
comma-separated list when required. Save the environment change and redeploy
the Render service.

## Development-only behavior

- Demo users are created only when `NODE_ENV` is not `production`.
- Production password resets require email configuration. Reset codes are
  randomly generated, stored as keyed hashes, and expire after ten minutes.
- The fixed demo reset code is available only for synthetic local accounts when
  `DEMO_PASSWORD_RESET_ENABLED=true` and a localhost MongoDB is used. Never
  enable it in production.
- The local MongoDB fallback is for development; production requires
  `MONGODB_URI`.
