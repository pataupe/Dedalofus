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

- `server/index.js` : point d'entrée Express (CORS + `express.json()`), monte tous les routers + middleware d'erreur global
- `server/.env` : `PORT=3001` + `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=dedalofus` (connexion MySQL locale) + `JWT_SECRET`
- `server/scripts/` : scripts d'import Node (`import-cubes.js`, `import-breloques.js`, `import-sorts.js`), dépendent de `mysql2` et `csv-parse`
- `schema.sql` (racine du repo) : script de création de la base `dedalofus` et de ses tables (Utilisateur avec `pseudo` unique inclus), à exécuter une seule fois
- `server/config/db.js` : pool de connexions MySQL (`mysql2/promise`)
- `server/logic/calcul.js` (+ `calcul.test.js`) : module de calcul de dégâts, 2 fonctions pures (Tâche 3)
- `server/controllers/` + `server/routes/` : `cubesController`/`breloquesController`/`sortsController` (API lecture seule, Tâche 4) + `authController`/routes `auth` (inscription/connexion, Tâche 6) + `personnagesController`/routes `personnages` (création/liste de personnages, Tâche 7 bout 1)
- `server/middleware/verifierToken.js` : middleware JWT, pose `req.utilisateur` (`{ id, email, pseudo }`) — branché sur les routes `personnages` depuis la Tâche 7 (premier usage)
- `client/src/pages/` : `HomePage`, `CubeListPage`/`CubeDetailPage`, `BreloqueListPage`, `SortListPage`, `ConnexionPage`, `InscriptionPage`, `PersonnagePage` (liste/création de personnages, nom seul — Tâche 7 bout 1, pas encore d'emplacements d'équipement)
- `client/src/components/` : `Header` (nav + état connexion, lien "Personnage" affiché si connecté), `CubeCard`, `BreloqueCard`, `SortCard`
- `client/src/api/` : wrappers fetch (`cubes.js`, `breloques.js`, `sorts.js`, `auth.js`, `personnages.js`)
- `client/src/context/AuthContext.jsx` : session (token + utilisateur) persistée dans `localStorage`
- `client/src/constants/` : `elements.js`, `rangs.js` (cubes), `elementsSorts.js`, `rangsMaitrise.js` (Novice/Expert/Maître α/Maître ẞ, partagé breloques+sorts), `statsCubes.js` (35 stats vérifiées en base)
- `client/src/assets/logo.webp` : logo du site
- Thème sombre : fond `#4A433B`, variables couleur par élément dans `client/src/index.css`
- `.claude/launch.json` : config pour prévisualiser le client (`npm run dev`, port 5173) via l'outil de preview

## Périmètre du MVP

Trois blocs indispensables :

