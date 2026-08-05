import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import monstresData from '../data/monstres.json';
import MonstreCard from '../components/MonstreCard';
import Modal from '../components/Modal';
import MonstreDetail from '../components/MonstreDetail';
import './MonstreListPage.css';

const PROFONDEURS = monstresData.map(({ cle, titre }) => ({ cle, titre }));

function MonstreListPage() {
  // L'URL (?profondeur=&famille=&monstre=) est la source de vérité, pas un
  // state React synchronisé après coup : ça permet au bouton "Liste des
  // monstres" du header (ou au lien de partage /monstre/:slug) de sauter
  // directement sur une profondeur/un monstre précis, même si la page est
  // déjà montée, sans passer par un effet qui déclencherait un setState
  // après-coup — et ça rend l'URL partageable/rechargeable telle quelle.
  const [searchParams, setSearchParams] = useSearchParams();

  const parametreProfondeur = searchParams.get('profondeur');
  const profondeurActive = PROFONDEURS.some((p) => p.cle === parametreProfondeur)
    ? parametreProfondeur
    : PROFONDEURS[0].cle;
  const familleActive = searchParams.get('famille');
  const slugSelection = searchParams.get('monstre');

  const profondeur = monstresData.find((p) => p.cle === profondeurActive);

  const toutesLesFamilles = useMemo(
    () => profondeur.biomes.flatMap((biome) => biome.familles.map((famille) => famille.nom)),
    [profondeur]
  );

  const selection = useMemo(() => {
    if (!slugSelection) return null;
    const paires = profondeur.biomes.flatMap((biome) =>
      biome.familles.map((famille) => ({ famille, monstre: famille.monstres.find((m) => m.slug === slugSelection) }))
    );
    const trouvee = paires.find((paire) => paire.monstre);
    return trouvee ? { monstre: trouvee.monstre, famille: trouvee.famille } : null;
  }, [profondeur, slugSelection]);

  function choisirProfondeur(cle) {
    setSearchParams({ profondeur: cle });
  }

  // Une seule famille active à la fois (reclique dessus pour revenir à "tout
  // afficher"), contrairement aux filtres multi-sélection des autres pages.
  function choisirFamille(nom) {
    setSearchParams(familleActive === nom ? { profondeur: profondeurActive } : { profondeur: profondeurActive, famille: nom });
  }

  function ouvrirMonstre(monstre) {
    const params = new URLSearchParams(searchParams);
    params.set('monstre', monstre.slug);
    setSearchParams(params);
  }

  function fermerModale() {
    const params = new URLSearchParams(searchParams);
    params.delete('monstre');
    setSearchParams(params);
  }

  return (
    <div className="page-monstres">
      <h1>Monstres du Dédale</h1>
      <p className="page-monstres__intro">
        Choisis une profondeur, puis affine par famille si besoin. Clique sur un monstre pour voir le
        détail de ses attaques.
      </p>

      <div className="page-monstres__profondeurs">
        {PROFONDEURS.map(({ cle, titre }) => (
          <button
            key={cle}
            type="button"
            title={titre}
            className={profondeurActive === cle ? 'actif' : ''}
            onClick={() => choisirProfondeur(cle)}
          >
            {cle}
          </button>
        ))}
      </div>

      {toutesLesFamilles.length > 1 && (
        <div className="page-monstres__familles">
          {toutesLesFamilles.map((nom) => (
            <button
              key={nom}
              type="button"
              className={familleActive === nom ? 'actif' : ''}
              onClick={() => choisirFamille(nom)}
            >
              {nom}
            </button>
          ))}
        </div>
      )}

      {profondeur.biomes.map((biome) => {
        const familles = biome.familles.filter(
          (famille) => !familleActive || familleActive === famille.nom
        );
        if (familles.length === 0) return null;

        return (
          <section key={biome.nom} className="page-monstres__biome">
            <h2>{biome.nom}</h2>
            {familles.map((famille) => (
              <div key={famille.nom} className="page-monstres__groupe-famille">
                <h3>{famille.nom}</h3>
                {famille.passif && <p className="page-monstres__passif">{famille.passif}</p>}
                <div className="page-monstres__grille">
                  {famille.monstres.map((monstre) => (
                    <MonstreCard key={monstre.slug} monstre={monstre} onClick={() => ouvrirMonstre(monstre)} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      {selection && (
        <Modal large onClose={fermerModale}>
          <MonstreDetail monstre={selection.monstre} famille={selection.famille} />
        </Modal>
      )}
    </div>
  );
}

export default MonstreListPage;
