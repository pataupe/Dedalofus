import './PageLegale.css';

function MentionsLegalesPage() {
  return (
    <div className="page-legale">
      <h1>Mentions légales</h1>

      <section>
        <h2>Éditeur du site</h2>
        <p>
          Le site Dédalofus (dedalofus.fr) est édité, à titre non professionnel et non commercial, par une personne
          physique. Conformément à l'article 6-III de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l'économie numérique, l'éditeur exerce son droit de rester anonyme vis-à-vis du public ; son identité
          complète est communiquée à son hébergeur et reste accessible aux autorités judiciaires sur demande.
        </p>
        <p>
          Contact : <a href="mailto:contact@dedalofus.fr">contact@dedalofus.fr</a>, également joignable sur le{' '}
          <a href="https://discord.gg/WDxuStWyh" target="_blank" rel="noreferrer">serveur Discord</a>.
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
          RCS Lille Métropole 424 761 419 00045. Capital social : 50 000 000 €
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
          équipement pour le « Dédale » et d'en simuler les dégâts. Il est <strong>indépendant</strong> et
          n'est ni affilié, ni associé, ni soutenu par Ankama Games.
        </p>
        <p>
          Dofus Touch, ainsi que les noms, textes, icônes et visuels d'objets et de sorts affichés sur ce site
          sont des marques et contenus appartenant à Ankama Games. Ils sont reproduits ici uniquement à des fins
          d'identification et d'illustration, sans intention commerciale ni volonté de porter atteinte aux droits
          d'Ankama Games. Toute demande de retrait émanant d'Ankama Games sera traitée sans délai (voir le contact
          ci-dessus).
        </p>
        <p>
          Le code, le graphisme d'interface et les fonctionnalités propres à ce site (hors contenus issus du jeu)
          sont la propriété de son éditeur.
        </p>
      </section>

      <section>
        <h2>Sources de données</h2>
        <p>
          Une partie des données affichées sur ce site provient du site{' '}
          <a href="https://papycha.fr" target="_blank" rel="noreferrer">papycha.fr</a>.
        </p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p>
          Le détail des données collectées, de leurs finalités et de vos droits est disponible sur la page{' '}
          <a href="/politique-de-confidentialite">Politique de confidentialité</a>.
        </p>
      </section>

      <section>
        <h2>Limitation de responsabilité</h2>
        <p>
          Les informations (stats, dégâts, bonus...) affichées sur ce site sont fournies à titre indicatif, basées
          sur des données rassemblées par la communauté, et peuvent contenir des erreurs ou des approximations.
           Vérifiez toujours les informations importantes
          directement en jeu avant toute décision définitive.
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
