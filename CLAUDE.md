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
- `server/config/db.js` : pool de connexions MySQL (`mysql2/promise`)
- `server/controllers/` + `server/routes/` : API REST en lecture seule (`/api/cubes`, `/api/breloques`, `/api/sorts`) — voir "État d'avancement" (Tâche 4)
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
- **Dommages critique** (`DO_CRIT`) : s'ajoute aux dommages uniquement sur un coup critique (hors crit, aucun effet). **Pas encore intégré à `calculerDegats`** (qui ne modélise pas encore les jets critiques) — valeur brute disponible dans les stats, calcul du coup critique lui-même à faire plus tard.
- **Dommages poussée** (`DO_POU`) : formule `(132 + DO_POU) / 4 × NombreDeCasesPoussées` — **pas implémenté**, le nombre de cases de poussée n'est pour l'instant que du texte libre dans les données sorts. Pas urgent (dixit porteur de projet).
- **Critique** (`%_COUP_CRITIQUE`) : base 0 + somme des cubes. Le % final d'un sort = `%_COUP_CRITIQUE` du sort + celui du personnage. **Pas encore intégré à `calculerDegats`**.

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

**Terre, Eau, Feu : pas encore fournis** — à ajouter dans `PANOPLIES` (`calcul.js`) dès que connus.

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

**Sans compte** : page d'accueil → "Voir les équipements" (liste/recherche/filtre cubes+breloques+sorts, libre — les 3 types d'équipement traités au même niveau) ou "Créer mon équipement" (déclenche la demande de compte).

**Avec compte** : connexion → fiche personnage avec emplacements vides (9 cubes, 7 breloques, 9 sorts) → clic sur un emplacement vide → liste filtrée par type → sélection → retour fiche personnage remplie → onglet "Sorts" affichant les dégâts calculés → sauvegarde automatique à chaque changement → partage via lien unique consultable sans compte → gestion (voir/modifier/supprimer) des stuffs enregistrés.

## Plan de développement (tâches séquentielles)

1. **Mise en place du projet** ✅ FAIT (Jour 1) — voir "État d'avancement" ci-dessous
2. **Tables MySQL + import cubes/breloques/sorts** ✅ FAIT (Jour 3) — voir "État d'avancement" ci-dessous
3. **Module de calcul (2 fonctions pures) + tests unitaires (Jest/Vitest)** ← PROCHAINE ÉTAPE
4. API Express pour exposer les équipements (`GET /api/cubes`, `/api/breloques`, `/api/sorts`, recherche, filtres, pagination) — routes 100% en français, cohérent avec le reste du code
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

### 🔜 Prochaine étape — Tâche 5 / Tâche 6 (en parallèle)
- Tâche 5 : pages React liste + détail équipement (consultable sans compte)
- Tâche 6 : authentification (register/login, bcrypt, JWT, middleware de protection)

## Points encore en suspens

- **Hébergeur** : pas encore choisi (doit supporter Node + Express + MySQL)
- **Bonus de panoplie Terre/Eau/Feu** : pas encore fournis (seuls Lumière et Air sont connus) — à ajouter dans `PANOPLIES` (`calcul.js`) dès que disponibles
- **Paliers 5-9 (Lumière) et 7-9 (Air) des panoplies** : valeurs actuellement fictives en attendant les vraies (voir section "Stats dérivées et bonus de panoplie")
- **Dommages critique et dommages poussée** : formules connues mais pas encore intégrées à `calculerDegats` (pas de modélisation du jet critique ni du nombre de cases de poussée pour l'instant) — pas urgent
- **Sourcing des images** des équipements : prévu après le MVP
- **Catégories de filtres pour les breloques** (Dégâts, Mobilité, Soin/Protection, Entrave, Bonus PA/PO, Bonus divers, Breloques boss) : catégories **pas encore décidées définitivement**, et de nouvelles breloques seront ajoutées plus tard. Reporté à plus tard dans le développement plutôt que de classer les 116 breloques actuelles maintenant (risque de tout refaire).
