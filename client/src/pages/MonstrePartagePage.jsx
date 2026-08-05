import { Navigate, useParams } from 'react-router-dom';
import monstresData from '../data/monstres.json';

// Point d'entrée du lien de partage (ex: dedalofus.fr/monstre/hululord). Les
// robots (Discord...) ne passent jamais par ici : ils sont interceptés côté
// serveur (server/routes/partageMonstre.js) avant même que le SPA se charge.
// Une vraie personne qui clique atterrit ici et est renvoyée vers la page
// liste, profondeur et modale déjà ouvertes sur le bon monstre.
function trouverProfondeur(slug) {
  for (const profondeur of monstresData) {
    for (const biome of profondeur.biomes) {
      for (const famille of biome.familles) {
        if (famille.monstres.some((m) => m.slug === slug)) return profondeur.cle;
      }
    }
  }
  return null;
}

function MonstrePartagePage() {
  const { slug } = useParams();
  const cle = trouverProfondeur(slug);

  if (!cle) return <Navigate to="/monstres" replace />;
  return <Navigate to={`/monstres?profondeur=${cle}&monstre=${slug}`} replace />;
}

export default MonstrePartagePage;
