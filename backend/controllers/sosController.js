const SOSRequest = require('../models/SOSRequest');
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const { calculateETA } = require('../services/mapsService');
const { sendSMS } = require('../services/notificationService');

exports.triggerSOS = async (req, res) => {
  try {
    const { userId, latitude, longitude, accidentSeverity } = req.body;

    // 1. Log SOS in database
    const sosRequest = new SOSRequest({
      userId,
      location: { latitude, longitude },
      accidentSeverity: accidentSeverity || 'High'
    });

    // 2. Find Nearest Available Ambulance (Mock Logic: select first available)
    const ambulance = await Ambulance.findOne({ status: 'available' });
    if (ambulance) {
      sosRequest.assignedAmbulanceId = ambulance._id;
      sosRequest.status = 'dispatched';
      ambulance.status = 'busy';
      await ambulance.save();
    }

    // 3. Find Nearest Hospital (Mock Logic: select first)
    const hospital = await Hospital.findOne({});
    if (hospital) {
      sosRequest.targetHospitalId = hospital._id;
    }

    await sosRequest.save();

    // Emitting real-time socket event
    if (req.io) {
      req.io.emit('new_sos', sosRequest);
    }

    // Mock notification
    await sendSMS('+919876543210', 'Emergency Alert Triggered. Ambulance dispatched.');

    res.status(201).json({ success: true, data: sosRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
