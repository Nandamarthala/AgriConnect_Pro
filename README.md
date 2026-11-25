# AgriConnect Pro — Local Farm Services

> A mobile-first React web application that connects **farmers**, **labour workers**, and **machine owners** in rural India. Built with Vite + React 19, with local-only demo accounts for each role.

---

## 🎯 Project Purpose

AgriConnect Pro brings farmers and nearby labour and machine owners together. It also provides agricultural tools for disease detection, crop recommendations, and market insights.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **Routing** | React Router DOM v7 |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS (custom design system) |
| **State Management** | React Context API |
| **Storage** | Browser local storage for session/preferences; MongoDB-backed API for account data and scan history |
| **Backend** | Node.js 22, Express, MongoDB/Mongoose |

---

## 👥 User Roles

Registration supports three public user roles. Administrators are assigned only
through trusted server-side provisioning.

| Role | Icon | Description |
|---|---|---|
| **Farmer** | 👨‍🌾 | Posts job requests (harvest, ploughing, spraying, etc.) |
| **Labour Worker** | 👷 | Browses and accepts nearby farm job requests |
| **Machine Owner** | 🚜 | Provides machinery services to farmers |

## 🎨 Visual Identity

The AgriConnect Pro leaf-and-field mark is shared by the app header, sidebar,
public pages, and browser favicon. Light and dark themes retain readable
contrast; authenticated accent colors distinguish farmers (teal), labour
workers (amber), machine owners (blue), and administrators (violet).

---

## 📱 Pages & Features

### 🔐 Authentication Flow

| Page | Route | Description |
|---|---|---|
| Splash | `/` | Animated landing screen |
| Login | `/login` | Email + password login |
| Register | `/register` | New account creation |
| Role Selection | `/role-selection` | Pick Farmer / Labour / Machine Owner |

### 🏠 Core App Pages

| Page | Route | Who Uses It | Description |
|---|---|---|---|
| **Home** | `/home` | All users | Dashboard with stats, quick actions, recent activity |
| **Create Request** | `/create-request` | Farmer | Post a farm job — category, workers needed, date, pay, location |
| **Nearby Requests** | `/nearby` | Labour / Machine | Browse job postings near their location |
| **Request Detail** | `/request/:id` | All | Full view of a job posting, accept/withdraw |
| **My Requests** | `/my-requests` | All | View posted or accepted jobs |
| **Profile** | `/profile` | All | Edit personal info, view ratings, earnings history |

### 🌿 Agricultural Intelligence Pages

| Page | Route | Description |
|---|---|---|
| **Disease Detection** | `/disease-detection` | Upload JPG, PNG, or WebP plant photos (up to 5 MB); successful live scans are saved to the signed-in user's MongoDB history |
| **Crop Recommendation** | `/crop-recommendation` | Starts with the state saved on the user's profile; choose a season to see recommendations |
| **Market Insights** | `/market-insights` | Live-like mandi prices with trend indicators |

---

## ⚙️ Algorithms Used

### 1. 🔄 FCFS — First Come First Served
**File:** `src/utils/fcfs.js`

**Used for: Job Request Acceptance**

Workers who accept a job request are processed strictly in the order they click "Accept". The queue fills up slot by slot until `workersAccepted >= workersNeeded`.

```
┌─────────────────────────────────────────────┐
│  Farmer posts: "Need 3 workers for harvest" │
│                                             │
│  Worker A accepts → slot 1/3 filled         │
│  Worker B accepts → slot 2/3 filled         │
│  Worker C accepts → slot 3/3 filled ✅       │
│  Request status → "active"                  │
│  Worker D tries → ❌ "Request Full"          │
└─────────────────────────────────────────────┘
```

**Validation rules in FCFS:**
- ❌ Cannot accept own request (farmer)
- ❌ Cannot accept twice (duplicate check)
- ❌ Cannot accept if request is `completed` or `expired`
- ✅ Status auto-changes to `active` when all slots filled

---

### 2. 📍 Haversine Formula — Geo-Distance Calculation
**File:** `src/utils/distance.js`

**Used for: Nearby Requests filtering**

