import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  phone:         { type: String, required: true, trim: true },
  license:       { type: String, trim: true, default: '' },
  licenseExpiry: { type: String, default: '' },  // stored as YYYY-MM-DD string (matches frontend)
  status:        { type: String, enum: ['active', 'inactive', 'on-leave'], default: 'active' },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model('Driver', driverSchema);
