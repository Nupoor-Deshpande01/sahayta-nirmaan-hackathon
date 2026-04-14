const SOSRequest = require('../models/SOSRequest');
const Ambulance = require('../models/Ambulance');

exports.getStats = async (req, res) => {
  try {
    const totalSOS = await SOSRequest.countDocuments();
    const activeAmbulances = await Ambulance.countDocuments({ status: 'busy' });

    res.status(200).json({ 
      success: true, 
      data: {
        totalSOSRequests: totalSOS,
        activeAmbulances,
        averageResponseTime: "4.2 mins" // mock metric
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLive = async (req, res) => {
  try {
    const liveAmbulances = await Ambulance.find({ status: 'busy' });
    const activeEmergencies = await SOSRequest.find({ status: { $ne: 'completed' } });

    res.status(200).json({
      success: true,
      data: { liveAmbulances, activeEmergencies }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
