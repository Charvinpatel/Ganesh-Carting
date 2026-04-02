# TransportPro — Backend API

> **Node.js + Express + MongoDB** backend for the TransportPro Vite TMS frontend.

---

## 📁 Project Structure

```
tms-backend/
├── src/
│   ├── server.js                  ← Entry point
│   ├── config/
│   │   ├── db.js                  ← MongoDB connection
│   │   └── seed.js                ← Sample data seeder
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Driver.model.js
│   │   ├── Vehicle.model.js
│   │   ├── SoilType.model.js
│   │   ├── Trip.model.js
│   │   └── Diesel.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── driver.controller.js
│   │   ├── vehicle.controller.js
│   │   ├── soilType.controller.js
│   │   ├── trip.controller.js
│   │   ├── diesel.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── finance.controller.js
│   │   └── report.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── driver.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── soilType.routes.js
│   │   ├── trip.routes.js
│   │   ├── diesel.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── finance.routes.js
│   │   └── report.routes.js
│   └── middleware/
│       └── auth.middleware.js
├── frontend-api-service/
│   ├── api.js          ← Drop into src/utils/api.js in frontend
│   └── useStore.js     ← Drop into src/store/useStore.js in frontend
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 2. Install dependencies
```bash
cd tms-backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
```

### 4. Seed sample data (optional but recommended)
```bash
npm run seed
# Creates 3 drivers, 3 vehicles, 3 soil types, 5 trips, 4 diesel entries
# Admin login: admin@transportpro.in / Admin@123
```

### 5. Start the server
```bash
npm run dev    # development (nodemon, auto-restart)
npm start      # production
```

Server runs on **http://localhost:5000**

---

## 🔗 Connect the Frontend

### Step 1 — Add environment variable to Vite project
Create or edit `tms/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Step 2 — Copy the API service files
```bash
cp frontend-api-service/api.js      tms/src/utils/api.js
cp frontend-api-service/useStore.js tms/src/store/useStore.js
```

### Step 3 — Add init() call in App.jsx
```jsx
import { useEffect } from 'react';
import { useStore } from './store/useStore';

export default function App() {
  const init = useStore(s => s.init);

  useEffect(() => {
    init();   // loads all data from backend on startup
  }, [init]);

  // ... rest of your App
}
```

### Step 4 — Handle _id vs id
The backend uses MongoDB `_id` instead of the frontend's `id`.
In your page components, replace `item.id` with `item._id` where needed,
or add this one-liner normalizer to `api.js` responses:

```js
// Quick helper — add to api.js if you don't want to change all pages:
const norm = (d) => Array.isArray(d)
  ? d.map(x => ({ ...x, id: x._id }))
  : { ...d, id: d._id };
```

---

## 📡 Full API Reference

All routes (except auth) require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Auth
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| POST   | `/api/auth/register`        | Register new user     |
| POST   | `/api/auth/login`           | Login → returns token |
| GET    | `/api/auth/me`              | Get current user      |
| PATCH  | `/api/auth/change-password` | Change password       |

**Login body:**
```json
{ "email": "admin@transportpro.in", "password": "Admin@123" }
```

---

### Drivers — `/api/drivers`
| Method | Endpoint           | Description     |
|--------|--------------------|-----------------|
| GET    | `/api/drivers`     | List all        |
| POST   | `/api/drivers`     | Create          |
| GET    | `/api/drivers/:id` | Get one         |
| PUT    | `/api/drivers/:id` | Update          |
| DELETE | `/api/drivers/:id` | Delete          |

**Create/Update body:**
```json
{
  "name": "Ramesh Patel",
  "phone": "9876543210",
  "license": "GJ05-20231234",
  "licenseExpiry": "2027-06-30",
  "status": "active"
}
```

---

### Vehicles — `/api/vehicles`
| Method | Endpoint            | Description |
|--------|---------------------|-------------|
| GET    | `/api/vehicles`     | List all (populated with driver) |
| POST   | `/api/vehicles`     | Create      |
| GET    | `/api/vehicles/:id` | Get one with stats |
| PUT    | `/api/vehicles/:id` | Update      |
| DELETE | `/api/vehicles/:id` | Delete      |

