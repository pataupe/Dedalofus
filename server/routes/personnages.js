const express = require('express');
const {
  creerPersonnage,
  listerPersonnages,
  obtenirPersonnage,
  equiperCube,
  equiperSort,
  equiperBreloque,
  equiperBreuvage,
  equiperCubeAuto,
  equiperSortAuto,
  equiperBreloqueAuto,
  equiperBreuvageAuto,
  sauvegarderParcho,
  sauvegarderBoostBreloque,
  renommerPersonnage,
  desequiperTout,
  supprimerPersonnage,
} = require('../controllers/personnagesController');
const verifierToken = require('../middleware/verifierToken');

const router = express.Router();

router.post('/', verifierToken, creerPersonnage);
router.get('/', verifierToken, listerPersonnages);
router.get('/:id', verifierToken, obtenirPersonnage);
router.put('/:id/nom', verifierToken, renommerPersonnage);
router.put('/:id/desequiper-tout', verifierToken, desequiperTout);
router.delete('/:id', verifierToken, supprimerPersonnage);
router.put('/:id/parcho', verifierToken, sauvegarderParcho);
router.put('/:id/cubes', verifierToken, equiperCubeAuto);
router.put('/:id/sorts', verifierToken, equiperSortAuto);
router.put('/:id/breloques', verifierToken, equiperBreloqueAuto);
router.put('/:id/breuvages', verifierToken, equiperBreuvageAuto);
router.put('/:id/cubes/:emplacement', verifierToken, equiperCube);
router.put('/:id/sorts/:emplacement', verifierToken, equiperSort);
router.put('/:id/breloques/:emplacement', verifierToken, equiperBreloque);
router.put('/:id/breuvages/:emplacement', verifierToken, equiperBreuvage);
router.put('/:id/breloques/:emplacement/boost', verifierToken, sauvegarderBoostBreloque);

module.exports = router;
