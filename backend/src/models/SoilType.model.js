import mongoose from 'mongoose';

const soilTypeSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  buyPrice:  { type: Number, required: true, min: 0, default: 0 },
  sellPrice: { type: Number, required: true, min: 0, default: 0 },
  color:     { type: String, default: '#888888' },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model('SoilType', soilTypeSchema);