Calculates the great-circle distance (in km) between two GPS coordinates (latitude/longitude) on the Earth's surface. This is the standard algorithm used in mapping apps.

```
Formula:
  a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
  c = 2 × atan2(√a, √(1−a))
  d = R × c     (R = 6371 km = Earth's radius)
```

**Functions:**
- `calculateDistance(lat1, lng1, lat2, lng2)` → returns km
- `isWithinRange(userLoc, targetLoc, rangeKm)` → boolean filter
- `formatDistance(km)` → human-readable "2.5 km" or "800m"

---

### 3. 🧠 Rule-Based Matching — Crop Recommendation
**File:** `backend/controllers/cropController.js`

**Used for: Crop Recommendation Engine**

A **lookup-table / rule-based recommendation system** that maps:

```
State (AP, TS, TN, KA, KL, MH) × Season (Kharif / Rabi)
    → Available state-specific crops with yield, risk, water need, and soil
```

**Season detection logic:**
```js
if (month >= 6 && month <= 11) → "kharif"  // Jun–Nov, monsoon
else                           → "rabi"    // Dec–May
```

States with specific data: Andhra Pradesh, Telangana, Tamil Nadu, Karnataka,
Kerala, and Maharashtra. Other selectable states receive general seasonal
suggestions, clearly marked as general rather than location-specific.

---

### 4. 🔬 Plant Image Analysis — Disease Detection
**Files:** `backend/controllers/diseaseController.js`, `backend/models/DiseaseScan.js`

The upload area accepts JPG, PNG, and WebP files up to 5 MB, supports drag and
drop, and validates the file before sending it. A configured Plant.id API is
required for live analysis; without provider credentials, the app reports that
analysis is unavailable rather than showing a fabricated diagnosis. Successful
scans are stored with the authenticated user's ID and shown in that account's
recent scan history.

Set `PLANTID_API_KEY` on the backend to enable live analysis. Do not treat this
feature as available in production until real provider credentials have been
configured and tested.

---

### 5. 📊 Price Trend Indicator — Market Insights
**File:** `src/data/intelligence.js`

**Used for: Mandi Price Display**

Compares current vs previous prices and calculates:

```js
trend   = (currentPrice > previousPrice) ? "up" : "down"
change% = ((currentPrice - previousPrice) / previousPrice) × 100
```

Covers 10 major crops: Rice, Cotton, Groundnut, Red Gram, Maize, Chillies, Sugarcane, Ragi, Coconut, Black Gram.

---

## 🗂️ Project Structure

```
src/
├── App.jsx                    # Router + Auth guards
├── main.jsx                   # Entry point
├── index.css                  # Global design system
│
├── context/
│   ├── AuthContext.jsx        # User auth state (login/register/logout)
│   └── AppContext.jsx         # Global app state (requests, toast)
│
├── pages/
│   ├── Splash.jsx             # Landing screen
│   ├── Login.jsx              # Login page
│   ├── Register.jsx           # Registration
│   ├── RoleSelection.jsx      # Role picker
│   ├── Home.jsx               # Dashboard
│   ├── CreateRequest.jsx      # Post a farm job
│   ├── NearbyRequests.jsx     # Browse nearby jobs
│   ├── RequestDetail.jsx      # Job detail + accept
│   ├── MyRequests.jsx         # My posted/accepted jobs
│   ├── Profile.jsx            # User profile
│   ├── DiseaseDetection.jsx   # AI disease scanner
│   ├── CropRecommendation.jsx # Crop advisor
│   └── MarketInsights.jsx     # Mandi prices
│
├── components/
│   ├── Header.jsx             # Top navigation bar
│   ├── BottomNav.jsx          # Mobile bottom navigation
│   ├── RequestCard.jsx        # Job listing card
│   ├── Modal.jsx              # Reusable modal dialog
│   ├── RatingStars.jsx        # Star rating display
│   ├── StatusBadge.jsx        # Status tag (pending/active/etc.)
│   └── Toast.jsx              # Notification toasts
│
├── utils/
│   ├── fcfs.js                # ⚡ FCFS job acceptance algorithm
│   ├── distance.js            # 📍 Haversine distance formula
│   ├── helpers.js             # Date/price/text formatters
│   └── storage.js             # localStorage read/write wrapper
│
└── data/
    ├── intelligence.js        # 🧠 Disease DB, crop recommendations, market prices
    ├── categories.js          # Job categories (harvest, ploughing, etc.)
    ├── mockRequests.js        # Sample job request data
    └── mockUsers.js           # Sample user data
```

