import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  number:         { type: String, required: true, unique: true, trim: true, uppercase: true },
  type:           { type: String, enum: ['truck', 'hitachi', 'other'], default: 'truck' },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  model:          { type: String, default: '' },
  capacity:       { type: String, default: '' },
  status:         { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);
