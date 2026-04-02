import mongoose from 'mongoose';

const dieselSchema = new mongoose.Schema({
  date:         { type: String, required: true },  // YYYY-MM-DD
  vehicle:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver:       { type: mongoose.Schema.Types.ObjectId, ref: 'Driver',  default: null },
  liters:       { type: Number, default: 0 },
  amount:       { type: Number, required: true, min: 0 },
  pumpName:     { type: String, default: '' },
  pumpLocation: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Diesel', dieselSchema);