---

## 🧩 Key Components

| Component | Purpose |
|---|---|
| `Header.jsx` | App bar with title and back navigation |
| `BottomNav.jsx` | Mobile-style tab bar (Home, Nearby, Requests, Profile) |
| `RequestCard.jsx` | Card showing job title, pay, distance, worker slots |
| `StatusBadge.jsx` | Color-coded badge: ⏳ Pending / ✅ Active / 🏁 Completed / ⏰ Expired |
| `RatingStars.jsx` | 1–5 star visual rating component |
| `Toast.jsx` | Auto-dismissing success/error notification |
| `Modal.jsx` | Overlay dialog for confirmations |

---

## 🔒 Auth & Route Guards

Two route guard types:
- **ProtectedRoute** — redirects unauthenticated users to `/login`
- **PublicRoute** — redirects already-logged-in users to `/home`

Session is stored in **localStorage** via `AuthContext`.

---

## 📦 Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.6 | UI framework |
| `react-dom` | ^19.2.6 | DOM rendering |
| `react-router-dom` | ^7.15.0 | Client-side routing |
| `lucide-react` | ^1.14.0 | SVG icon library |
| `vite` | ^8.0.12 | Build tool & dev server |

---

## 🚀 Running the App

The project uses one repository with two applications:

```text
agriconnect/
├── src/                    # Frontend React/Vite source
├── public/                 # Frontend static assets
├── package.json            # Frontend scripts and dependencies
├── vercel.json             # Vercel SPA routing
├── backend/
│   ├── server.js           # Backend entry point
│   ├── config/             # MongoDB and external-service config
│   ├── controllers/        # API request handlers
│   ├── middleware/         # Authentication and error middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   ├── services/           # Email, storage, and external APIs
│   ├── package.json        # Backend scripts and dependencies
│   └── .env                 # Local backend configuration (ignored by Git)
├── render.yaml             # Render backend blueprint
└── DEPLOYMENT.md           # Production deployment guide
```

### Frontend

```powershell
npm ci
npm run dev
```

Open http://localhost:5173.
The frontend defaults to `http://localhost:5000/api`; set `VITE_API_URL` in a
local `.env.local` only when using a different API address.

### Backend

```powershell
Set-Location backend
npm ci
npm run dev
```

Keep backend settings in the ignored `backend/.env` file. Leave `MONGODB_URI`
empty to use the persistent local MongoDB for development, or set a complete
Atlas connection string there. Never commit or share the URI or other secrets.

Open http://localhost:5000/api/health.

### Photo credits

The login tractor photo is by [Rahul Mahalik on Pexels](https://www.pexels.com/photo/tractor-plowing-the-field-18135422/).
The landing-page farmer and oxen photo is by [EqualStock IN on Pexels](https://www.pexels.com/photo/farmers-in-india-20515274/).
Both are used under the [Pexels License](https://www.pexels.com/license/).

---

## Local demo accounts

The backend creates these demo accounts only when `NODE_ENV` is not `production`.
The login screen provides development-only buttons to fill in the credentials.

| Role | Email |
|---|---|
| Farmer | `farmer@connectpro.demo` |
| Labour worker | `labour@connectpro.demo` |
| Machine owner | `machine@connectpro.demo` |
| Administrator | `admin@connectpro.demo` |

**Password for all local demos:** `ConnectProDemo!2026`

These are not production credentials. The administrator role is not assignable
through public registration or profile settings. The current app authenticates
administrator accounts but does not include a separate admin console.


## 🔮 Future Enhancements

- 🤖 Actual ML model for disease detection (PlantVillage CNN)
- 📡 Live mandi prices via government APIs (Agmarknet)
- 🗺️ Real GPS geolocation for Nearby Requests
- 💬 In-app chat between farmer and worker
- 💳 Payment integration (UPI/Razorpay)
- 📱 PWA support for offline usage
