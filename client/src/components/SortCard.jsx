import './SortCard.css';

// `calcul` (optionnel) vient de calculerDegats côté serveur : quand fourni, ses
// valeurs remplacent celles de base pour l'affichage des dégâts/% critique
// (utilisé par l'onglet "Sorts" de la fiche perso). PA/Portée/Lancers ne
// changent jamais, ils ne dépendent pas du personnage. Sans `calcul` (page
// /sorts publique), comportement inchangé : dégâts et % critique de base.
function SortCard({ sort, calcul }) {
  const element = calcul?.element ?? sort.element;
  const degatsMin = calcul?.degatsMin ?? sort.degats_min;
  const degatsMax = calcul?.degatsMax ?? sort.degats_max;
  const degatsCritiqueMin = calcul?.degatsCritiqueMin ?? sort.degats_critique_min;
  const degatsCritiqueMax = calcul?.degatsCritiqueMax ?? sort.degats_critique_max;
  // % CC de base (toujours celui du sort) et % CC total (sort + stat du
  // personnage) affichés séparément quand `calcul` est fourni (onglet Sorts).
  const chanceCritiqueBase = sort.chance_critique;
  const chanceCritiqueTotal = calcul?.chanceCritiqueTotal;

  const aDesDegats = degatsMin != null && degatsMax != null;
  const aDesDegatsCritiques = degatsCritiqueMin != null && degatsCritiqueMax != null;
  const lancerLigne = sort.portee_diagonale_ligne?.includes('Ligne');
  const lancerDiagonale = sort.portee_diagonale_ligne?.includes('Diagonale');

  return (
    <div className="carte-sort">
      <div className="carte-sort__entete">
        {sort.nom} — {sort.rang_evolution}
      </div>
      <div className="carte-sort__corps">
        <div className="carte-sort__image">
          {sort.image_url ? (
            <img src={sort.image_url} alt="" />
          ) : (
            <div className="carte-sort__image-placeholder" aria-hidden="true" />
          )}
        </div>

        <div className="carte-sort__contenu">
          {(aDesDegats || aDesDegatsCritiques) && (
            <div className="carte-sort__degats">
              {aDesDegats && (
                <div className="carte-sort__degats-bloc">
                  <span className="carte-sort__degats-valeur">
                    {degatsMin} à {degatsMax}
                  </span>
                  <span className="carte-sort__degats-libelle">Dégâts ({element})</span>
                </div>
              )}
              {aDesDegatsCritiques && (
                <div className="carte-sort__degats-bloc carte-sort__degats-bloc--critique">
                  <span className="carte-sort__degats-valeur">
                    {degatsCritiqueMin} à {degatsCritiqueMax}
                  </span>
                  <span className="carte-sort__degats-libelle">Critique</span>
                </div>
              )}
            </div>
          )}

          <ul className="carte-sort__stats">
            <li>
              <span className="carte-sort__stat-icone" aria-hidden="true" />
              {sort.cout_pa} PA
            </li>
            {sort.portee_min != null && sort.portee_max != null && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                PO : {sort.portee_min} - {sort.portee_max}
              </li>
            )}
            {sort.portee_modifiable === 'Oui' && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                PO modifiable
              </li>
            )}
            {lancerLigne && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                Lancer en ligne
              </li>
            )}
            {lancerDiagonale && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                Lancer en diagonale
              </li>
            )}
            {sort.intervalle_relance_cd != null && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                Relance : {sort.intervalle_relance_cd} tours
              </li>
            )}
            {chanceCritiqueBase != null && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                {chanceCritiqueBase}% CC
              </li>
            )}
            {chanceCritiqueTotal != null && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                {chanceCritiqueTotal}% CC Total
              </li>
            )}
            {sort.lancers_par_tour && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                {sort.lancers_par_tour} par tour
              </li>
            )}
            {sort.lancers_par_cible && (
              <li>
                <span className="carte-sort__stat-icone" aria-hidden="true" />
                {sort.lancers_par_cible} par cible
              </li>
            )}
          </ul>

          {sort.description && <p className="carte-sort__description">{sort.description}</p>}
        </div>
      </div>
    </div>
  );
}

export default SortCard;
