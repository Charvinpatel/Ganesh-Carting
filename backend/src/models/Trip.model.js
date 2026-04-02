import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  date:        { type: String, required: true },  // YYYY-MM-DD
  driver:      { type: mongoose.Schema.Types.ObjectId, ref: 'Driver',   required: true },
  vehicle:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle',  required: true },
  soilType:    { type: mongoose.Schema.Types.ObjectId, ref: 'SoilType', required: true },
  vendor:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // Optional link to vendor
  source:      { type: String, default: '' },
  destination: { type: String, default: '' },
  trips:       { type: Number, required: true, min: 1, default: 1 },
  buyPrice:    { type: Number, required: true, min: 0 },
  sellPrice:   { type: Number, required: true, min: 0 },
  notes:       { type: String, default: '' },
}, { timestamps: true });

// Virtual computed fields (available after .toObject({ virtuals: true }))
tripSchema.virtual('profit').get(function () {
  return (this.sellPrice - this.buyPrice) * this.trips;
});
tripSchema.virtual('revenue').get(function () {
  return this.sellPrice * this.trips;
});
tripSchema.virtual('cost').get(function () {
  return this.buyPrice * this.trips;
});

export default mongoose.model('Trip', tripSchema);
