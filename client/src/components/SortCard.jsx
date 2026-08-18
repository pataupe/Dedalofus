import './SortCard.css';

// "10 à 10" -> "10" : certains sorts (ex: Escarre face) ont des dégâts fixes,
// sans fourchette (min === max) — inutile de répéter la même valeur 2 fois.
function formatPlage(min, max) {
  return min === max ? `${min}` : `${min} à ${max}`;
}

// Construit la liste des lignes de dégâts/soin à afficher :
// - `calculs` (tableau, vient de calculerDegats côté serveur, onglet Sorts de la
//   fiche perso) : une ligne par élément/ligne concerné, déjà personnalisée pour
//   le personnage — Bluff/Tourbillon Embrasé (plusieurs éléments à la fois) ou
//   Pile ou Face/Foène/Pelle Aveuglante (2e ligne indépendante) produisent
//   plusieurs entrées, affichées empilées sur UNE seule carte.
// - sans `calculs` (page /sorts publique) : la ligne principale du sort lui-même
//   + ses `lignes_supplementaires` (mêmes sorts multi-lignes, valeurs de base
//   non calculées).
function construireLignes(sort, calculs) {
  if (calculs && calculs.length > 0) {
    return calculs.map((c) => ({
      element: c.element,
      estSoin: c.estSoin,
      degatsMin: c.degatsMin,
      degatsMax: c.degatsMax,
      degatsCritiqueMin: c.degatsCritiqueMin,
      degatsCritiqueMax: c.degatsCritiqueMax,
    }));
  }

  const lignes = [];
  if (sort.degats_min != null || sort.degats_critique_min != null) {
    lignes.push({
      element: sort.element,
      estSoin: sort.est_soin,
      degatsMin: sort.degats_min,
      degatsMax: sort.degats_max,
      degatsCritiqueMin: sort.degats_critique_min,
      degatsCritiqueMax: sort.degats_critique_max,
    });
  }
  for (const supp of sort.lignes_supplementaires || []) {
    if (supp.degats_min == null && supp.degats_critique_min == null) continue;
    lignes.push({
      element: supp.element ?? sort.element,
      estSoin: sort.est_soin,
      degatsMin: supp.degats_min,
      degatsMax: supp.degats_max,
      degatsCritiqueMin: supp.degats_critique_min,
      degatsCritiqueMax: supp.degats_critique_max,
    });
  }
  return lignes;
}

// `calculs` (optionnel, tableau) vient de calculerDegats côté serveur : quand
// fourni, ses valeurs remplacent celles de base pour l'affichage des dégâts/%
// critique (utilisé par l'onglet "Sorts" de la fiche perso). PA/Portée/Lancers
// ne changent jamais, ils ne dépendent pas du personnage. Sans `calculs` (page
// /sorts publique), comportement inchangé : dégâts et % critique de base.
function SortCard({ sort, calculs }) {
  const lignes = construireLignes(sort, calculs);
  // % CC de base (toujours celui du sort) et % CC total (sort + stat du
  // personnage) affichés séparément quand `calculs` est fourni (onglet Sorts) —
  // identique sur toutes les lignes d'un même sort, on prend la 1ère.
  const chanceCritiqueBase = sort.chance_critique;
  const chanceCritiqueTotal = calculs?.[0]?.chanceCritiqueTotal;

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
          {lignes.length > 0 && (
            <div className="carte-sort__degats-groupe">
              {lignes.map((ligne, i) => {
                const aDesDegats = ligne.degatsMin != null && ligne.degatsMax != null;
                const aDesDegatsCritiques = ligne.degatsCritiqueMin != null && ligne.degatsCritiqueMax != null;
                if (!aDesDegats && !aDesDegatsCritiques) return null;
                const libelle = ligne.estSoin ? 'Soin' : 'Dégâts';

                return (
                  <div className="carte-sort__degats" key={i}>
                    <div className="carte-sort__degats-bloc">
                      {aDesDegats ? (
                        <span className="carte-sort__degats-valeur">
                          {formatPlage(ligne.degatsMin, ligne.degatsMax)}
                        </span>
                      ) : (
                        <span className="carte-sort__degats-valeur carte-sort__degats-valeur--vide">—</span>
                      )}
                      <span className="carte-sort__degats-libelle">
                        {libelle} ({ligne.element})
                      </span>
                    </div>
                    {aDesDegatsCritiques && (
                      <div className="carte-sort__degats-bloc carte-sort__degats-bloc--critique">
                        <span className="carte-sort__degats-valeur">
                          {formatPlage(ligne.degatsCritiqueMin, ligne.degatsCritiqueMax)}
                        </span>
                        <span className="carte-sort__degats-libelle">Critique</span>
                      </div>
                    )}
                  </div>
                );
              })}
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
