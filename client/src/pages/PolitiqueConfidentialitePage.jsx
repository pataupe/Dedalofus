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
            <strong>Email et pseudo</strong> (à l'inscription) : identifier votre compte et vous permettre de vous
            reconnecter.
          </li>
          <li>
            <strong>Mot de passe</strong> : stocké uniquement sous forme de hachage bcrypt, jamais en clair. Ce
            hachage est irréversible : il ne permet de retrouver le mot de passe d'origine sous aucune forme.
          </li>
          <li>
            <strong>Personnages et stuffs</strong> (cubes/sorts/breloques équipés, Parcho) que vous créez :
            sauvegarder et afficher votre progression.
          </li>
          <li>
            <strong>Lien de partage</strong> : un identifiant unique généré pour chaque personnage, permettant à
            toute personne qui le possède de consulter ce stuff en lecture seule (nom du personnage, équipement,
            statistiques). Il ne donne accès ni à votre email, ni à votre pseudo, ni à votre mot de passe.
          </li>
          <li>
            <strong>Journaux techniques du serveur</strong> : comme tout site web, l'hébergeur enregistre
            automatiquement certaines informations de connexion (adresse IP, date et heure, page consultée) pour
            l'ensemble des visiteurs, y compris sans compte. Ces journaux servent uniquement à assurer la sécurité
            et le bon fonctionnement du site (détection d'abus, diagnostic technique).
          </li>
          <li>
            <strong>Statistiques de fréquentation</strong> : ce site utilise Google Analytics pour mesurer sa
            fréquentation (nombre de visites, pages consultées, type d'appareil). Ces données de navigation sont
            transmises à Google (voir « Destinataires et hébergement » ci-dessous).
          </li>
        </ul>
        <p>
          Aucune autre donnée n'est collectée : pas de revente à des tiers, pas d'exploitation à des fins
          commerciales.
        </p>
      </section>

      <section>
        <h2>Base légale</h2>
        <p>
          Le traitement des données de compte (email, pseudo, personnages, stuffs) repose sur l'exécution du
          service que vous demandez en créant un compte : sauvegarder et retrouver vos personnages. Le traitement
          des journaux techniques et des statistiques de fréquentation repose sur l'intérêt légitime de l'éditeur à
          assurer la sécurité, le bon fonctionnement et le suivi du site.
        </p>
      </section>

      <section>
        <h2>Durée de conservation</h2>
        <p>
          Les données de votre compte sont conservées tant que celui-ci existe. Si vous souhaitez le supprimer,
          contactez l'éditeur (voir « Exercer vos droits » ci-dessous) : le compte et l'ensemble des données
          associées (personnages, stuffs) sont alors effacés. Les journaux techniques sont conservés pour une
          durée limitée à des fins de sécurité, puis supprimés automatiquement.
        </p>
      </section>

      <section>
        <h2>Destinataires et hébergement</h2>
        <p>
          Vos données de compte (email, pseudo, personnages, stuffs) ne sont communiquées à aucun tiers. Elles sont
          stockées sur le serveur qui héberge le site, chez OVH SAS (France) : voir les{' '}
          <a href="/mentions-legales">mentions légales</a> pour ses coordonnées.
        </p>
        <p>
          Les données de navigation liées aux statistiques de fréquentation (voir ci-dessus) sont en revanche
          transmises à Google (Google Analytics), qui les traite sur sa propre infrastructure, en partie en dehors
          de l'Union européenne.
        </p>
      </section>

      <section>
        <h2>Sécurité</h2>
        <p>
          Le site est servi en HTTPS (connexion chiffrée), les mots de passe sont hachés (jamais stockés en
          clair), et l'accès au serveur est restreint par clé SSH. Aucun système n'étant infaillible, contactez
          l'éditeur si vous repérez une faille ou un comportement suspect.
        </p>
      </section>

      <section>
        <h2>Cookies et mesure d'audience</h2>
        <p>
          Ce site utilise Google Analytics, qui peut déposer des cookies ou technologies similaires dans votre
          navigateur pour mesurer sa fréquentation. Il n'utilise en revanche aucun cookie publicitaire.
        </p>
        <p>
          Votre jeton de connexion ainsi que vos informations de compte (email, pseudo) sont par ailleurs conservés
          dans le stockage local de votre navigateur, strictement nécessaires pour rester connecté à votre compte.
          Ils sont supprimés lorsque vous vous déconnectez.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants sur vos données :</p>
        <ul>
          <li>Droit d'accès : savoir quelles données vous concernant sont conservées</li>
          <li>Droit de rectification : corriger une donnée inexacte</li>
          <li>Droit à l'effacement : demander la suppression de votre compte et de vos données</li>
          <li>Droit à la portabilité : récupérer vos données dans un format lisible</li>
          <li>Droit d'opposition et de limitation du traitement</li>
        </ul>
        <p>
          <strong>Exercer vos droits :</strong> contactez l'éditeur à l'adresse{' '}
          <a href="mailto:contact@dedalofus.fr">contact@dedalofus.fr</a>, ou via le{' '}
          <a href="https://discord.gg/WDxuStWyh" target="_blank" rel="noreferrer">
            serveur Discord
          </a>
          . Vous pouvez aussi introduire une réclamation auprès de la{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
            CNIL
          </a>{' '}
          si vous estimez que vos droits ne sont pas respectés.
        </p>
      </section>

      <section>
        <h2>Modifications</h2>
        <p>
          Cette politique peut évoluer (nouvelle fonctionnalité, évolution de la réglementation). La date de
          dernière mise à jour est indiquée ci-dessous.
        </p>
        <p>Dernière mise à jour : 25 août 2026.</p>
      </section>
    </div>
  );
}

export default PolitiqueConfidentialitePage;
