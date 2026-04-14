const mongoose = require('mongoose');

const SOSRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  accidentSeverity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'High' },
  assignedAmbulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  targetHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  status: { type: String, enum: ['pending', 'dispatched', 'arrived', 'completed'], default: 'pending' },
  eta: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SOSRequest', SOSRequestSchema);