**Create/Update body:**
```json
{
  "number": "GJ05AB1234",
  "type": "truck",
  "assignedDriver": "<driver_id>",
  "model": "TATA 2518",
  "capacity": "18T",
  "status": "active"
}
```

---

### Soil Types — `/api/soil-types`
| Method | Endpoint               | Description |
|--------|------------------------|-------------|
| GET    | `/api/soil-types`      | List all    |
| POST   | `/api/soil-types`      | Create      |
| PUT    | `/api/soil-types/:id`  | Update prices |
| DELETE | `/api/soil-types/:id`  | Delete      |

---

### Trips — `/api/trips`
| Method | Endpoint         | Description   |
|--------|------------------|---------------|
| GET    | `/api/trips`     | List (filterable) |
| POST   | `/api/trips`     | Create        |
| GET    | `/api/trips/:id` | Get one       |
| PUT    | `/api/trips/:id` | Update        |
| DELETE | `/api/trips/:id` | Delete        |

**Query filters:**
```
GET /api/trips?date=2026-03-28
GET /api/trips?from=2026-03-01&to=2026-03-31
GET /api/trips?vehicleId=<id>&driverId=<id>
```

**Create/Update body:**
```json
{
  "date": "2026-03-28",
  "driver": "<driver_id>",
  "vehicle": "<vehicle_id>",
  "soilType": "<soilType_id>",
  "source": "Surat Quarry",
  "destination": "Adajan Site",
  "trips": 4,
  "buyPrice": 1200,
  "sellPrice": 1800,
  "notes": ""
}
```

---

### Diesel — `/api/diesel`
| Method | Endpoint           | Description |
|--------|--------------------|-------------|
| GET    | `/api/diesel`      | List (filterable) |
| POST   | `/api/diesel`      | Create      |
| GET    | `/api/diesel/:id`  | Get one     |
| PUT    | `/api/diesel/:id`  | Update      |
| DELETE | `/api/diesel/:id`  | Delete      |

**Create/Update body:**
```json
{
  "date": "2026-03-28",
  "vehicle": "<vehicle_id>",
  "driver": "<driver_id>",
  "liters": 60,
  "amount": 5340,
  "pumpName": "Indian Oil",
  "pumpLocation": "Bardoli"
}
```

---

### Dashboard — `/api/dashboard`
```
GET /api/dashboard
```
Returns today's stats, 7-day chart data, vehicle activity, soil breakdown and recent trips — everything the Dashboard page needs in one call.

---

### Finance — `/api/finance`
```
GET /api/finance/summary?days=30
GET /api/finance/summary?days=7
GET /api/finance/summary?days=90
```
Returns P&L summary, 14-day chart data, soil type breakdown and vehicle-wise P&L.

---

### Reports — `/api/reports`
```
GET /api/reports/daily?date=2026-03-28
GET /api/reports/driver?from=2026-03-01&to=2026-03-31
GET /api/reports/vehicle?from=2026-03-01&to=2026-03-31
GET /api/reports/summary?from=2026-03-01&to=2026-03-31
```

---

## 🔒 Security Notes
- Change `JWT_SECRET` to a long random string in production
- Use HTTPS in production (Nginx reverse proxy recommended)
- Set `NODE_ENV=production` to disable stack traces in error responses
- Never commit `.env` — only `.env.example` is safe to commit

---

## 🗄️ Deploy to MongoDB Atlas (Free)

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Whitelist your server IP in Network Access
4. Create a DB user
5. Copy the connection string and set it as `MONGO_URI` in `.env`

---

## 📦 Deploy Backend (Railway / Render / VPS)

### Railway (recommended — free tier)
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway add --plugin mongodb
railway up
```

### Render
1. Push code to GitHub
2. New Web Service → connect repo
3. Build: `npm install`  Start: `npm start`
4. Add environment variables in dashboard

---

## 🧪 Test with curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@transportpro.in","password":"Admin@123"}'

# Use returned token
TOKEN="<paste token here>"

# Get all drivers
curl http://localhost:5000/api/drivers \
  -H "Authorization: Bearer $TOKEN"

# Dashboard
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```
