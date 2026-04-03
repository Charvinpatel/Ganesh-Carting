/**
 * Seed script — populates the DB with the same sample data used in the frontend.
 * Run:  node src/config/seed.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Driver from '../models/Driver.model.js';
import Vehicle from '../models/Vehicle.model.js';
import SoilType from '../models/SoilType.model.js';
import Trip from '../models/Trip.model.js';
import Diesel from '../models/Diesel.model.js';
import User from '../models/User.model.js';

dotenv.config();

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB — clearing existing data…');

  await Promise.all([
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    SoilType.deleteMany({}),
    Trip.deleteMany({}),
    Diesel.deleteMany({}),
    User.deleteMany({}),
  ]);

  // Admin user
  const [admin] = await User.create([
    { name: 'Admin', email: 'admin@transportpro.in', password: 'Admin@123', role: 'admin' },
  ]);

  // Drivers
  const [d1, d2, d3] = await Driver.create([
    { name: 'Ramesh Patel',   phone: '9876543210', license: 'GJ05-20231234', licenseExpiry: '2027-06-30', status: 'active' },
    { name: 'Suresh Bhai',    phone: '9765432109', license: 'GJ05-20198765', licenseExpiry: '2026-12-15', status: 'active' },
    { name: 'Mukesh Solanki', phone: '9654321098', license: 'GJ05-20211122', licenseExpiry: '2025-09-20', status: 'active' },
  ]);

  // Vehicles
  const [v1, v2, v3] = await Vehicle.create([
    { number: 'GJ05AB1234', type: 'truck',   assignedDriver: d1._id, model: 'TATA 2518',      capacity: '18T',    status: 'active' },
    { number: 'GJ05CD5678', type: 'truck',   assignedDriver: d2._id, model: 'Ashok Leyland',  capacity: '15T',    status: 'active' },
    { number: 'GJ05EF9012', type: 'hitachi', assignedDriver: d3._id, model: 'Hitachi ZX200',  capacity: '0.9m³',  status: 'active' },
  ]);

  // Soil types
  const [s1, s2, s3] = await SoilType.create([
    { name: 'Black Soil',  buyPrice: 1200, sellPrice: 1800, color: '#1a1a1a' },
    { name: 'Yellow Soil', buyPrice: 800,  sellPrice: 1200, color: '#d4a017' },
    { name: 'Mixed Soil',  buyPrice: 600,  sellPrice: 950,  color: '#8B6914' },
  ]);

  // Trips
  await Trip.create([
    { date: today,      driver: d1._id, vehicle: v1._id, soilType: s1._id, source: 'Surat Quarry',  destination: 'Adajan Site',        trips: 4, buyPrice: 1200, sellPrice: 1800, notes: '' },
    { date: today,      driver: d2._id, vehicle: v2._id, soilType: s2._id, source: 'Navsari Pit',   destination: 'Katargam Project',   trips: 3, buyPrice: 800,  sellPrice: 1200, notes: 'Client paid advance' },
    { date: yesterday,  driver: d1._id, vehicle: v1._id, soilType: s3._id, source: 'Bardoli Site',  destination: 'Sachin Industrial',  trips: 5, buyPrice: 600,  sellPrice: 950,  notes: '' },
    { date: yesterday,  driver: d3._id, vehicle: v3._id, soilType: s1._id, source: 'Surat Quarry',  destination: 'Udhna Site',         trips: 2, buyPrice: 1200, sellPrice: 1800, notes: 'Hitachi loading work' },
    { date: twoDaysAgo, driver: d2._id, vehicle: v2._id, soilType: s2._id, source: 'Navsari Pit',   destination: 'Ring Road Project',  trips: 6, buyPrice: 800,  sellPrice: 1200, notes: '' },
  ]);

  // Diesel
  await Diesel.create([
    { date: today,      vehicle: v1._id, driver: d1._id, liters: 0,  amount: 5000, pumpName: 'HP Petrol Pump', pumpLocation: 'Adajan, Surat' },
    { date: today,      vehicle: v2._id, driver: d2._id, liters: 80, amount: 7120, pumpName: 'BPCL Pump',       pumpLocation: 'Katargam, Surat' },
    { date: yesterday,  vehicle: v1._id, driver: d1._id, liters: 60, amount: 5340, pumpName: 'Indian Oil',      pumpLocation: 'Bardoli' },
    { date: twoDaysAgo, vehicle: v2._id, driver: d2._id, liters: 90, amount: 8010, pumpName: 'HP Petrol Pump', pumpLocation: 'Navsari' },
  ]);

  console.log('Seed complete!');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
