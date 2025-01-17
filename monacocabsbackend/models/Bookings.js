const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  fare: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // e.g., Pending, Confirmed, Completed
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', BookingSchema);
