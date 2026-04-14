const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  allergies: [String],
  emergencyContacts: [{
    name: String,
    phone: String,
    relation: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
