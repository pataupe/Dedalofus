const express = require('express');
const {
  creerPersonnage,
  listerPersonnages,
  obtenirPersonnage,
  equiperCube,
  equiperSort,
  equiperBreloque,
  equiperCubeAuto,
  equiperSortAuto,
  equiperBreloqueAuto,
  sauvegarderParcho,
  sauvegarderBoostBreloque,
} = require('../controllers/personnagesController');
const verifierToken = require('../middleware/verifierToken');

const router = express.Router();

router.post('/', verifierToken, creerPersonnage);
router.get('/', verifierToken, listerPersonnages);
router.get('/:id', verifierToken, obtenirPersonnage);
router.put('/:id/parcho', verifierToken, sauvegarderParcho);
router.put('/:id/cubes', verifierToken, equiperCubeAuto);
router.put('/:id/sorts', verifierToken, equiperSortAuto);
router.put('/:id/breloques', verifierToken, equiperBreloqueAuto);
router.put('/:id/cubes/:emplacement', verifierToken, equiperCube);
router.put('/:id/sorts/:emplacement', verifierToken, equiperSort);
router.put('/:id/breloques/:emplacement', verifierToken, equiperBreloque);
router.put('/:id/breloques/:emplacement/boost', verifierToken, sauvegarderBoostBreloque);

module.exports = router;
