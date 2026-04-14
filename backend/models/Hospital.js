const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  availableBeds: { type: Number, default: 0 },
  totalBeds: { type: Number, default: 0 },
  ICUAvailable: { type: Boolean, default: false },
  ventilators: { type: Number, default: 0 },
  totalVentilators: { type: Number, default: 0 },
  bloodUnits: {
    'O-': { type: Number, default: 0 },
    'O+': { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'A+': { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    'AB-': { type: Number, default: 0 },
    'AB+': { type: Number, default: 0 },
  },
  traumaRoom: { type: String, default: '' },
  surgicalTeamStatus: { type: String, enum: ['Ready', 'Busy', 'Standby'], default: 'Standby' },
  traumaCenter: { type: Number, default: 1 }, // e.g. Trauma Center #4
});

HospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', HospitalSchema);
