const Hospital = require('../models/Hospital');

exports.getNearestHospitals = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    let hospitals;

    if (lat && lng) {
      // Real geospatial nearest query using MongoDB 2dsphere index
      hospitals = await Hospital.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: 20000 // 20 km radius
          }
        }
      }).limit(5);
    } else {
      // Fallback: return all hospitals sorted by beds available
      hospitals = await Hospital.find({}).sort({ availableBeds: -1 }).limit(5);
    }

    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
