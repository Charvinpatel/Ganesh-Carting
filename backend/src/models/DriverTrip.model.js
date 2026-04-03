import mongoose from 'mongoose';

const driverTripSchema = new mongoose.Schema({
  date:        { type: String, required: true, index: true },  // YYYY-MM-DD
  driver:      { type: mongoose.Schema.Types.ObjectId, ref: 'Driver',   required: true },
  vehicle:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle',  required: true },
  soilType:    { type: mongoose.Schema.Types.ObjectId, ref: 'SoilType' },
  source:      { type: String, default: '' },
  destination: { type: String, default: '' },
  trips:       { type: Number, required: true, min: 1, default: 1 },
  status:      { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  systemTrip:  { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }, // Link to admin-added trip if verified
  notes:       { type: String, default: '' },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model('DriverTrip', driverTripSchema);
