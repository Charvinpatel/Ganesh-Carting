import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:          { type: String, enum: ['admin', 'operator', 'driver'], default: 'operator' },
  driverProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hashed
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
