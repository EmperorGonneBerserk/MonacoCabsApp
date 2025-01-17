const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  contactNumber: { 
    type: String, 
    required: true,
    trim: true
  },
  address: { 
    type: String, 
    required: true,
    trim: true
  },
  vehicleInfo: {
    type: String,
    required: true,
    trim: true
  },
  documents: [{ 
    type: String 
  }],
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  driverCode: { 
    type: String, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Add index for email
DriverSchema.index({ email: 1 });

module.exports = mongoose.model('Driver', DriverSchema);