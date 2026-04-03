import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['source', 'destination'], required: true },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model('Location', locationSchema);
