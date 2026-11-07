const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  accountType: {
    type: String,
    enum: ['savings', 'current', 'fixed_deposit'],
    default: 'savings'
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  transactionLimit: {
    type: Number,
    default: 10000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate account number before saving
accountSchema.pre('save', function(next) {
  if (!this.accountNumber) {
    // Generate account number: ACC + 10 digits
    this.accountNumber = 'ACC' + Math.floor(1000000000 + Math.random() * 9000000000);
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);