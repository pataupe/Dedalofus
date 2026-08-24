import { CHEMINS_ICONES, nomIcone } from '../constants/iconesStats';

// Rendu SVG partagé pour une icône de stat — remplace les emoji utilisés
// jusqu'ici. `cle` est la clé de stat (résolue via nomIcone) ; `icone` permet
// de forcer directement un nom d'icône (ex: cartes d'objets qui connaissent
// déjà leur icône sans passer par une clé de calcul.js).
function IconeStat({ cle, icone, couleur = 'currentColor', taille = 16 }) {
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
