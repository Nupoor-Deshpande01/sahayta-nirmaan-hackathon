const express = require('express');
const router = express.Router();
const { requestGreenCorridor } = require('../controllers/corridorController');

router.post('/', requestGreenCorridor);

module.exports = router;
