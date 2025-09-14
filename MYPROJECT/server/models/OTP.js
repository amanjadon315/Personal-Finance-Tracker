const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: 6
  },
  purpose: {
    type: String,
    enum: ['signup', 'login', 'verify', 'reset', 'resend'],
    default: 'verify'
  },
  attempts: {
    type: Number,
    default: 0,
    max: [3, 'Maximum OTP attempts exceeded']
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    }
  }
}, {
  timestamps: true
});

// Index for automatic document expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient queries
otpSchema.index({ email: 1, otp: 1 });
otpSchema.index({ email: 1, purpose: 1 });

// Pre-save middleware to increment attempts
otpSchema.pre('save', function(next) {
  if (this.isModified('otp') && !this.isNew) {
    this.attempts += 1;
  }
  next();
});

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otp, purpose = 'verify') {
  const otpRecord = await this.findOne({
    email,
    otp,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 }
  });

  if (!otpRecord) {
    return { success: false, message: 'Invalid or expired OTP' };
  }

  // Mark as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  return { success: true, message: 'OTP verified successfully' };
};

// Static method to generate and save OTP
otpSchema.statics.generateOTP = async function(email, purpose = 'verify') {
  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Remove any existing OTPs for this email and purpose
  await this.deleteMany({ email, purpose });
  
  // Create new OTP
  const otp = new this({
    email,
    otp: otpCode,
    purpose
  });
  
  await otp.save();
  return otpCode;
};

// Static method to clean up expired OTPs
otpSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true },
      { attempts: { $gte: 3 } }
    ]
  });
  
  console.log(`Cleaned up ${result.deletedCount} expired OTP records`);
  return result.deletedCount;
};

module.exports = mongoose.model('OTP', otpSchema);