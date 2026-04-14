const { calculateETA } = require('../services/mapsService');

exports.requestGreenCorridor = async (req, res) => {
  try {
    const { source, destination } = req.body;

    // Use Maps Service to calculate route with green corridor logic
    const routeInfo = calculateETA(source, destination, true);

    // Broadcast green corridor active so traffic signals (mock UI) know to turn green
    if (req.io) {
      req.io.emit('green_corridor_active', { source, destination, routeInfo });
    }

    res.status(200).json({ success: true, data: routeInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
