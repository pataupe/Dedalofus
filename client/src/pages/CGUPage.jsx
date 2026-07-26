import './PageLegale.css';

function CGUPage() {
  return (
    <div className="page-legale">
      <h1>Conditions générales d'utilisation</h1>

      <section>
        <h2>Objet</h2>
        <p>
          Les présentes conditions régissent l'utilisation du site Dédalofus (dedalofus.fr). En créant un compte ou
          en utilisant le site, tu acceptes ces conditions.
        </p>
      </section>

      <section>
        <h2>Description du service</h2>
        <p>
          Dédalofus est un outil communautaire, gratuit et bénévole, permettant de consulter les équipements du
          donjon « Dédale » (Dofus Touch) et de simuler un stuff. Il est fourni « en l'état », sans garantie de
          disponibilité continue ni d'exactitude absolue des données affichées (voir la{' '}
          <a href="/mentions-legales">limitation de responsabilité</a>).
        </p>
      </section>

      <section>
        <h2>Compte utilisateur</h2>
        <ul>
          <li>Un compte est réservé à un usage personnel ; tu es responsable de la confidentialité de ton mot de passe.</li>
          <li>Le pseudo choisi ne doit pas usurper l'identité d'un tiers ni être injurieux.</li>
          <li>
            Ne réutilise jamais les identifiants de ton compte Dofus Touch / Ankama sur ce site — Dédalofus n'a
            aucun lien avec Ankama Games.
          </li>
        </ul>
      </section>

      <section>
        <h2>Contenu et propriété intellectuelle</h2>
        <p>
          Les noms, images et données issus du jeu Dofus Touch appartiennent à Ankama Games et sont utilisés ici à
          titre informatif uniquement (voir les <a href="/mentions-legales">mentions légales</a>). Le code, le
          graphisme et les fonctionnalités propres au site appartiennent à son éditeur. Les personnages et stuffs
          que tu crées restent associés à ton compte ; le lien de partage que tu génères rend leur contenu
          consultable publiquement par toute personne qui le possède, tant que ton personnage existe.
        </p>
      </section>

      <section>
        <h2>Utilisation acceptable</h2>
        <p>
          Il est interdit d'utiliser le site d'une manière qui nuise à son fonctionnement (extraction automatisée
          massive des données, tentative d'intrusion, surcharge volontaire du serveur) ou qui porte atteinte à
          d'autres utilisateurs.
        </p>
      </section>

      <section>
        <h2>Disponibilité et responsabilité</h2>
        <p>
          Le site est maintenu bénévolement, sans obligation de résultat ni de disponibilité continue. Il peut être
          interrompu, modifié ou arrêté à tout moment, sans préavis. L'éditeur ne peut être tenu responsable d'une
          perte de données ou d'une indisponibilité temporaire.
        </p>
      </section>

      <section>
        <h2>Suspension et suppression de compte</h2>
        <p>
          L'éditeur se réserve le droit de suspendre ou supprimer un compte en cas de non-respect de ces conditions,
          d'usage abusif du service, ou à la demande de son titulaire (voir la{' '}
          <a href="/politique-de-confidentialite">politique de confidentialité</a>).
        </p>
      </section>

      <section>
        <h2>Modification des conditions</h2>
        <p>
          Ces conditions peuvent être mises à jour ; la version en vigueur est celle publiée sur cette page.
        </p>
      </section>

      <section>
        <h2>Droit applicable</h2>
        <p>Les présentes conditions sont soumises au droit français.</p>
      </section>
    </div>
  );
}

export default CGUPage;