1. **Liste des équipements du Dédale** — consultable sans compte, recherche par nom, filtre par type (pas de filtre par niveau, ça n'existe pas en Dédale)
2. **Comptes utilisateurs** — création de personnage (pas de classe, pas de niveau, juste un stuff équipé) et sauvegarde de stuffs
3. **Calculateur de dégâts** appliqué aux stuffs

**Explicitement repoussé après le MVP** : liste des mobs, articles tuto, comparateur d'items avancé, système de communauté, images réelles des équipements (visuel générique par type/élément en V1).

**Authentification** : site bénévole, pas de données bancaires. Un JWT simple + bcrypt suffit, pas de niveau de sécurité bancaire nécessaire.

## Les 4 types d'équipements

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

### Breuvages
- **Nouveau 4e type d'équipement**, décidé en Tâche 7 (n'existait pas dans les blocs MVP d'origine)
- **3 emplacements** par personnage (colonne de droite sur la maquette `maquetteEquipementPerso.png`)
- Semble avoir un rang/grade (icônes à étoiles sur la maquette), à confirmer avec la vraie donnée
- **Aucune donnée disponible pour l'instant** — traité comme emplacements vides fictifs le temps que la data arrive (pas de référentiel ni de sélection réelle avant ça)

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

## Stats dérivées et bonus de panoplie (validés, implémentés dans `calculerStatsPersonnage`)

Au-delà des stats brutes sommées telles quelles depuis les cubes, certaines stats affichées sur la fiche personnage se calculent différemment :

- **Vitalité** = base **1050** + somme des bonus Vitalité des cubes
- **PA** = base **7** + cubes + bonus panoplie
- **PM** = base **3** + cubes + bonus panoplie
- **Invocation** = base **1** + cubes
- **PO**, **Sagesse**, **Soins**, **Puissance**, toutes les **Résistances**, **Dommages critique** (`DO_CRIT`), **Dommages poussée** (`DO_POU`) : base 0, simple somme des cubes (déjà géré génériquement, rien de spécial à coder)
- **Tacle** = 1 par tranche entière de 10 Agilité (troncature, pas d'arrondi)
- **Fuite** = 1 par tranche entière de 10 Chance (troncature) + bonus Fuite direct des cubes
- **Retrait PA / Retrait PM** = 1 par tranche entière de 10 Sagesse (troncature). Pas de stat cube équivalente ; seules les **breloques** pourront l'augmenter (non géré pour l'instant, calcul limité aux cubes).
- **Esquive PA / Esquive PM** = même palier Sagesse (10 → 1) **+ bonus direct des cubes** (stat `ESQUIVE_PA`/`ESQUIVE_PM`, confirmée présente sur certains cubes) — contrairement au Retrait, les cubes peuvent bien booster l'Esquive.
- **Dommages élémentaires affichés** (Terre/Eau/Feu/Air) = stat `DOMMAGES` (globale, jamais affichée seule) + `DO_<ELEMENT>` (propre à l'élément)
- **Dommages critique du sort** (`degats_critique_min`/`degats_critique_max` sur `Sort`, distinct de la stat cube `DO_CRIT`) : intégré à `calculerDegats` (Tâche 8) — même formule `ax+b` que les dégâts normaux, appliquée à la plage critique du sort. Affiché sur l'onglet Sorts de la fiche perso.
- **`DO_CRIT`** (stat cube, bonus de dommages qui ne s'applique que **si** un coup critique survient) : **toujours pas intégré** — `calculerDegats` calcule la plage de dégâts critiques du sort mais ne simule pas le jet de dé lui-même (survient ou non), donc ce bonus n'est pas encore ajouté au résultat. Valeur brute disponible dans les stats.
- **Dommages poussée** (`DO_POU`) : formule `(132 + DO_POU) / 4 × NombreDeCasesPoussées` — **pas implémenté**, le nombre de cases de poussée n'est pour l'instant que du texte libre dans les données sorts. Pas urgent (dixit porteur de projet).
- **Critique** (`%_COUP_CRITIQUE`) : base 0 + somme des cubes. Le % final d'un sort (`chanceCritiqueTotal`) = `chance_critique` du sort + `%_COUP_CRITIQUE` du personnage — intégré à `calculerDegats` (Tâche 8), affiché sur l'onglet Sorts.

### Bonus de panoplie

Équiper **au moins 2 cubes** d'une même famille (élément, ou Lumière) donne un bonus de stats. Le bonus au palier atteint **remplace** celui du palier précédent (pas cumulatif entre paliers). Plusieurs panoplies de familles différentes équipées en même temps se cumulent entre elles. Un cube **Chaos** compte comme 1 cube de **chaque** famille (Air/Feu/Terre/Eau/Lumière) pour le calcul des paliers, mais n'a pas de panoplie propre.

Valeurs connues à ce jour (config `PANOPLIES` dans `calcul.js`, facilement modifiable) :

| Cubes Lumière | Bonus |
|---|---|
| 2 | +1 PM |
| 3 | +1 PM, +1 PA |
| 4 | +1 PM, +1 PA, +1 PO |
| 5-9 | ⚠️ valeurs **fictives**, à corriger |

| Cubes Air | Bonus |
|---|---|
| 2 | +50 Vita, +50 Agilité, +10 DO_AIR |
| 3 | +100 Vita, +100 Agilité, +20 DO_AIR |
| 4 | +150 Vita, +150 Agilité, +30 DO_AIR, +25 Puissance, +5 Dommages |
| 5 | +200 Vita, +150 Agilité, +30 DO_AIR, +50 Puissance, +10 Dommages |
| 6 | +250 Vita, +150 Agilité, +30 DO_AIR, +75 Puissance, +15 Dommages |
| 7-9 | ⚠️ valeurs **fictives**, à corriger |

**Terre, Eau, Feu** : ⚠️ aucune vraie valeur fournie pour l'instant — en attendant, mêmes valeurs que Air à l'identique sur tous les paliers (2-9), juste la caractéristique et la stat de dommages direct adaptées à l'élément (Terre→Force/DO_TERRE, Eau→Chance/DO_EAU, Feu→Intelligence/DO_FEU). Entièrement fictif, à corriger dans `PANOPLIES` (`calcul.js`) dès que le porteur de projet fournit les vraies valeurs.

(Une version à une seule fonction `calculerDegats(cubesEquipes, sortsEquipes)` avait été proposée puis corrigée — l'étape intermédiaire d'agrégation des stats est centrale et doit rester séparée.)

## Modèle de données MySQL (schéma validé et implémenté)

**Nom de la base : `dedalofus`** (et non `dedale_book`, renommée en cours de Tâche 2).

⚠️ **`Cube` est un mot réservé en MySQL 8.0** (lié à `GROUP BY ... WITH CUBE`). Toute requête SQL qui référence cette table doit l'entourer de backticks : `` `Cube` ``. C'est déjà fait dans `schema.sql` et `import-cubes.js` — à reproduire dans tout futur code SQL touchant cette table (API Express, etc.).

```
Utilisateur
 - id, email, pseudo (UNIQUE, 3-32 caractères), mot_de_passe_hash, cree_le

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

**Sans compte** : les 3 types d'équipement (cubes, breloques, sorts) restent consultables librement avec recherche/filtres via le menu du header, sans compte nécessaire. La page d'accueil elle-même ne pousse plus que vers la création de compte — bouton unique "Créer mon équipement" (mis en valeur), pas de bouton "Voir les équipements" sur l'accueil (implémenté différemment de l'intention initiale de ce document, sur demande du porteur de projet).

**Avec compte** : connexion → fiche personnage avec emplacements vides (9 cubes, 7 breloques, 9 sorts) → clic sur un emplacement vide → liste filtrée par type → sélection → retour fiche personnage remplie → onglet "Sorts" affichant les dégâts calculés → sauvegarde automatique à chaque changement → partage via lien unique consultable sans compte → gestion (voir/modifier/supprimer) des stuffs enregistrés.

## Plan de développement (tâches séquentielles)

1. **Mise en place du projet** ✅ FAIT (Jour 1) — voir "État d'avancement" ci-dessous
2. **Tables MySQL + import cubes/breloques/sorts** ✅ FAIT (Jour 3) — voir "État d'avancement" ci-dessous
3. **Module de calcul (2 fonctions pures) + tests unitaires** ✅ FAIT (Jour 3) — voir "État d'avancement" ci-dessous
4. **API Express pour exposer les équipements** ✅ FAIT (Jour 3) — routes 100% en français, cohérent avec le reste du code
5. **Pages React liste + détail équipement** ✅ FAIT — voir "État d'avancement" ci-dessous
6. **Authentification (inscription/connexion, bcrypt, JWT)** ✅ FAIT — voir "État d'avancement" ci-dessous
7. **Création de personnage + emplacements d'équipement** ✅ FAIT — voir "État d'avancement" ci-dessous
8. **Branchement du calculateur sur la fiche perso (onglet Sorts)** ✅ FAIT — voir "État d'avancement" ci-dessous
9. **Sauvegarde automatique du stuff** ✅ FAIT (déjà acquise depuis la Tâche 7 — voir "État d'avancement" ci-dessous)
10. **Partage par lien unique** ✅ FAIT — voir "État d'avancement" ci-dessous
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

### ✅ Jour 3 (suite) — Tâche 3 terminée
- `server/logic/calcul.js` créé avec les 2 fonctions pures `calculerStatsPersonnage` et `calculerDegats`
- Formule de conversion validée et implémentée : `dégâts = base × (1 + 0,01 × stat_efficace) + bonus_dommages`
  - `stat_efficace` (élément du sort) = caractéristique liée à l'élément (Force→Terre, Intelligence→Feu, Chance→Eau, Agilité→Air) **+ Puissance** (1 Puissance = 1 stat dans tous les éléments)
  - `bonus_dommages` = stat `DOMMAGES` (globale, tous éléments) + stat `DO_<ELEMENT>` (propre à l'élément, ex: `DO_FEU`)
  - Chaos et Lumière ne sont **pas** des éléments de frappe (juste des familles de cubes) ; les sorts Chaos/Lumière tapent soit dans le "meilleur élément" (le plus avantageux des 4 pour le perso), soit dans 2 éléments à la fois (2 calculs séparés), soit pas de dégâts
  - Arrondi à l'entier le plus proche **uniquement à l'affichage final** (jamais pendant le calcul, ni dans les calculs intermédiaires)
- `calculerStatsPersonnage` agrège génériquement toutes les stats brutes des cubes équipés (pas de liste figée), + calcule l'Initiative dérivée (Force + Intelligence + Chance + Agilité + bonus Initiative des cubes Lumière)
- Vitest installé en version **2.x** (la 4 nécessite Node 20+, incompatible avec le Node 18 installé) ; 15 tests unitaires écrits et tous verts, dont les 2 exemples chiffrés validés par le porteur de projet (250 stat + 11 dommages sur base 20 → 81 ; 450 Intel + 170 Puissance sur sort Feu 20-22 → 144 à 158)
- Bonus découvert au passage : `server/node_modules/` et `server/.env` étaient suivis par git depuis le tout premier commit (pas de `.gitignore` racine) → `.gitignore` créé, fichiers désinscrits du suivi (sans suppression locale)
- Commit : "Ajout du module de calcul de degats (Tache 3) + gitignore"

### ✅ Jour 3 (suite 2) — Stats dérivées + bonus de panoplie ajoutés
- Toutes les formules de stats dérivées (Vitalité, PA, PM, Invocation, Tacle, Fuite, Retrait/Esquive PA/PM, Dommages élémentaires affichés) intégrées dans `calculerStatsPersonnage` — détail complet dans la section "Stats dérivées et bonus de panoplie" ci-dessus
- Bonus de panoplie implémentés (config `PANOPLIES` dans `calcul.js`, facilement éditable), avec gestion du comptage des cubes Chaos (comptent comme 1 cube de chaque famille)
- Esquive PA/PM confirmée boostable directement par certains cubes (stat `ESQUIVE_PA`/`ESQUIVE_PM`), en plus du palier Sagesse — contrairement au Retrait PA/PM qui n'a pas d'équivalent cube
- 29 tests unitaires au total, tous verts
- Commit : "Ajout des stats derivees et bonus de panoplie au calcul (Tache 3)", pushé sur GitHub

### ✅ Jour 3 (suite 3) — Tâche 4 terminée
- Nommage des routes tranché : **100% français** (`/api/cubes`, `/api/breloques`, `/api/sorts`), pas d'anglais, cohérent avec le reste du code
- `server/config/db.js` : pool de connexions MySQL (`mysql2/promise`), réutilisé par tous les contrôleurs
- `server/controllers/` : `cubesController.js`, `breloquesController.js`, `sortsController.js` — logique des routes
- `server/routes/` : `cubes.js`, `breloques.js`, `sorts.js` — déclaration des routes Express
- Routes implémentées :
  - `GET /api/cubes` — filtres `nom` (recherche partielle), `element`, `rang`, pagination `limit`/`offset` (max 500)
  - `GET /api/cubes/:id` — détail d'un cube avec ses stats jointes (format identique à `cubes_v2.json` : `{ ...cube, stats: [{ key, value, label }] }`), 404 si introuvable
  - `GET /api/breloques` — filtres `nom`, `rang`, pagination
  - `GET /api/sorts` — filtres `nom`, `element`, `rang` (mappé sur `rang_evolution`), pagination
- `server/index.js` monte les 3 routers + middleware d'erreur global (Express 5 route automatiquement les rejets de promesses des handlers async, pas besoin de try/catch dans les contrôleurs)
- Testé en conditions réelles avec `curl` : filtres, détail, 404, recherche — tout fonctionne
- Bug de session résolu : une ancienne instance du serveur (lancée plus tôt) squattait le port 3001 et masquait les nouvelles routes → tuée avant de retester

### ✅ Tâche 5 terminée — Pages React liste/détail + filtres avancés
- `react-router-dom` ajouté ; Vite downgradé 8→5 et `@vitejs/plugin-react` 6→4 côté client (même incompatibilité Node 18 que Vitest, cf. Tâche 3)
- Thème sombre créé (fond `#4A433B`, choisi par le porteur de projet façon DofusBook), couleur dédiée par élément, logo intégré (`client/src/assets/logo.webp`)
- Cartes `CubeCard`/`BreloqueCard`/`SortCard` suivant la maquette fournie (entête + image/placeholder à gauche + stats à droite, format stat affiché `valeur libellé` ex: "6% Résistance Feu", espace prévu pour une future icône par stat)
- 3 pages liste (Cubes/Breloques/Sorts) + détail Cube, toutes consultables sans compte, navigation commune dans le header
- Page d'accueil : uniquement **"Créer mon équipement"** (gros bouton mis en valeur) si déconnecté ; **+ "Voir mes équipements"** si connecté (les deux pointent vers `/personnage`, placeholder Tâche 7) — le bouton "Voir les équipements" a été retiré de l'accueil (les 3 listes restent accessibles via le header)
- Bug corrigé : le champ `nom` des cubes vaut toujours littéralement "Cube" (aucune valeur distinctive) → la recherche libre porte aussi sur `element`, `rang` et `numero` côté API
- Filtres : cubes = élément + rang (sélection unique, reclique pour décocher) ; breloques + sorts = **multi-sélection** (plusieurs valeurs actives à la fois, OR entre elles) ; sorts ont aussi un filtre rang de maîtrise (Novice/Expert/Maître α/Maître ẞ, liste partagée avec les breloques via `rangsMaitrise.js`)
- Filtres avancés cubes : bouton "+ de filtres" (transition CSS `grid-template-rows` 0fr→1fr, fluide sans hauteur fixe), une case à cocher par stat **réellement présente** sur au moins un cube (35 stats vérifiées via `SELECT DISTINCT` en base, `client/src/constants/statsCubes.js`), clic sur le texte ou la case fonctionne (label HTML natif), **combinées en ET** (le cube doit avoir toutes les stats cochées, pas une seule)
- **Décision : mobile-first à partir de maintenant** (Tâche 7 incluse) pour tout nouveau code — les pages déjà construites ci-dessus n'ont pas été retouchées, aucune media query pour l'instant, passe dédiée à faire plus tard (voir "Points encore en suspens")
- Catégories de filtres breloques (Dégâts/Mobilité/Soin.../Boss) demandées mais **pas encore décidées** par le porteur de projet, reportées à plus tard (plus de breloques à venir)

### ✅ Tâche 6 terminée — Authentification
- `bcryptjs` (plutôt que `bcrypt`, pas de compilation native à gérer sous Windows) + `jsonwebtoken`, token valide 30 jours
- Routes `POST /api/auth/inscription` et `POST /api/auth/connexion` ; middleware `verifierToken.js` prêt pour protéger les routes personnage/stuff (Tâche 7), pas encore utilisé
- Colonne `pseudo` ajoutée à `Utilisateur` (UNIQUE, 3 à 32 caractères) — un joueur ne doit pas être identifié juste par son email ; le header affiche le pseudo (pas l'email) une fois connecté
- Anti-doublon : vérification email+pseudo avant insertion, **et** filet de sécurité contre une race condition (contrainte `UNIQUE` en base + catch propre de l'erreur `ER_DUP_ENTRY`, réponse 409 au lieu d'une 500)
- Regex email stricte (norme HTML5, domaine avec point obligatoire) pour rejeter les faux emails type `0@0`, qui passaient auparavant sans aucune validation de format
- `AuthContext` React : session (token + utilisateur) persistée dans `localStorage`, survit aux rafraîchissements
- Redirections : un utilisateur déjà connecté qui visite `/connexion` ou `/inscription` est redirigé automatiquement (plus de formulaire réaffiché inutilement)
- Google OAuth demandé puis **repoussé** après plus tard : complexité de config externe (Google Cloud, redirect URI) non justifiée pour le MVP d'un site bénévole
- Repo GitHub : ancienne branche `master` (vieux prototype statique sans rapport, un seul commit) renommée en `archive` ; remote local mis à jour vers la nouvelle URL `pataupe/Dedalofus` (le repo avait été renommé côté GitHub, ancien nom `Dedale-Book`)

### ✅ Tâche 7 terminée — Personnage, grille d'équipements, flux "Équiper"
- **Décision de découpage** : Tâche 7 attaquée en 2 bouts plutôt que d'un coup.
- **Nouveau 4e type d'équipement décidé** : les **Breuvages** (3 emplacements), en plus des cubes/breloques/sorts — voir section "Les 4 types d'équipements" ci-dessus. Toujours pas de data ni de table : 3 cases statiques non cliquables côté frontend, rien côté backend.
- **Bout 1** : `POST`/`GET /api/personnages` (création + liste, `nom` seul), protégées par `verifierToken` (premier branchement réel du middleware) ; `PersonnagePage.jsx` remplace le placeholder.
- **Bout 2** — la vraie grille d'équipement :
  - `creerPersonnage` crée maintenant aussi l'`Equipement` associé + ses 25 lignes d'emplacements vides (9 `EquipementCube` + 9 `EquipementSort` + 7 `EquipementBreloque`, en bulk insert mysql2 `VALUES ?`) ; `lien_partage` généré via `crypto.randomBytes` dès la création (colonne `NOT NULL UNIQUE`, même si le partage lui-même n'est pas encore utilisé, Tâche 10)
  - `GET /api/personnages/:id` renvoie la fiche complète (nom + les 25 emplacements avec l'item posé ou `null`), `PUT /api/personnages/:id/{cubes,sorts,breloques}/:emplacement` équipe un item (une seule requête `UPDATE ... JOIN Equipement`, pas de round-trip supplémentaire pour retrouver `equipement_id`)
  - **Flux "Équiper" retenu** (à réutiliser pour tout futur type d'emplacement) : cliquer un emplacement **vide** sur la fiche perso navigue vers la vraie page liste du type concerné (`/cubes?perso=<id>&emplacement=<n>`, etc.) — pas de vue "picker" dédiée, on réutilise les pages liste existantes avec tous leurs filtres. Ces 3 pages liste détectent les query params `perso`/`emplacement` et affichent un bouton "Équiper" par carte (visible seulement si connecté) ; le clic appelle la route `PUT` puis redirige vers `/personnage/:id`.
  - Nouvelle page `PersonnageDetailPage.jsx` (route `/personnage/:id`) : grille de 28 cases affichées à l'écran (les 25 réelles + les 3 breuvages statiques), nouveau composant partagé `EmplacementSlot.jsx` (case vide cliquable pointillée vs. case remplie, réutilisé pour les 4 types plutôt que de dupliquer la logique 28 fois)
  - Après création d'un personnage, redirection automatique vers sa fiche (`/personnage/:id`) au lieu de rester sur la liste
  - **Explicitement hors scope, repoussé à la Tâche 8** : les stats calculées du personnage (affichage sous la grille) et l'onglet "Sorts" avec le calculateur de dégâts — les deux ont besoin de pouvoir déjà équiper des cubes/sorts, donc logiquement après ce bout
- **Bout 3** — polish visuel de la grille + modale de détail (retouches demandées après un premier retour visuel du porteur de projet, maquettes `MaquetteEquipementVide.jpg` et `maquetteCube.png`) :
  - Layout corrigé : cubes (3×3) + sorts (3×3) + colonne des 3 breuvages côte à côte (le CSS des breuvages utilisait par erreur une grille à 3 colonnes au lieu d'une colonne à 3 lignes — repositionnés), breloques en rangée en dessous, tout centré et agrandi (slots 64px mobile / 80px desktop, contre 56px avant)
  - `EmplacementSlot.jsx` : plus de "+" affiché dans les cases vides (juste un style de case creuse, bordure qui réagit au survol) ; les cases **remplies** sont maintenant aussi cliquables (avant : affichage seul)
  - Cases cube équipé affichent `élément + numéro` (ex: "Air 3") plutôt que `nom` (qui vaut toujours littéralement "Cube", cf. bug connu Tâche 5) — seul affichage utile en attendant les vraies images (V1 sans images, cf. "Sourcing des images" ci-dessous)
  - **Clic sur une case remplie → modale de détail**, nouveau composant générique réutilisable `Modal.jsx` (fond cliquable pour fermer, touche Échap, bouton ×) : réutilise directement `CubeCard`/`SortCard`/`BreloqueCard` (déjà construits Tâche 5) comme contenu, pas de nouveau composant de détail à écrire
    - Sorts et breloques : la fiche perso (`GET /api/personnages/:id`) a été élargie pour inclure les colonnes manquantes (`cout_pa`/`description` pour les sorts, `effet` pour les breloques) — tout est déjà là, la modale s'ouvre instantanément
    - Cubes : les stats ne sont **pas** incluses dans la fiche perso (évite de les charger pour 9 cubes à chaque chargement de page) — récupérées à la demande via l'endpoint existant `GET /api/cubes/:id` au clic, modale ouverte immédiatement puis mise à jour dès que les stats arrivent
  - Breuvages : toujours aucune donnée/table, cases vides non cliquables inchangées — la demande de modale ne s'applique pas encore à ce type
- **Bout 4** — bordures colorées par rang sur les cases équipées (indicateur visuel en attendant les vraies images) :
  - Cubes (`client/src/constants/rangs.js`, `couleurRangCube`) : Commun = bronze, Rare = argent, Épique = or, Mythique = rouge écarlate, Éxalté = diamant (bleu glacé `#CFEFFF` + léger halo lumineux via `box-shadow`, pensé pour rester visuellement distinct du bleu-vert de l'élément Air `#7fd1c8`)
  - Breloques et sorts (`client/src/constants/rangsMaitrise.js`, `couleurRangMaitrise`, échelle de rangs partagée) : Novice = bordure par défaut (rien de spécial), Expert = argent, Maître α/ẞ = or
  - `s.rang_evolution` ajouté à la requête sorts de `GET /api/personnages/:id` (manquant jusqu'ici, nécessaire pour calculer la couleur de bordure)
  - `EmplacementSlot.jsx` : nouvelles props `bordure`/`lueur`, bordure des cases remplies passée de 1px à 3px pour que la couleur de rang soit bien visible
- **Bout 5** — contrainte "un seul exemplaire par cube" : un même cube (élément + numéro, ex: "Air 4") ne peut être équipé qu'à un seul emplacement à la fois, **même à un rang différent** (Air 4 Commun et Air 4 Mythique s'excluent mutuellement ; Air 4 et Feu 4 restent compatibles). Vérifié dans `equiperCube` (désormais une fonction autonome, plus besoin du helper générique `equiper` partagé avec sorts/breloques qui n'ont pas cette contrainte) : requête de conflit sur `EquipementCube JOIN Cube` scoped au personnage, `409 { erreur }` avec le nom de l'emplacement en conflit si trouvé. Message backend propagé tel quel jusqu'à l'utilisateur (`CubeListPage.jsx` affiche `err.message` au lieu d'un message générique).
- **Bout 6** — déséquiper un item (aucune route backend à ajouter : `PUT .../:emplacement` acceptait déjà un id `null` pour vider l'emplacement, il manquait juste le déclencheur côté frontend) :
  - Petite croix dans le coin haut-droit de chaque case remplie (`EmplacementSlot.jsx`, nouvelle prop `onDesequiper`, `stopPropagation` pour ne pas déclencher aussi l'ouverture de la modale) : déséquipement direct en un clic, sans passer par la modale
  - Bouton rouge "Déséquiper" ajouté dans la modale de détail (les 3 types : cube/sort/breloque)
  - `PersonnageDetailPage.jsx` : mise à jour de l'état local après un déséquipement réussi (pas de refetch complet de la fiche), fermeture automatique de la modale si l'item déséquipé y était affiché
- **Bout 7** — petites retouches UX suite aux retours du porteur de projet :
  - `Modal.jsx` : le scroll vertical est désormais isolé dans un conteneur interne (`.modale__corps`) séparé du conteneur externe qui porte le bouton × en débordement négatif — évitait une barre de défilement horizontale parasite (le débordement du bouton faisait passer `overflow-x` à `auto` sur tout le conteneur)
  - `EmplacementSlot.css` : la petite croix de déséquipement n'est visible qu'au survol/focus de la case (`opacity` 0→1 via `:hover`/`:focus-within`), plus jamais affichée en permanence
  - `PersonnagePage.css` : le lien de chaque personnage dans "Mes personnages" est maintenant `display: block` sur toute la zone du `<li>` (avant : seul le texte était cliquable, le padding autour ne réagissait pas)
  - `Header.css` : pseudo agrandi (17px, gras, couleur accent dorée `--couleur-lumiere`) pour plus de présence une fois connecté ; bouton "Déconnexion" recoloré en rouge (`--couleur-feu`, même couleur que "Déséquiper") plutôt que neutre, cohérent avec les autres actions de sortie/suppression de l'appli
  - `PersonnageDetailPage.jsx` : lien "← Retour à mes personnages" ajouté en haut de la fiche, vers `/personnage`
- **Bout 8** — flux "Équiper" sans redirection automatique : cliquer "Équiper" sur `CubeListPage`/`BreloqueListPage`/`SortListPage` ne navigue plus tout de suite vers la fiche perso. À la place, nouveau composant partagé `Toast.jsx` (notification discrète en bas d'écran, transition slide up/down via une classe `visible` togglée en CSS, `position: fixed`) qui propose un lien "Voir ma fiche" et se ferme seule après 3s (`setTimeout` stocké dans un `useRef`, remis à zéro à chaque nouvel équipement pour ne pas empiler plusieurs toasts — un seul toast affiché à la fois, son minuteur redémarre). Permet d'équiper plusieurs items d'affilée depuis la même page liste sans revenir sur la fiche à chaque fois.
  - **Bug découvert juste après** : rester sur la page liste et cliquer "Équiper" sur plusieurs cubes/sorts/breloques différents ré-équipait toujours le **même** emplacement (celui figé dans l'URL au moment du clic sur la case vide d'origine, `?perso=<id>&emplacement=<n>`) — un seul item au final au lieu de plusieurs. Corrigé en changeant le contrat de la route : `PUT /api/personnages/:id/{cubes,sorts,breloques}` (sans `:emplacement` dans l'URL) choisit désormais **automatiquement le premier emplacement libre** du bon type côté serveur (`trouverEmplacementLibre`, `SELECT ... WHERE <colonne>_id IS NULL ORDER BY emplacement LIMIT 1`) ; la contrainte "un seul exemplaire par cube" (Bout 5) reste vérifiée avant de chercher un emplacement libre. La route `PUT .../:emplacement` (avec emplacement précis) reste utilisée telle quelle, mais uniquement pour le **déséquipement** depuis la fiche perso, qui a besoin de cibler une case précise. Les liens des cases vides sur `PersonnageDetailPage.jsx` n'ont donc plus besoin du paramètre `emplacement` (juste `?perso=<id>`).

### 🔄 Tâche 8 (bout 1 fait) — Stats calculées sous la grille
- Le module `server/logic/calcul.js` (Tâche 3) n'était jusqu'ici appelé que par ses tests unitaires — jamais exposé par une route. `obtenirPersonnage` (`GET /api/personnages/:id`) calcule maintenant réellement `calculerStatsPersonnage` à partir des cubes équipés (stats batch-fetchées avec le même pattern `StatCube WHERE cube_id IN (...)` que `cubesController.listerCubes`) et ajoute le résultat dans la réponse (`{ ..., stats }`)
- Nouveau composant `client/src/components/StatsPersonnage.jsx`, affiché sous la grille d'équipement sur `PersonnageDetailPage.jsx` : 5 blocs façon DofusBook (maquettes fournies par le porteur de projet) — Principal (Vitalité/PA/PM/PO/Invocation/Initiative/% Critique/Soin), Caractéristiques, Mobilité (Fuite/Tacle/Esquive/Retrait), Dommages, Résistances — toutes les stats affichées même à 0, config de libellés en dur dans le composant (les clés dérivées de `calcul.js` mélangent `_TOTAL`/`_TOTALE`, à respecter exactement)
- **Pas de recalcul optimiste côté client** : les stats sont recalculées côté serveur à chaque `GET /api/personnages/:id`, donc un rafraîchissement de page suffit après avoir équipé/déséquipé un cube — pas de logique de calcul dupliquée en JS frontend
- **Bout 2** — bonus de panoplie affichés sur la fiche perso :
  - **Terre/Eau/Feu ajoutés à `PANOPLIES`** (`calcul.js`) : jusqu'ici seuls Lumière et Air avaient des valeurs. En l'absence de vraies données pour ces 3 familles, mêmes valeurs que Air à l'identique sur tous les paliers (2 à 9), juste la caractéristique et la stat de dommages direct adaptées (Terre→FORCE/DO_TERRE, Eau→CHANCE/DO_EAU, Feu→INTELLIGENCE/DO_FEU) — entièrement **fictif**, à corriger dès que le porteur de projet fournit les vraies valeurs. Les 5 familles ont donc maintenant une table de bonus.
  - Nouvelle fonction exportée `calculerPanopliesActives(cubesEquipes)` (`calcul.js`) : renvoie le détail **par famille** (`{ famille, nombre, palier, bonus }[]`) des ensembles actifs, sans les fusionner — contrairement à `calculerBonusPanoplies` (utilisée pour le calcul des stats), qui reste inchangée mais est maintenant réécrite pour réutiliser `calculerPanopliesActives` en interne (pas de logique dupliquée). 4 nouveaux tests unitaires (33 au total, tous verts).
  - `GET /api/personnages/:id` renvoie ce détail dans `{ ..., panoplies }`
  - Nouveau composant `client/src/components/PanopliesPersonnage.jsx`, affiché sous `StatsPersonnage` : n'affiche qu'**un seul ensemble à la fois** ("Ensemble de Cubes Air (7)" + ses stats), pour éviter une page à rallonge quand plusieurs familles sont actives en même temps (ex: cubes Chaos comptant dans les 5 familles à la fois → jusqu'à 5 ensembles actifs simultanément). Cliquer sur le titre ouvre un menu déroulant listant les autres ensembles actifs ; en choisir un bascule l'affichage dessus. Ensemble par défaut = celui avec le plus de cubes comptés (Chaos inclus), départagé par un ordre fixe en cas d'égalité. Si un seul ensemble est actif, le titre redevient un simple texte non cliquable (pas de menu vide à ouvrir pour rien).
- **Bout 3** — réorganisation Caractéristiques + colonne "Parcho" (maquette DofusBook fournie par le porteur de projet) :
  - Bloc Principal : la ligne `VITALITE_TOTALE` s'appelle maintenant "PdV" (au lieu de "Vitalité") pour ne pas être confondue avec la nouvelle ligne "Vitalité" du bloc Caractéristiques (la stat `VITALITE` brute des cubes seule, sans le +1050 de base)
  - Bloc Caractéristiques réordonné : Vitalité, Sagesse, Force, Intelligence, Chance, Agilité, puis Puissance à part (Puissance n'a **pas** de Parcho, confirmé sur la capture)
  - **"Parcho"** : bonus de caractéristiques éditable par le joueur (façon scrolls), **persisté en base** (décision du porteur de projet, comme l'équipement) — 6 colonnes ajoutées à `Equipement` (`parcho_vitalite`, `parcho_sagesse`, `parcho_force`, `parcho_intelligence`, `parcho_chance`, `parcho_agilite`, toutes `INT NOT NULL DEFAULT 0`), migrées par script Node ponctuel (pas de client `mysql` en CLI sur la machine) et répercutées dans `schema.sql`
  - `GET /api/personnages/:id` renvoie `parcho: { VITALITE, SAGESSE, FORCE, INTELLIGENCE, CHANCE, AGILITE }` ; nouvelle route `PUT /api/personnages/:id/parcho` (`sauvegarderParcho`) sauvegarde les 6 valeurs à la fois (entiers ≥ 0)
  - `StatsPersonnage.jsx` : chaque ligne Caractéristiques (sauf Puissance) a maintenant une case éditable, total affiché = stat des cubes + Parcho ; 3 boutons "0"/"100"/"150" sous la colonne remplissent les 6 cases à la fois et sauvegardent immédiatement ; une case modifiée à la main sauvegarde au `onBlur`
  - **Bug corrigé pendant le dev** : l'`onBlur` lisait `parchoLocal` (state React) au lieu de la valeur réelle du champ, capturée par une closure qui pouvait être en retard d'un render sur le `onChange` — corrigé en relisant `e.target.value` directement dans le handler `onBlur` plutôt que de faire confiance au state
- **Bout 4** — le Parcho ne remontait pas dans les stats dérivées (PdV, Tacle, Fuite, Retrait/Esquive PA-PM, Initiative) : il ne servait qu'à l'affichage brut des 6 lignes Caractéristiques, sans influencer le reste du calcul. Corrigé à la source : `calculerStatsPersonnage(cubesEquipes, bonusParcho)` (`calcul.js`) prend maintenant un 2e paramètre optionnel, fusionné dans les stats brutes **avant** toute dérivation — exactement comme les bonus de panoplie, donc tout ce qui dépend de VITALITE/SAGESSE/FORCE/INTELLIGENCE/CHANCE/AGILITE en profite automatiquement, y compris l'Initiative (effet de bord logique, pas juste les stats explicitement demandées). 5 nouveaux tests unitaires (38 au total). `obtenirPersonnage` passe maintenant `parcho` en 2e argument. Le "dynamique" demandé reste **côté serveur** (pas de duplication des formules en JS) : `StatsPersonnage.jsx` republie la fiche perso (`onParchoSauvegarde`, callback vers `rafraichir()` dans `PersonnageDetailPage.jsx`) juste après chaque sauvegarde Parcho réussie (au blur ou au clic sur 0/100/150) — mise à jour quasi instantanée sans recharger la page, mais pas à chaque frappe.
- **Bout 5** — retouche du menu déroulant des panoplies (maquette Dédale fournie par le porteur de projet) :
  - `PanopliesPersonnage.jsx`/`.css` : le déclencheur ressemble maintenant à un vrai sélecteur (bordure, fond distinct, bouton flèche coloré `--couleur-lumiere` à droite qui pivote à l'ouverture), précédé d'un petit label "Bonus de panoplie :"
  - **Bug de positionnement corrigé** : le menu déroulant est maintenant dans son propre conteneur `position: relative` (`.panoplies-personnage__selecteur`), séparé du reste du bloc — avant, il était positionné par rapport à toute la carte (titre + stats), donc `top: 100%` le plaçait sous les stats au lieu de sous le titre. Il s'ouvre maintenant juste sous le déclencheur et recouvre les stats en dessous (`position: absolute` + `z-index`), sans repousser la mise en page.
- **Bout 6** — 45 sorts utilitaires masqués du site : sorts sans dégâts ni élément (ex: "Botte - Novice", "Aimantation - Novice" — nom se terminant par "- Novice", pas à confondre avec la colonne `rang_evolution`), hors sujet pour un calculateur de dégâts. Décision : ne pas les supprimer, juste les masquer — nouvelle colonne `Sort.visible` (`TINYINT(1) NOT NULL DEFAULT 1`, migrée par script Node ponctuel comme pour Parcho, et ajoutée à `schema.sql`), mise à `0` pour ces 45 lignes. `sortsController.listerSorts` filtre désormais toujours `WHERE visible = 1` (en plus des filtres existants) — 70 sorts visibles au lieu de 115. Filtre appliqué uniquement à la liste/recherche : la fiche perso (`obtenirPersonnage`) n'y touche pas, un sort déjà équipé continuerait de s'afficher normalement même s'il devenait invisible.
- **Bout 7** — dégâts manquants récupérés depuis la colonne "Effet du sort" du CSV source : certains sorts (poisons, pièges, glyphes, invocations — ex. "Poison Insideux") n'ont rien dans "Dégâts de base"/"Dégâts critique", mais la valeur est écrite en texte libre dans "Effet du sort"/"Effet du sort (Critique)" (ex: `"16 à 18 (dommages Feu) (2 tours)"`). Nouvelle fonction `parseDegatsDepuisEffet` (`server/scripts/import-sorts.js`) : découpe le texte sur `/` et prend le premier segment qui ressemble à des dégâts, **en ignorant les segments de soin** (`"PV rendus"` — un sort de soin comme "Mot Soignant" contient aussi une plage "X à Y" mais ce n'est pas des dégâts, à ne pas confondre). Utilisée comme repli uniquement quand la colonne dédiée est vide.
  - Corrigé dans `import-sorts.js` pour les futurs imports à partir de zéro, **et** appliqué à la base actuelle via un script `UPDATE` ponctuel ciblé par `nom` (pas de ré-import complet `DELETE`+`INSERT`, qui aurait cassé les références `EquipementSort` existantes et réinitialisé la colonne `visible` tout juste renseignée) : 15 sorts corrigés en dégâts de base, 5 en dégâts critiques.
  - `SortCard.css` : `flex: 1` ajouté sur `.carte-sort` — les cartes de la page Sorts n'avaient pas toutes la même hauteur dans une même rangée de la grille (le conteneur `.page-sorts__carte`, qui porte aussi le bouton "Équiper", s'étirait bien à la hauteur de ligne, mais pas la carte à l'intérieur).
- **Bout 8** — `SortCard.jsx` complétée (maquette DofusBook fournie, comparée champ par champ) : Portée (min-max), % de critique (`chance_critique`), Lancers par tour, Lancers par cible, Dégâts critiques (`degats_critique_min/max`) ajoutés, tout en `null`-safe (masqué si absent, ex. les sorts sans dégâts n'affichent que PA/Portée/lancers). Champs de la maquette **volontairement pas repris** : Niveau, sélecteur de rang de sort (1-6), bouton "Explication du sort", ID — aucun ne s'applique à notre modèle (pas de niveaux/rangs de sort au Dédale). Le libellé "Allié/Ennemi" (type de cible) est aussi ignoré : pas de colonne correspondante en base, non prioritaire.
  - **Décision de découpage** : cette carte a en réalité 2 affichages prévus par le porteur de projet — une version "liste" (hors équipement, dégâts et % critique **de base**, faite ici) et une version "onglet Sorts" (dégâts et % critique **calculés** pour le personnage, via `calculerDegats` — jamais branché, dépend de l'onglet Sorts de la Tâche 8 qui reste à construire). Seule la version liste est faite dans ce bout.
- **Bout 9** — mise en page de `SortCard.jsx` revue (le premier jet empilait tout en une seule colonne, façon liste brute, alors que la maquette DofusBook sépare visuellement les dégâts des autres stats) :
  - Dégâts normaux et critiques désormais dans un bandeau `.carte-sort__degats` à 2 blocs côte à côte (séparateur vertical entre les deux), valeur en gros/gras, libellé en petit en dessous ; dégâts critiques teintés `--couleur-feu` pour les distinguer visuellement du reste
  - Le reste des stats (PA, Portée, % critique, Lancers par tour/cible) en grille 2 colonnes sous un séparateur, avec la même convention de pastille d'icône réservée que `CubeCard` (`carte-sort__stat-icone`, vide en attendant les vraies icônes)

### ✅ Tâche 8 terminée — Onglet "Sorts" avec calculateur de dégâts
- `calculerDegats` (`server/logic/calcul.js`, Tâche 3, jamais branché jusqu'ici) étendu de façon rétrocompatible : accepte en plus, par sort, `degatsCritiqueMin`/`degatsCritiqueMax`/`chanceCritique` (optionnels) ; applique la même formule `ax+b` aux dégâts critiques qu'aux dégâts normaux, et calcule `chanceCritiqueTotal` = % critique du sort + `%_COUP_CRITIQUE` du personnage. Ces clés n'apparaissent dans le résultat que si les données sources existent (aucune régression sur les tests existants). 4 nouveaux tests unitaires (42 au total, tous verts).
- `obtenirPersonnage` (`personnagesController.js`) : la requête sorts passe à `SELECT es.emplacement, s.*` (au lieu d'énumérer les colonnes une par une, qui oubliait `degats_critique_min/max`/`chance_critique`/`portee_*`/`lancers_par_*` — nécessaires pour que `SortCard` s'affiche correctement sur l'onglet Sorts). Les sorts équipés sont passés à `calculerDegats`, le résultat exposé dans `{ ..., degats }`.
- `SortCard.jsx` : nouvelle prop optionnelle `calcul` (résultat de `calculerDegats` pour ce sort) — quand fournie, remplace les dégâts/élément/% critique de base par les valeurs calculées ; PA/Portée/Lancers restent toujours ceux du sort (pas liés au calcul). Sans cette prop (page `/sorts` publique), comportement inchangé. Une seule carte pour les deux affichages plutôt qu'une carte dupliquée.
- Nouveau composant `client/src/components/OngletSorts.jsx` : grille de `SortCard` (avec `calcul`) pour chaque sort équipé ; un sort à 2 éléments (cas géré par `calculerDegats` mais pas encore rencontré dans les vraies données) produirait 2 cartes, une par élément.
- `PersonnageDetailPage.jsx` : deux onglets "Équipement"/"Sorts" (state `ongletActif`, boutons façon filtres existants) — "Équipement" = grille + `StatsPersonnage` + `PanopliesPersonnage` (contenu inchangé, juste déplacé dans une branche de condition) ; "Sorts" = `OngletSorts`. La modale de détail reste commune aux deux onglets.

### ✅ Polish visuel post-Tâche 8 — icônes stats/panoplies, header mobile, mise en page Principal/Caractéristiques
- `StatsPersonnage.jsx`/`PanopliesPersonnage.jsx` : chaque stat affiche désormais une petite icône emoji colorée (couleur d'élément existante, pas de vraie icône en V1) + libellé abrégé façon DofusBook (ex: "Do Feu", "Ré Terre", "Esq. PA") pour tenir sur 2 colonnes même en portrait mobile ; chaque bloc a un bandeau de titre coloré (même convention que l'en-tête `SortCard`). `ICONES_STATS` (Panoplies) couvre les 35 stats de `STATS_CUBES` avec un repli générique si une stat imprévue apparaît dans un bonus.
- **Alignement des icônes corrigé** (retour DofusBook comparé) : `.stats-personnage__valeur`/`.panoplies-personnage__valeur` ont une largeur fixe + `text-align: right` — la valeur s'étend vers la gauche selon son nombre de chiffres, l'icône reste toujours à la même position (avant : l'icône se décalait vers la droite avec des valeurs à plus de chiffres).
- Bloc "Principal" : mise en page à 2 colonnes **fixes** (`PRINCIPAL_GAUCHE`/`PRINCIPAL_DROITE`, pas l'auto-répartition des autres blocs) — PdV/PA/PM/PO à gauche, Invoc./Init./Crit. %/Soin à droite. PdV a une prop `vedette` (légèrement plus grand, 18px vs 15px) pour ressortir un peu des 7 autres stats du bloc, sans être criard.
- Bloc "Caractéristiques" : l'en-tête "Total" était mal centré (flottait entre les 2 colonnes) → aligné à gauche au-dessus des valeurs. Les boutons de remplissage Parcho 0/100/150 sont maintenant petits et poussés à droite (< la moitié de la largeur sur mobile), ce qui a permis de remonter la ligne Puissance sur la même ligne qu'eux (elle était isolée à tort) ; le séparateur entre cette ligne et les Caractéristiques au-dessus a été retiré.
- **Bonus de panoplie "Cumuler les bonus"** : nouvelle option dans le menu déroulant (`PanopliesPersonnage.jsx`), visible dès que ≥ 2 familles sont actives — additionne stat par stat les bonus de toutes les familles actives (`cumulerBonus`), plutôt que d'afficher une seule famille à la fois. Depuis cette vue, le menu propose de rebasculer vers n'importe quelle famille individuelle.
- `Header.jsx`/`.css` refondu pour mobile : menu hamburger (3 barres → croix animée) qui déroule un panneau vertical sous le point de rupture 720px (corrige au passage un débordement horizontal de 16px qui existait déjà sur la nav) ; header rendu `sticky`. Lien "Personnage" renommé **"Mes stuffs"** et distingué visuellement des 3 listes consultables librement (Cubes/Breloques/Sorts en pastille neutre grise, "Mes stuffs" en accent doré — même traitement que le bouton Connexion, car c'est le seul lien qui mène au compte du joueur).

### ✅ Tâche 9 (déjà acquise) — Sauvegarde automatique du stuff
- Aucun développement supplémentaire nécessaire : chaque action (équiper/déséquiper un cube/sort/breloque, sauvegarder le Parcho) persiste déjà immédiatement en base via son propre appel API (voir Tâche 7/8) — pas de bouton "Sauvegarder" à ajouter, pas d'état non synchronisé côté client à gérer.

### ✅ Tâche 10 terminée — Partage par lien unique
- `lien_partage` (généré à la création du personnage depuis la Tâche 7, jamais exploité jusqu'ici) est maintenant renvoyé par `GET /api/personnages/:id` (`{ ..., lienPartage }`), pour que le propriétaire puisse le récupérer/copier depuis sa fiche.
- `personnagesController.js` refactorisé : la construction de la fiche complète (stats, panoplies, équipement, dégâts) est extraite dans `construireFichePersonnage(personnage)`, partagée entre `obtenirPersonnage` (privée, vérifie `utilisateur_id`) et la nouvelle `obtenirPersonnagePartage` (publique, vérifie `lien_partage`) — pas de logique dupliquée entre les deux routes.
- Nouvelle route **publique** (sans `verifierToken`) `GET /api/partage/:lienPartage`, montée depuis un routeur dédié `server/routes/partage.js` (`/api/partage`) plutôt que dans `routes/personnages.js`, pour qu'aucun middleware d'auth ne s'y applique par erreur. 404 générique si le lien est invalide.
- `PersonnageDetailPage.jsx` : bouton "🔗 Copier le lien de partage" sous le nom du personnage (`navigator.clipboard.writeText`, feedback "Lien copié !" pendant 2s ; message d'erreur si le presse-papier est refusé par le navigateur).
- Nouvelle page publique `client/src/pages/PartagePage.jsx` (route `/partage/:lienPartage`, sans compte nécessaire) : réutilise la même grille d'équipement + `StatsPersonnage` + `PanopliesPersonnage` + `OngletSorts`, mais **en lecture seule** — pas de lien "Équiper" sur les cases vides (pas de prop `lien`), pas de croix de déséquipement (pas de prop `onDesequiper`), pas de bouton "Déséquiper" dans la modale de détail. Les cases remplies restent cliquables pour voir le détail de l'item (modale commune, réutilise `CubeCard`/`SortCard`/`BreloqueCard` comme sur la fiche privée).
- `StatsPersonnage.jsx` : nouvelle prop `lectureSeule` — quand `true`, la colonne Parcho s'affiche en texte simple (pas d'`<input>`) et les boutons 0/100/150 sont masqués ; `token`/`personnageId`/`onParchoSauvegarde` deviennent inutiles dans ce mode (un visiteur ne doit pas pouvoir modifier le stuff de quelqu'un d'autre).

## Points encore en suspens

- **Responsive mobile-first sur les pages déjà construites** (Tâche 5 : accueil, Cubes/Breloques/Sorts, Connexion/Inscription) : aucune media query pour l'instant, pas testé sur petit écran. La convention mobile-first ne s'applique qu'au code écrit *à partir de* la Tâche 7 — une passe dédiée reste à faire sur l'existant.
- **Vulnérabilités npm (Dependabot)** : 9 signalées sur GitHub, dues au downgrade de Vite (8→5) et Vitest (4→2) pour compatibilité Node 18. Dépendances de développement uniquement (pas exposées en prod) — disparaîtront si le projet passe un jour à Node 20+.
- **Hébergeur** : pas encore choisi (doit supporter Node + Express + MySQL)
- **Bonus de panoplie Terre/Eau/Feu** : valeurs actuellement fictives (copie de Air) en attendant que le porteur de projet fournisse les vraies — à corriger dans `PANOPLIES` (`calcul.js`)
- **Paliers 5-9 (Lumière) et 7-9 (Air/Terre/Eau/Feu) des panoplies** : valeurs actuellement fictives en attendant les vraies (voir section "Stats dérivées et bonus de panoplie")
- **`DO_CRIT` (bonus cube) et dommages poussée** : formules connues mais pas encore intégrées à `calculerDegats` (pas de modélisation du jet critique — se produit ou non — ni du nombre de cases de poussée pour l'instant) — pas urgent. La plage de dégâts critiques du **sort** lui-même (`degats_critique_min/max`) et le `%` critique total sont eux déjà calculés (Tâche 8, onglet Sorts).
- **Sourcing des images** des équipements : prévu après le MVP
- **Catégories de filtres pour les breloques** (Dégâts, Mobilité, Soin/Protection, Entrave, Bonus PA/PO, Bonus divers, Breloques boss) : catégories **pas encore décidées définitivement**, et de nouvelles breloques seront ajoutées plus tard. Reporté à plus tard dans le développement plutôt que de classer les 116 breloques actuelles maintenant (risque de tout refaire).
