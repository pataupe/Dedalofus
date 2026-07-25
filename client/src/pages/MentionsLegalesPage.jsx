import './MentionsLegalesPage.css';

function MentionsLegalesPage() {
  return (
    <div className="page-mentions-legales">
      <h1>Mentions légales</h1>

      <section>
        <h2>Éditeur du site</h2>
        <p>
          Le site Dédalofus (dedalofus.fr) est édité, à titre non professionnel et non commercial, par :
          <br />
          Nathan Degorce
          <br />
          Contact : <a href="mailto:nathandegorce@yahoo.fr">nathandegorce@yahoo.fr</a>
        </p>
        <p>
          Directeur de la publication : Nathan Degorce.
        </p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par :
          <br />
          OVH SAS
          <br />
          2 rue Kellermann, 59100 Roubaix, France
          <br />
          RCS Lille Métropole 424 761 419 00045 — Capital social : 50 000 000 €
          <br />
          <a href="https://www.ovhcloud.com" target="_blank" rel="noreferrer">
            www.ovhcloud.com
          </a>
        </p>
      </section>

      <section>
        <h2>À propos de ce site</h2>
        <p>
          Dédalofus est un site de fan créé bénévolement, permettant aux joueurs de Dofus Touch de préparer un
          équipement pour le donjon « Dédale » et d'en simuler les dégâts. Il est <strong>indépendant</strong> et
          n'est ni affilié, ni associé, ni autorisé, ni soutenu par Ankama Games. Dofus, Dofus Touch et tous les noms,
          termes et éléments de jeu mentionnés sur ce site sont des marques et contenus appartenant à Ankama Games,
          utilisés ici à titre purement informatif et non commercial.
        </p>
        <p>
          Le code, le graphisme et les fonctionnalités propres à ce site (hors contenus issus du jeu) sont la
          propriété de son éditeur.
        </p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p>Créer un compte sur Dédalofus implique la collecte des données suivantes :</p>
        <ul>
          <li>Adresse email et pseudo (fournis à l'inscription)</li>
          <li>Mot de passe, jamais stocké en clair (uniquement sous forme chiffrée)</li>
          <li>Les personnages et équipements que tu choisis de créer/sauvegarder</li>
        </ul>
        <p>
          Ces données servent uniquement au fonctionnement du site (connexion, sauvegarde de tes stuffs) et ne sont
          ni vendues, ni partagées, ni utilisées à des fins publicitaires. Conformément au RGPD, tu peux demander à
          tout moment l'accès, la rectification ou la suppression de tes données en écrivant à{' '}
          <a href="mailto:nathandegorce@yahoo.fr">nathandegorce@yahoo.fr</a>.
        </p>
      </section>

      <section>
        <h2>Cookies et traceurs</h2>
        <p>
          Ce site n'utilise aucun cookie publicitaire ni outil de mesure d'audience (pas de Google Analytics ni
          équivalent). Seule une donnée technique strictement nécessaire à la connexion (le jeton de session) est
          conservée dans ton navigateur, indispensable pour rester connecté à ton compte.
        </p>
      </section>

      <section>
        <h2>Limitation de responsabilité</h2>
        <p>
          Les informations (stats, dégâts, bonus...) affichées sur ce site sont fournies à titre indicatif, basées
          sur des données rassemblées par la communauté, et peuvent contenir des erreurs ou des approximations
          (certaines valeurs de panoplies sont encore provisoires). Vérifie toujours les informations importantes
          directement en jeu avant une décision définitive.
        </p>
      </section>

      <section>
        <h2>Droit applicable</h2>
        <p>Les présentes mentions légales sont soumises au droit français.</p>
      </section>
    </div>
  );
}

export default MentionsLegalesPage;
