import mongoose from 'mongoose';

const upadSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  amount: { type: Number, required: true },
  date:   { type: String, required: true }, // YYYY-MM-DD
  reason: { type: String, default: '' },
  givenBy: { type: String, default: 'Admin' },
}, { timestamps: true });

export default mongoose.model('Upad', upadSchema);
