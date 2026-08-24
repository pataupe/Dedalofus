const express = require('express');
const { listerSorts, obtenirSort } = require('../controllers/sortsController');

const router = express.Router();

router.get('/', listerSorts);
router.get('/:id', obtenirSort);

module.exports = router;
