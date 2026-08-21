const express = require('express');
const { listerBreuvages } = require('../controllers/breuvagesController');

const router = express.Router();

router.get('/', listerBreuvages);

module.exports = router;
