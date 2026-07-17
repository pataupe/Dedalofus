const express = require('express');
const { inscription, connexion } = require('../controllers/authController');

const router = express.Router();

router.post('/inscription', inscription);
router.post('/connexion', connexion);

module.exports = router;
