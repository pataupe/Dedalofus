import { useState } from 'react';
import { copierTexte } from '../utils/presse-papier';
import TexteMonstre from './TexteMonstre';
import './MonstreDetail.css';

function MonstreDetail({ monstre, famille }) {
  const [lienCopie, setLienCopie] = useState(false);
  const [erreurPartage, setErreurPartage] = useState(null);
  const [passifOuvert, setPassifOuvert] = useState(false);

  function partager() {
    setErreurPartage(null);
    const url = `${window.location.origin}/monstre/${monstre.slug}`;
    copierTexte(url).then(
      () => {
        setLienCopie(true);
        setTimeout(() => setLienCopie(false), 2000);
      },
      () => setErreurPartage('Impossible de copier le lien (accès au presse-papier refusé par le navigateur).')
    );
  }

  return (
    <div className="detail-monstre">
      <div className="detail-monstre__entete">
        <div className="detail-monstre__image">
          {monstre.image ? (
            <img src={monstre.image} alt={monstre.nom} />
          ) : (
            <div className="detail-monstre__placeholder" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="detail-monstre__famille">{famille.nom}</p>
          <h2 className="detail-monstre__nom">
            {monstre.boss && <span className="detail-monstre__badge">BOSS</span>}
            {monstre.nom}
          </h2>
        </div>
      </div>

      <button type="button" className="detail-monstre__partage" onClick={partager}>
        {!lienCopie && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
            <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
          </svg>
        )}
        {lienCopie ? 'Lien copié !' : 'Copier le lien de cette fiche'}
      </button>
      {erreurPartage && <p className="detail-monstre__erreur-partage">{erreurPartage}</p>}

      {famille.passif && (
        <div className="detail-monstre__bloc detail-monstre__bloc--passif">
          <button
            type="button"
            className="detail-monstre__bloc-declencheur"
            onClick={() => setPassifOuvert((o) => !o)}
            aria-expanded={passifOuvert}
          >
            <strong>Passif de famille</strong>
            <span className="detail-monstre__bloc-indice">
              {passifOuvert ? 'Masquer' : 'Afficher'}
              <span className={`detail-monstre__bloc-fleche ${passifOuvert ? 'detail-monstre__bloc-fleche--ouvert' : ''}`}>
                ▾
              </span>
            </span>
          </button>
          <div className={`detail-monstre__bloc-repli ${passifOuvert ? 'ouvert' : ''}`}>
            <div className="detail-monstre__bloc-repli-interieur">
              <TexteMonstre texte={famille.passif} />
            </div>
          </div>
        </div>
      )}

      {monstre.paragraphes.map((paragraphe, index) => {
        if (paragraphe.type === 'mecanique') {
          return (
            <div key={index} className="detail-monstre__bloc detail-monstre__bloc--mecanique">
              <strong>Mécanique</strong>
              <TexteMonstre texte={paragraphe.texte} />
            </div>
          );
        }
        if (paragraphe.type === 'conseils') {
          return (
            <div key={index} className="detail-monstre__bloc detail-monstre__bloc--conseils">
              <strong>Conseils</strong>
              <TexteMonstre texte={paragraphe.texte} />
            </div>
          );
        }
        return (
          <div key={index} className="detail-monstre__texte">
            <TexteMonstre texte={paragraphe.texte} />
          </div>
        );
      })}
    </div>
  );
}

export default MonstreDetail;
