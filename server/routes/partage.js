const express = require('express');
const { obtenirPersonnagePartage } = require('../controllers/personnagesController');

const router = express.Router();

// Aucun verifierToken ici : route publique, consultable sans compte.
router.get('/:lienPartage', obtenirPersonnagePartage);

module.exports = router;
