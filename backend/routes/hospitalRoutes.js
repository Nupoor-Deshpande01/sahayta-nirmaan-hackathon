const express = require('express');
const router = express.Router();
const { getNearestHospitals, getHospitalById } = require('../controllers/hospitalController');

router.get('/nearest', getNearestHospitals);
router.get('/:id', getHospitalById);

module.exports = router;
