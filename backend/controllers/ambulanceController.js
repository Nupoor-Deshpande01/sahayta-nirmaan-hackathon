const Ambulance = require('../models/Ambulance');

exports.getNearestAmbulance = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    // In production, use $near aggregation
    // For mock, return random available ambulance
    const ambulances = await Ambulance.find({ status: 'available' }).limit(3);
    res.status(200).json({ success: true, data: ambulances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { ambulanceId, lat, lng } = req.body;
    
    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) return res.status(404).json({ success: false, error: 'Ambulance not found' });

    ambulance.currentLocation.coordinates = [lng, lat];
    await ambulance.save();

    // Real-time broadcast
    if (req.io) {
      req.io.emit('ambulance_location_update', { ambulanceId, lat, lng });
    }

    res.status(200).json({ success: true, data: ambulance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
