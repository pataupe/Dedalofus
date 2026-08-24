import { CHEMINS_ICONES, nomIcone } from '../constants/iconesStats';
import { IMAGE_PAR_STAT } from '../constants/imagesStats';

// `cle` est la clé de stat — priorité à la vraie icône fournie par le porteur
// de projet (IMAGE_PAR_STAT) si elle existe pour cette clé ; sinon repli sur
// le SVG partagé (résolu via nomIcone). `icone` permet de forcer directement
// un nom d'icône SVG (ex: cartes d'objets qui connaissent déjà leur icône sans
// passer par une clé de calcul.js, ou concepts sans image dédiée comme les
// multiplicateurs/indicatifs d'ensemble).
function IconeStat({ cle, icone, couleur = 'currentColor', taille = 16 }) {
  const image = cle && IMAGE_PAR_STAT[cle];
  if (image) {
    return (
      <img
        src={image}
        alt=""
        aria-hidden="true"
        width={taille}
        height={taille}
        style={{ width: taille, height: taille, objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }

  const nom = icone || nomIcone(cle);
  const chemin = CHEMINS_ICONES[nom] || CHEMINS_ICONES.etincelle;

  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke={couleur}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={chemin} />
    </svg>
  );
}

export default IconeStat;
