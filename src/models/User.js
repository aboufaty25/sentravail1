const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { TRADE_SLUGS } = require('../config/trades');

const BCRYPT_ROUNDS = 11;

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: (v) => Array.isArray(v) && v.length === 2,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['worker', 'recruiter', 'admin'], default: 'worker' },
    trades: [{ type: String, enum: TRADE_SLUGS }],
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    voiceIntroUrl: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    city: { type: String, trim: true, default: '' }, // city slug
    neighborhood: { type: String, trim: true, maxlength: 60, default: '' },
    location: { type: pointSchema, default: undefined },
    availableToday: { type: Boolean, default: false },
    whatsapp: { type: String, trim: true, default: null }, // E.164
    isVerified: { type: Boolean, default: false },
    isBoosted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ trades: 1, city: 1 });

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
};

userSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Number to contact on WhatsApp (falls back to the login phone).
userSchema.virtual('contactNumber').get(function contactNumber() {
  return this.whatsapp || this.phone;
});

userSchema.virtual('initials').get(function initials() {
  return (this.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
});

module.exports = mongoose.model('User', userSchema);
