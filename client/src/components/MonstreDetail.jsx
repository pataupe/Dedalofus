import { useState } from 'react';
import './MonstreDetail.css';

function MonstreDetail({ monstre, famille }) {
  const [lienCopie, setLienCopie] = useState(false);
  const [erreurPartage, setErreurPartage] = useState(null);

  function partager() {
    setErreurPartage(null);
    const url = `${window.location.origin}/monstre/${monstre.slug}`;
    navigator.clipboard.writeText(url).then(
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
        {lienCopie ? 'Lien copié !' : '🔗 Partager cette fiche'}
      </button>
      {erreurPartage && <p className="detail-monstre__erreur-partage">{erreurPartage}</p>}

      {famille.passif && (
        <div className="detail-monstre__bloc detail-monstre__bloc--passif">
          <strong>Passif de famille</strong>
          <p>{famille.passif}</p>
        </div>
      )}

      {monstre.paragraphes.map((paragraphe, index) => {
        if (paragraphe.type === 'mecanique') {
          return (
            <div key={index} className="detail-monstre__bloc detail-monstre__bloc--mecanique">
              <strong>Mécanique</strong>
              <p>{paragraphe.texte}</p>
            </div>
          );
        }
        if (paragraphe.type === 'conseils') {
          return (
            <div key={index} className="detail-monstre__bloc detail-monstre__bloc--conseils">
              <strong>Conseils</strong>
              <p>{paragraphe.texte}</p>
            </div>
          );
        }
        return (
          <p key={index} className="detail-monstre__texte">
            {paragraphe.texte}
          </p>
        );
      })}
    </div>
  );
}

export default MonstreDetail;
