import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name:    { type: String, required: true, unique: true },
  phone:   { type: String, default: '' },
  email:   { type: String, default: '' },
  address: { type: String, default: '' },
  notes:   { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);
