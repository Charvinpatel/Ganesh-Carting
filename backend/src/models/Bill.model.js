import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  vendor:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: false },
  vendorName:  { type: String, default: '' }, // Denormalized for easier display/manual input
  billNumber:  { type: String, required: true, unique: true },
  date:        { type: String, required: true, index: true }, // YYYY-MM-DD
  trips:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
  driverTrips:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'DriverTrip' }], // New: support driver-submitted trips
  destination:     { type: String, default: '' },
  totalTripsCount: { type: Number, default: 0 },
  totalAmount:     { type: Number, default: 0 },
  status:          { type: String, enum: ['unpaid', 'paid'], default: 'unpaid', index: true },
  notes:           { type: String, default: '' },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model('Bill', billSchema);
