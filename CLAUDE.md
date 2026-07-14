# CLAUDE.md — Dédale-Book

Fichier de contexte projet pour Claude Code. À placer à la racine du repo (`Dedalofus/`).

## Profil du développeur

- Solo dev, ~2 ans d'expérience en Git, React, terminal, JavaScript, HTML, CSS, Node.js, Express, SQL.
- Pas de sur-explication du jargon de base nécessaire. Reste concret et direct.
- MySQL : niveau à confirmer/vérifier en début de session si besoin, pas encore pratiqué en profondeur sur ce projet.

## Le projet en une phrase

Un simulateur en ligne permettant aux joueurs de Dofus Touch de choisir un équipement complet (Dédale) pour leur personnage et de calculer les dégâts obtenus, en prévision d'un run du donjon "Dédale". Aucun outil équivalent n'existe actuellement (DofusBook ne couvre pas le Dédale) — le porteur de projet est seul sur ce créneau, d'où une priorité forte sur la rapidité de sortie du MVP.

## Stack technique

- **Frontend** : React (Vite, JavaScript, ESLint)
- **Backend** : Node.js + Express
- **Base de données** : MySQL — pas d'ORM, requêtes SQL écrites à la main
- **Pas de Next.js** : aucun bénéfice décisif, coût d'apprentissage non justifié
- Express + React n'imposent pas MongoDB ("MERN" est une convention de tutoriel, pas une contrainte) : MySQL est choisi car le modèle de données est fortement relationnel (utilisateur → personnages → stuffs → emplacements référençant cubes/breloques/sorts).

## Structure du repo (mono-repo)

```
Dedalofus/
  client/     → React (Vite)
  server/     → Express
```

- `server/index.js` : point d'entrée Express, route `GET /api/ping` de test, CORS activé
- `server/.env` : `PORT=3001` + `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=dedalofus` (connexion MySQL locale)
- `server/scripts/` : scripts d'import Node (`import-cubes.js`, `import-breloques.js`, `import-sorts.js`), dépendent de `mysql2` et `csv-parse` (ajoutés à `server/package.json`)
- `schema.sql` (racine du repo) : script de création de la base `dedalofus` et de ses 10 tables, à exécuter une seule fois
- Sous-dossiers `server/routes/`, `server/controllers/`, `server/models/` : **pas encore créés**, prévus à la Tâche 4 (API Express), pas nécessaire avant
- `client/src/App.jsx` : fetch de test vers `/api/ping`

## Périmètre du MVP

Trois blocs indispensables :

