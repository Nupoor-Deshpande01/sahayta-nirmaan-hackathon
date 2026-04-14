const express = require('express');
const router = express.Router();
const { intelligentDispatch } = require('../controllers/dispatchController');

router.post('/', intelligentDispatch);

module.exports = router;
