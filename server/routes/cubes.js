const express = require('express');
const { listerCubes, obtenirCube } = require('../controllers/cubesController');

const router = express.Router();

router.get('/', listerCubes);
router.get('/:id', obtenirCube);

module.exports = router;