1. **Liste des équipements du Dédale** — consultable sans compte, recherche par nom, filtre par type (pas de filtre par niveau, ça n'existe pas en Dédale)
2. **Comptes utilisateurs** — création de personnage (pas de classe, pas de niveau, juste un stuff équipé) et sauvegarde de stuffs
3. **Calculateur de dégâts** appliqué aux stuffs

**Explicitement repoussé après le MVP** : liste des mobs, articles tuto, comparateur d'items avancé, système de communauté, images réelles des équipements (visuel générique par type/élément en V1).

**Authentification** : site bénévole, pas de données bancaires. Un JWT simple + bcrypt suffit, pas de niveau de sécurité bancaire nécessaire.

## Les 3 types d'équipements

### Cubes
- Donnent des stats (ex: Intelligence, Agilité, Force, Chance, Vitalité, Puissance...)
- 6 éléments possibles, 5 rangs d'évolution : Commun, Rare, Épique, Mythique, Éxalté
- Pour une combinaison élément + rang donnée, les stats sont **fixes** (pas de fourchette aléatoire)
- 420 cubes au total, données déjà disponibles dans `cubes_v2.json`
- **9 cubes équipés** par personnage

### Breloques
- **7 emplacements** par personnage
- Effet **purement informatif** dans l'immense majorité des cas (ex: "x1.2", "x1.3" affiché mais non calculé) — sert juste à indiquer au joueur qui consulte un stuff partagé quelle breloque équiper
- **Exception unique** : une seule breloque a un vrai effet chiffré pris en compte dans le calcul → à traiter comme cas particulier (champ `is_calculated` ou équivalent)
- Données dans `DEDALE BRELOQUES.csv` — 3 colonnes exactement : `Nom`, `Rang`, `Effet`. Ces 3 colonnes sont validées comme suffisantes, pas de nouvelle colonne nécessaire pour l'instant.

### Sorts
- **9 sorts équipés** par personnage
- Liste fermée indépendante de toute classe (pas de notion Iop/Cra/etc.)
- Chaque sort a un élément et des dégâts de base fixes (ex: 19 à 23), modifiés uniquement par la stat du personnage liée à cet élément
- Colonnes définitives validées (différentes du CSV source d'origine) :
  `Nom du sort` · `Description` · `Coût en PA` · `Portée min` · `Portée max` · `Portée modifiable` · `Ligne de vue requise` · `Zone d'effet` · `Lancers par tour` · `Lancers par combat` · `Lancers par cible` · `Portée diagonale/ligne` · `Intervalle de relance (CD)` · `Durée de l'effet` · `Cumul des effets` · `Rang d'évolution` · `Dégâts min` · `Dégâts max` · `Élément` · `Dégâts critique min` · `Dégâts critique max` · `Chance de critique`
  (le CSV `DEDALE SORTS.csv` a des colonnes légèrement différentes — se référer à la liste ci-dessus comme version définitive)

## Logique de calcul de dégâts (validée)

Chaque stat d'un cube est liée à un élément (ex: Intelligence → Feu, Agilité → Air). Cette stat ne booste que les dégâts des sorts du même élément.

Exemple : un sort Terre à 20 dégâts de base tape toujours 20 s'il n'y a pas de stat Terre équipée. Un sort Feu à 20 dégâts de base peut taper 60 si le joueur a de l'Intelligence équipée.

**Taux de conversion stat → % de dégâts** : jugé simple par le porteur de projet, pas encore formalisé, à écrire noir sur blanc au moment du développement du module de calcul (Tâche 3).

Le calcul se décompose en **deux fonctions pures**, sans dépendance à Express ni MySQL, testables unitairement (`server/logic/calcul.js`) :

```js
// Étape 1 : agréger les stats du personnage à partir des cubes équipés
calculerStatsPersonnage(cubesEquipes) → { intelligence, agilite, force, chance, vitalite, ... }

// Étape 2 : calculer les dégâts de chaque sort à partir des stats du personnage
calculerDegats(statsPersonnage, sortsEquipes) → { sortId, degatsMin, degatsMax }[]
```

(Une version à une seule fonction `calculerDegats(cubesEquipes, sortsEquipes)` avait été proposée puis corrigée — l'étape intermédiaire d'agrégation des stats est centrale et doit rester séparée.)

## Modèle de données MySQL (schéma validé et implémenté)

**Nom de la base : `dedalofus`** (et non `dedale_book`, renommée en cours de Tâche 2).

⚠️ **`Cube` est un mot réservé en MySQL 8.0** (lié à `GROUP BY ... WITH CUBE`). Toute requête SQL qui référence cette table doit l'entourer de backticks : `` `Cube` ``. C'est déjà fait dans `schema.sql` et `import-cubes.js` — à reproduire dans tout futur code SQL touchant cette table (API Express, etc.).

```
Utilisateur
 - id, email, mot_de_passe_hash, cree_le

Personnage
 - id, utilisateur_id (FK), nom, cree_le
 (pas de classe, pas de niveau)

Cube (référentiel, 420 entrées, lecture seule)
 - id, nom, element, rang, numero, image_url (nullable)

StatCube (une ligne par stat, car leur nombre varie selon le cube)
 - id, cube_id (FK), cle_stat (ex: FORCE, PUISSANCE, CHANCE, DO_AIR...), valeur, libelle

Breloque (référentiel)
 - id, nom, rang, effet
 (correspond exactement aux 3 colonnes du CSV)

Sort (référentiel — colonnes définitives listées ci-dessus)
 - id, nom, description, cout_pa, portee_min, portee_max, portee_modifiable,
   ligne_de_vue_requise, zone_effet, lancers_par_tour, lancers_par_combat,
   lancers_par_cible, portee_diagonale_ligne, intervalle_relance_cd,
   duree_effet, cumul_effets, rang_evolution, degats_min, degats_max,
   element, degats_critique_min, degats_critique_max, chance_critique

Equipement (= le "stuff" sauvegardé d'un personnage)
 - id, personnage_id (FK), lien_partage (identifiant unique pour partage public), mis_a_jour_le

EquipementCube (9 lignes par équipement)
 - equipement_id (FK), emplacement (1-9), cube_id (FK, nullable si vide)

EquipementBreloque (7 lignes par équipement)
 - equipement_id (FK), emplacement (1-7), breloque_id (FK, nullable si vide)

EquipementSort (9 lignes par équipement)
 - equipement_id (FK), emplacement (1-9), sort_id (FK, nullable si vide)
```

Index utiles à prévoir au minimum : `element`, `rang`/`evolution` sur `Cube` (filtres).

## Format des données sources

- **Cubes** (`cubes_v2.json`) : tableau d'objets `{ id, nom, element, rang, numero, stats: [{ key, value, label }] }`. Le nombre de stats varie par cube (d'où la table `StatCube` séparée plutôt que des colonnes fixes).
- **Breloques** (`DEDALE BRELOQUES.csv`) : `Nom`, `Rang`, `Effet` — 116 lignes.
- **Sorts** (`DEDALE SORTS NOVICE DEDALE.csv`) : 115 lignes, colonnes à retraiter vers la liste définitive ci-dessus lors de l'import (pas un mapping 1:1 direct).

## Parcours utilisateur cible

**Sans compte** : page d'accueil → "Voir les équipements" (liste/recherche/filtre cubes+breloques, libre) ou "Créer mon équipement" (déclenche la demande de compte).

**Avec compte** : connexion → fiche personnage avec emplacements vides (9 cubes, 7 breloques, 9 sorts) → clic sur un emplacement vide → liste filtrée par type → sélection → retour fiche personnage remplie → onglet "Sorts" affichant les dégâts calculés → sauvegarde automatique à chaque changement → partage via lien unique consultable sans compte → gestion (voir/modifier/supprimer) des stuffs enregistrés.

## Plan de développement (tâches séquentielles)

1. **Mise en place du projet** ✅ FAIT (Jour 1) — voir "État d'avancement" ci-dessous
2. **Tables MySQL + import cubes/breloques/sorts** ✅ FAIT (Jour 3) — voir "État d'avancement" ci-dessous
3. **Module de calcul (2 fonctions pures) + tests unitaires (Jest/Vitest)** ← PROCHAINE ÉTAPE
4. API Express pour exposer les équipements (`GET /api/cubes`, `/api/charms`, `/api/spells`, recherche, filtres, pagination)
5. Pages React liste + détail équipement (peut démarrer en parallèle de la tâche 6)
6. Authentification (register/login, bcrypt, JWT, middleware de protection)
7. Création de personnage + emplacements d'équipement
8. Branchement du calculateur sur la fiche perso (onglet Sorts)
9. Sauvegarde automatique du stuff
10. Partage par lien unique (`share_token`, route publique sans auth)
11. Déploiement (hébergeur à choisir — doit supporter Node.js + Express + MySQL, **Vercel exclu** car pensé pour Next.js/serverless)

Règles d'enchaînement :
- Tâches 1 à 4 : strictement séquentielles
- Tâche 5 (liste/détail) et tâche 6 (auth) : peuvent démarrer en parallèle, dépendent seulement de la tâche 4
- Tâches 7 à 10 : séquentielles entre elles
- Tâche 11 : préparable en amont (choix hébergeur), exécution en dernier

## État d'avancement

### ✅ Jour 1 — Tâche 1 terminée
- Mono-repo `Dedalofus/client` + `Dedalofus/server`
- Backend Express + cors + dotenv, route `GET /api/ping` → `{ message: "pong" }`, testée OK
- Frontend Vite (React/JS/ESLint), fetch vers `/api/ping`, "pong" affiché dans le navigateur → CORS fonctionnel confirmé
- Git/GitHub lié, premier commit fait : "Setup initial: backend Express + frontend React connectés (test /api/ping)"
- Reporté volontairement : sous-dossiers `routes/`/`controllers/`/`models/`/`config/` (Tâche 4), script `concurrently` (optionnel)

### ✅ Jour 3 — Tâche 2 terminée
- MySQL 8.0 installé en local (MySQL Installer, config "Development Computer", "Full", port 3306)
- Base `dedalofus` créée via `schema.sql` (10 tables : Utilisateur, Personnage, Cube, StatCube, Breloque, Sort, Equipement, EquipementCube, EquipementBreloque, EquipementSort)
- Bug corrigé : `Cube` est un mot réservé MySQL → backticks ajoutés dans `schema.sql` et `import-cubes.js` (voir section "Modèle de données" ci-dessus)
- `scripts/` déplacé à la racine → `server/scripts/` (partage le `package.json`/`node_modules` du serveur, cohérent avec le mono-repo)
- Dépendances `mysql2` et `csv-parse` ajoutées à `server/package.json`
- Noms de fichiers CSV corrigés dans les scripts d'import (`DEDALE - BRELOQUES.csv`, `DEDALE - SORTS.csv` — espaces, pas underscores)
- Les 3 imports exécutés avec succès : **420 cubes** (+ 1755 lignes StatCube), **116 breloques**, **115 sorts**
- Vérifié : `SELECT * FROM `Cube` WHERE element = 'Feu'` renvoie 75 résultats → critère "fini" de la Tâche 2 rempli
- Commit : "Ajout des tables MySQL et scripts d'import (cubes, breloques, sorts)"

### 🔜 Prochaine étape — Tâche 3
Créer `server/logic/calcul.js` avec les 2 fonctions pures `calculerStatsPersonnage` et `calculerDegats`, plus tests unitaires (Jest ou Vitest — à trancher, Vitest cohérent avec Vite déjà utilisé côté client). Formaliser noir sur blanc le taux de conversion stat → % de dégâts (encore en suspens).

**Point à trancher avant de coder** : les cubes contiennent, en plus des caractéristiques (Intelligence, Agilité, Force, Chance, Vitalité), des dommages élémentaires directs déjà présents (`DO_AIR`, `DO_FEU`, `DO_TERRE`, `DO_EAU`) et des bonus globaux (`PUISSANCE`, `DOMMAGES`, `DO_CRIT`, `%_COUP_CRITIQUE`, résistances, PA/PM/PO...). À décider : le calcul de dégâts d'un sort doit-il agréger uniquement la conversion caractéristique→élément, ou aussi ces dommages/bonus directs quand ils s'appliquent ?

## Points encore en suspens

- **Hébergeur** : pas encore choisi (doit supporter Node + Express + MySQL)
- **Taux de conversion stat → % de dégâts** : à formaliser précisément à la Tâche 3
- **Périmètre exact du calcul** (caractéristiques seules vs. + dommages directs/bonus globaux des cubes) : à trancher au démarrage de la Tâche 3
- **Sourcing des images** des équipements : prévu après le MVP
