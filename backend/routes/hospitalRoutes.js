const express = require('express');
const router = express.Router();
const { getNearestHospitals } = require('../controllers/hospitalController');

router.get('/nearest', getNearestHospitals);

module.exports = router;
