import { useState } from 'react';
import { sauvegarderBoostBreloque } from '../api/personnages';
import './OngletBoosts.css';

// Affiche/interpole une valeur numérique de boost avec son préfixe/suffixe
// d'origine (ex: préfixe "dommages finaux x" + valeur 1.3, ou valeur 10 +
// suffixe " soins") — voir server/logic/boosts.js pour la construction.
function texteValeur({ prefixe, valeur, suffixe }) {
  return `${prefixe}${valeur}${suffixe}`;
}

function ToggleBoost({ boost, disabled, onChange }) {
  return (
    <button
      type="button"
      className={`boost-toggle ${boost.actif ? 'boost-toggle--actif' : ''}`}
      onClick={() => onChange(boost.actif ? 0 : 1)}
      disabled={disabled}
      aria-pressed={boost.actif}
      aria-label={boost.actif ? 'Désactiver ce bonus' : 'Activer ce bonus'}
    >
      <span className="boost-toggle__curseur" />
    </button>
  );
}

function RangeBoost({ boost, disabled, onChange }) {
  return (
    <div className="boost-range">
      <input
        type="range"
        min={boost.min}
        max={boost.max}
        step={boost.increment || 1}
        value={boost.valeur}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="boost-range__valeur">{texteValeur(boost)}</span>
    </div>
  );
}

function AccumulateurBoost({ boost, disabled, onChange }) {
  const pas = boost.increment || 1;
  return (
    <div className="boost-accumulateur">
      <button
        type="button"
        onClick={() => onChange(Math.max(boost.min, Math.round((boost.valeur - pas) * 1000) / 1000))}
        disabled={disabled || boost.valeur <= boost.min}
        aria-label="Diminuer"
      >
        −
      </button>
      <span className="boost-accumulateur__valeur">{texteValeur(boost)}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(boost.max, Math.round((boost.valeur + pas) * 1000) / 1000))}
        disabled={disabled || boost.valeur >= boost.max}
        aria-label="Augmenter"
      >
        +
      </button>
    </div>
  );
}

function LigneBoost({ emplacement, breloque, token, personnageId, onSauvegarde, lectureSeule }) {
  const [enCours, setEnCours] = useState(false);
  const { boost } = breloque;

  async function changer(nouvelleValeur) {
    setEnCours(true);
    try {
      await sauvegarderBoostBreloque(token, personnageId, emplacement, nouvelleValeur);
      // Recharge la fiche perso depuis le serveur plutôt qu'une mise à jour
      // locale optimiste : les dégâts calculés (personnage.degats) dépendent
      // aussi de ce boost, même logique que le Parcho (onParchoSauvegarde),
      // pas de duplication du calcul côté client.
      await onSauvegarde?.();
    } catch {
      // Erreur silencieuse volontaire : bornage déjà fait côté client (mêmes
      // min/max que le serveur), un échec ici n'a en pratique pas de cause
      // utilisateur à afficher (réseau/session expirée).
    } finally {
      setEnCours(false);
    }
  }

  return (
    <li className="onglet-boosts__ligne">
      <div className="onglet-boosts__image">
        {breloque.image_url ? (
          <img src={breloque.image_url} alt="" />
        ) : (
          <div className="onglet-boosts__placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="onglet-boosts__info">
        <span className="onglet-boosts__nom">
          {breloque.nom} — {breloque.rang}
        </span>
        <span className="onglet-boosts__effet">{breloque.effet}</span>
      </div>
      <div className="onglet-boosts__controle">
        {lectureSeule ? (
          <span className="onglet-boosts__lecture">
            {boost.type === 'toggle' ? (boost.actif ? boost.texteActif : 'Désactivé') : texteValeur(boost)}
          </span>
        ) : boost.type === 'toggle' ? (
          <ToggleBoost boost={boost} disabled={enCours} onChange={changer} />
        ) : boost.type === 'accumulateur' ? (
          <AccumulateurBoost boost={boost} disabled={enCours} onChange={changer} />
        ) : (
          <RangeBoost boost={boost} disabled={enCours} onChange={changer} />
        )}
      </div>
    </li>
  );
}

// Une ligne par breloque équipée ayant un bonus conditionnel (Breloque.type_input
// non nul) — les breloques sans bonus conditionnel (l'immense majorité) n'ont
// rien à configurer et n'apparaissent pas ici.
function OngletBoosts({ breloques, token, personnageId, onSauvegarde, lectureSeule }) {
  const avecBoost = breloques.filter(({ breloque }) => breloque?.boost);

  if (avecBoost.length === 0) {
    return (
      <p className="onglet-boosts__vide">
        Aucune breloque équipée avec un bonus conditionnel pour l'instant.
      </p>
    );
  }

  return (
    <ul className="onglet-boosts">
      {avecBoost.map(({ emplacement, breloque }) => (
        <LigneBoost
          key={emplacement}
          emplacement={emplacement}
          breloque={breloque}
          token={token}
          personnageId={personnageId}
          onSauvegarde={onSauvegarde}
          lectureSeule={lectureSeule}
        />
      ))}
    </ul>
  );
}

export default OngletBoosts;
