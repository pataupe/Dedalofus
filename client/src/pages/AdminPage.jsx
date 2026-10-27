import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listerTousPersonnages } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { tempsRelatif } from '../utils/temps';
import './AdminPage.css';

// Page réservée aux administrateurs (accessible uniquement en tapant /admin,
// aucun lien dans le menu). Le vrai contrôle d'accès est côté serveur
// (verifierAdmin) : cette page ne fait qu'afficher ce que l'API accepte de renvoyer.
function AdminPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [personnages, setPersonnages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [masquerVides, setMasquerVides] = useState(false);

  useEffect(() => {
    if (!session) navigate('/connexion', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (!session) return;
    listerTousPersonnages(session.token)
      .then(setPersonnages)
      .catch((err) => setErreur(err.status === 403 ? 'Accès réservé aux administrateurs.' : err.message))
      .finally(() => setChargement(false));
  }, [session]);

  const affiches = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return personnages.filter((p) => {
      const total = p.nb_cubes + p.nb_sorts + p.nb_breloques + p.nb_breuvages;
      if (masquerVides && total === 0) return false;
      if (!terme) return true;
      return p.nom.toLowerCase().includes(terme) || p.pseudo.toLowerCase().includes(terme);
    });
  }, [personnages, recherche, masquerVides]);

  if (!session) return null;

  return (
    <div className="page-admin">
      <h1>Administration</h1>

      {erreur && <p className="page-admin__erreur">{erreur}</p>}
      {chargement && <p>Chargement...</p>}

      {!chargement && !erreur && (
        <>
          <div className="page-admin__filtres">
            <input
              type="search"
              placeholder="Rechercher un personnage ou un joueur"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            <label>
              <input type="checkbox" checked={masquerVides} onChange={(e) => setMasquerVides(e.target.checked)} />
              Masquer les stuffs vides
            </label>
          </div>

          <p className="page-admin__compteur">
            {affiches.length} personnage{affiches.length > 1 ? 's' : ''} sur {personnages.length}
          </p>

          <ul className="page-admin__liste">
            {affiches.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/personnage/${p.id}`} className="page-admin__ligne">
                  <span className="page-admin__nom">{p.nom}</span>
                  <span className="page-admin__joueur">{p.pseudo}</span>
                  <span className="page-admin__items">
                    {p.nb_cubes} cubes · {p.nb_sorts} sorts · {p.nb_breloques} breloques · {p.nb_breuvages} breuvages
                  </span>
                  <span className="page-admin__meta">
                    modifié {tempsRelatif(p.mis_a_jour_le)} · créé le {new Date(p.cree_le).toLocaleDateString('fr-FR')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default AdminPage;
