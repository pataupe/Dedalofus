const express = require('express');
const { listerTousPersonnages, obtenirPersonnageAdmin } = require('../controllers/adminController');
const verifierToken = require('../middleware/verifierToken');
const verifierAdmin = require('../middleware/verifierAdmin');

const router = express.Router();

// Toutes les routes de ce routeur sont réservées aux admins.
router.use(verifierToken, verifierAdmin);

router.get('/personnages', listerTousPersonnages);
router.get('/personnages/:id', obtenirPersonnageAdmin);

module.exports = router;
