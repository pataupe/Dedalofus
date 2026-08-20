import { useEffect } from 'react';
import './Modal.css';

function Modal({ onClose, children, large = false }) {
  useEffect(() => {
    function surEchap(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', surEchap);
    return () => window.removeEventListener('keydown', surEchap);
  }, [onClose]);

  // Toujours stopper la propagation ET le comportement par défaut en fermant, quel
  // que soit l'élément cliqué (fond, croix) : quand la modale est montée à
  // l'intérieur d'un <Link> (ex: EnsembleLien dans une CubeCard, elle-même dans un
  // <Link> vers /cubes/:id sur CubeListPage — Modal.jsx ne rend pas dans un
  // portail), un clic non protégé déclenche la navigation du <Link> après la
  // fermeture. stopPropagation() seul empêchait le onClick du <Link> de
  // react-router de s'exécuter (qui appelle lui-même preventDefault() avant de
  // naviguer en client-side) — sans lui, plus rien n'empêchait le comportement
  // par défaut natif du <a> (navigation complète, pas juste du routing React), le
  // bug persistait sous une autre forme. preventDefault() explicite ici règle
  // les deux à la fois, peu importe qu'un <Link> ancêtre existe ou non (aucun
  // effet indésirable sur un <div>, qui n'a pas d'action par défaut).
  function fermer(e) {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }

  return (
    <div className="modale__fond" onClick={fermer}>
      <div
        className={`modale__contenu ${large ? 'modale__contenu--large' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modale__fermer" onClick={fermer} aria-label="Fermer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <div className="modale__corps">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
