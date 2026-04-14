const express = require('express');
const router = express.Router();
const { getStats, getLive } = require('../controllers/dashboardController');

router.get('/stats', getStats);
router.get('/live', getLive);

module.exports = router;
