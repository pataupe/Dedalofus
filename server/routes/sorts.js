const express = require('express');
const { listerSorts } = require('../controllers/sortsController');

const router = express.Router();

router.get('/', listerSorts);

module.exports = router;
