const Hospital = require('../models/Hospital');

exports.getNearestHospitals = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    // In production, we'd use MongoDB $near geospatial query:
    // const hospitals = await Hospital.find({
    //   location: {
    //     $near: {
    //       $geometry: { type: "Point", coordinates: [lng, lat] },
    //       $maxDistance: 10000
    //     }
    //   },
    //   availableBeds: { $gt: 0 }
    // });

    // Mock response
    const hospitals = await Hospital.find({ availableBeds: { $gt: 0 } }).limit(5);

    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
