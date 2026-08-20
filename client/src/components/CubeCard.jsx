import { couleurElement } from '../constants/elements';
import { trouverEnsemblesCube } from '../utils/ensembles';
import EnsembleLien from './EnsembleLien';
import './CubeCard.css';

// Le libellé des stats en % commence déjà par "%" (ex: "% Résistance Feu") :
// pas d'espace entre la valeur et le libellé dans ce cas, pour avoir "6% Résistance Feu".
function formaterStat(stat) {
  const separateur = stat.label.startsWith('%') ? '' : ' ';
  return `${stat.value}${separateur}${stat.label}`;
}

// `image_url` n'est pas encore renseigné en base (V1 sans vraies images) : en
// attendant, on affiche un placeholder coloré par élément à la place de la
// vraie image du cube.
function CubeCard({ cube }) {
  const couleur = couleurElement(cube.element);

  return (
    <div className="carte-cube" style={{ '--couleur-cube': couleur }}>
      <div className="carte-cube__entete">
        {cube.nom} {cube.element} {cube.numero} — {cube.rang}
      </div>
      <div className="carte-cube__corps">
        <div className="carte-cube__image">
          {cube.image_url ? (
            <img src={cube.image_url} alt={cube.nom} />
          ) : (
            <div className="carte-cube__placeholder" aria-hidden="true" />
          )}
        </div>
        <ul className="carte-cube__stats">
          {(cube.stats || []).map((stat) => (
            <li key={stat.key}>
              {/* Emplacement réservé pour la future icône de stat (une par clé, ex: PA, Vitalité...) */}
              <span className="carte-cube__stat-icone" aria-hidden="true" />
              {formaterStat(stat)}
            </li>
          ))}
        </ul>
      </div>
      <EnsembleLien ensembles={trouverEnsemblesCube(cube.element)} />
    </div>
  );
}

export default CubeCard;
