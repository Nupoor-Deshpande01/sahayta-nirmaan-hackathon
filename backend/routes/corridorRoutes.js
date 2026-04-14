const express = require('express');
const router = express.Router();
const { requestGreenCorridor, triggerGreenLight } = require('../controllers/corridorController');

router.post('/', requestGreenCorridor);
// Note: If mounted at /api/traffic in server.js, this will be /green-light
router.post('/green-light', triggerGreenLight);

module.exports = router;
