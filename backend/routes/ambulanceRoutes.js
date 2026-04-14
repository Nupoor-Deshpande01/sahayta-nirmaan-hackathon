const express = require('express');
const router = express.Router();
const { getNearestAmbulance, updateLocation } = require('../controllers/ambulanceController');

router.get('/nearest', getNearestAmbulance);
router.patch('/update-location', updateLocation);

module.exports = router;
