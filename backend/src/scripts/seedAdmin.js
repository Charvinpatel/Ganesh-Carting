import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'patelcharvin1@gmail.com';
    const adminPassword = '@Charvin2313';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists. Updating password...');
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
    } else {
      await User.create({
        name: 'Charvin Patel',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('Admin user created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
