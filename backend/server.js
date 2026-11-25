/* ============================================================
   AgriConnect Pro API — Entry Point
   ============================================================ */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  process.env.JWT_SECRET = 'agri_connect_local_dev_secret_2026';
}
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}
console.log("Mongo URI Loaded:", process.env.MONGODB_URI ? "YES" : "NO");
console.log("JWT Secret Loaded:", process.env.JWT_SECRET ? "YES" : "NO");

const seedDemoUsers = async () => {
  if (process.env.NODE_ENV === 'production') return;
  const demoPassword = 'ConnectProDemo!2026';
  const demoUsers = [
    { name: 'AgriConnect Pro Farmer', email: 'farmer@connectpro.demo', phone: '9876543211', roles: ['farmer'] },
    { name: 'AgriConnect Pro Labour', email: 'labour@connectpro.demo', phone: '9876543212', roles: ['labour'] },
    { name: 'AgriConnect Pro Machine Owner', email: 'machine@connectpro.demo', phone: '9876543213', roles: ['machine_owner'] },
    { name: 'AgriConnect Pro Administrator', email: 'admin@connectpro.demo', phone: '9876543214', roles: ['admin'] },
  ];

  try {
    for (const demoUser of demoUsers) {
      const existing = await User.findOne({
        $or: [{ email: demoUser.email }, { phone: demoUser.phone }],
      });
      if (existing) {
        const legacyName = demoUser.name.replace(/^Agri/, '');
        if (existing.email === demoUser.email && existing.name === legacyName) {
          existing.name = demoUser.name;
          await existing.save();
          console.log(`Updated local demo account brand name: ${demoUser.email}`);
        }
        continue;
      }

      await User.create({
        ...demoUser,
        password: demoPassword,
        state: 'Andhra Pradesh',
        district: 'Guntur',
        village: 'Mangalagiri',
        pincode: '522503',
      });
      console.log(`Seeded local ${demoUser.roles[0]} demo account: ${demoUser.email}`);
    }
  } catch (error) {
    console.error('Seed demo users failed:', error.message);
  }
};

const app = express();

// ─── CORS ────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://agrimatch.vercel.app',
  'https://agriconnect-eosin.vercel.app',
];
app.use(
  cors({
    origin: (origin, callback) => {
      const configuredOrigins = (process.env.CLIENT_URL || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const allAllowedOrigins = [
        ...allowedOrigins,
        ...configuredOrigins,
      ];
      if (
        !origin ||
        allAllowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        callback(null, true);
      } else {
        console.error(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ─── Body Parsers ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/machines', require('./routes/machineRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/disease', require('./routes/diseaseRoutes'));
app.use('/api/crops', require('./routes/cropRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'unavailable',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedDemoUsers();

  app.listen(PORT, () => {
    console.log(`✅ AgriConnect Pro API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

startServer();

module.exports = app;
