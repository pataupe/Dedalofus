const express = require('express');
const { listerBreloques } = require('../controllers/breloquesController');

const router = express.Router();

router.get('/', listerBreloques);

module.exports = router;
