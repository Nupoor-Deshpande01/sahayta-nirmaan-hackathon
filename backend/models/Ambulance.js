const mongoose = require('mongoose');

const AmbulanceSchema = new mongoose.Schema({
  driverName: { type: String, required: true },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  status: { type: String, enum: ['available', 'busy'], default: 'available' }
});

AmbulanceSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Ambulance', AmbulanceSchema);
