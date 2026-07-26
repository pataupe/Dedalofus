import './PageLegale.css';

function PolitiqueConfidentialitePage() {
  return (
    <div className="page-legale">
      <h1>Politique de confidentialité</h1>

      <section>
        <h2>Responsable du traitement</h2>
        <p>
          L'éditeur de Dédalofus (dedalofus.fr), personne physique exerçant à titre non professionnel (voir les{' '}
          <a href="/mentions-legales">mentions légales</a>), est responsable du traitement des données décrites
          ci-dessous.
        </p>
      </section>

      <section>
        <h2>Données collectées et finalités</h2>
        <ul>
          <li>
            <strong>Email et pseudo</strong> (à l'inscription) : identifier ton compte et te permettre de te
            reconnecter.
          </li>
          <li>
            <strong>Mot de passe</strong> : jamais stocké en clair, uniquement sous forme hachée (bcrypt) — même
            l'éditeur ne peut pas le consulter.
          </li>
          <li>
            <strong>Personnages et stuffs</strong> (cubes/sorts/breloques équipés, Parcho) que tu crées : sauvegarder
            et afficher ta progression.
          </li>
          <li>
            <strong>Lien de partage</strong> : un identifiant unique généré pour chaque personnage, qui permet à
            quiconque le possède de consulter ce stuff en lecture seule (nom du personnage, équipement, stats). Il
            n'expose ni ton email, ni ton pseudo, ni ton mot de passe.
          </li>
        </ul>
        <p>
          Aucune autre donnée n'est collectée : pas de suivi publicitaire, pas de revente à des tiers, pas
          d'exploitation à des fins commerciales.
        </p>
      </section>

      <section>
        <h2>Base légale</h2>
        <p>
          Le traitement de ces données repose sur l'exécution du service que tu demandes en créant un compte
          (sauvegarder et retrouver tes personnages) — il n'y a pas d'autre finalité.
        </p>
      </section>

      <section>
        <h2>Durée de conservation</h2>
        <p>
          Tes données sont conservées tant que ton compte existe. Si tu souhaites le supprimer, contacte l'éditeur
          (voir « Exercer tes droits » ci-dessous) : le compte et l'ensemble des données associées (personnages,
          stuffs) sont alors effacés.
        </p>
      </section>

      <section>
        <h2>Destinataires et hébergement</h2>
        <p>
          Tes données ne sont communiquées à aucun tiers. Elles sont stockées sur le serveur qui héberge le site,
          chez OVH SAS (France) — voir les <a href="/mentions-legales">mentions légales</a> pour ses coordonnées.
          Aucune donnée n'est transférée en dehors de l'Union européenne.
        </p>
      </section>

      <section>
        <h2>Sécurité</h2>
        <p>
          Le site est servi en HTTPS (connexion chiffrée), les mots de passe sont hachés (jamais stockés en clair),
          et l'accès au serveur est restreint par clé SSH. Aucun système n'étant infaillible, contacte l'éditeur si
          tu repères une faille ou un comportement suspect.
        </p>
      </section>

      <section>
        <h2>Cookies et stockage local</h2>
        <p>
          Ce site n'utilise aucun cookie publicitaire ni outil de mesure d'audience (pas de Google Analytics ni
          équivalent). Seul ton jeton de connexion est conservé dans le stockage local de ton navigateur, strictement
          nécessaire pour rester connecté à ton compte — il est supprimé quand tu te déconnectes.
        </p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>Conformément au RGPD, tu disposes des droits suivants sur tes données :</p>
        <ul>
          <li>Droit d'accès : savoir quelles données te concernant sont conservées</li>
          <li>Droit de rectification : corriger une donnée inexacte</li>
          <li>Droit à l'effacement : demander la suppression de ton compte et de tes données</li>
          <li>Droit à la portabilité : récupérer tes données dans un format lisible</li>
          <li>Droit d'opposition et de limitation du traitement</li>
        </ul>
        <p>
          <strong>Exercer tes droits :</strong> contacte l'éditeur via le{' '}
          <a href="https://discord.gg/WDxuStWyh" target="_blank" rel="noreferrer">
            serveur Discord
          </a>
          . Tu peux aussi introduire une réclamation auprès de la{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
            CNIL
          </a>{' '}
          si tu estimes que tes droits ne sont pas respectés.
        </p>
      </section>

      <section>
        <h2>Modifications</h2>
        <p>
          Cette politique peut évoluer (nouvelle fonctionnalité, évolution de la réglementation). La date de
          dernière mise à jour est indiquée ci-dessous.
        </p>
        <p>Dernière mise à jour : juillet 2026.</p>
      </section>
    </div>
  );
}

export default PolitiqueConfidentialitePage;
