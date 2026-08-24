const express = require('express');
const { listerBreloques, obtenirBreloque } = require('../controllers/breloquesController');

const router = express.Router();

router.get('/', listerBreloques);
router.get('/:id', obtenirBreloque);

module.exports = router;
