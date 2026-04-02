import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import driverRoutes from './routes/driver.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import tripRoutes from './routes/trip.routes.js';
import dieselRoutes from './routes/diesel.routes.js';
import soilTypeRoutes from './routes/soilType.routes.js';
import financeRoutes from './routes/finance.routes.js';
import reportRoutes from './routes/report.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import driverTripRoutes from './routes/driverTrip.routes.js';
import upadRoutes from './routes/upad.routes.js';
import locationRoutes from './routes/location.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import billRoutes from './routes/bill.routes.js';

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
const clientUrls = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',') 
  : [
      'http://localhost:5173', 
      'http://localhost:5174',
      'https://ganesh-carting.vercel.app',
      'https://ganesh-carting-cp.vercel.app',
      'https://ganesh-carting.vercel.app/',
      'https://ganesh-carting-cp.vercel.app/'
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) 
    // or if the origin is in our whitelist
    if (!origin || clientUrls.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/drivers',    driverRoutes);
app.use('/api/vehicles',   vehicleRoutes);
app.use('/api/trips',      tripRoutes);
app.use('/api/diesel',     dieselRoutes);
app.use('/api/soil-types', soilTypeRoutes);
app.use('/api/finance',    financeRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/driver-trips', driverTripRoutes);
app.use('/api/upad',        upadRoutes);
app.use('/api/locations',   locationRoutes);
app.use('/api/vendors',     vendorRoutes);
app.use('/api/bills',       billRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚛  TransportPro API running on http://localhost:${PORT}`);
    console.log(`📋  Env: ${process.env.NODE_ENV}`);
  });
});
