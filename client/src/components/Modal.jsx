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

  return (
    <div className="modale__fond" onClick={onClose}>
      <div
        className={`modale__contenu ${large ? 'modale__contenu--large' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modale__fermer" onClick={onClose} aria-label="Fermer">
          ×
        </button>
        <div className="modale__corps">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
