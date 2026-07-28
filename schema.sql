-- Dédale-Book — Schéma de base de données
-- Tâche 2 — Jour 2
-- À exécuter une seule fois pour créer la base et les tables.

CREATE DATABASE IF NOT EXISTS dedalofus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dedalofus;

-- ============================================
-- Comptes et personnages
-- ============================================

CREATE TABLE Utilisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  pseudo VARCHAR(32) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  cree_le DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Personnage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  nom VARCHAR(100) NOT NULL,
  cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES Utilisateur(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Référentiel : Cubes
-- ============================================

-- "Cube" est un mot réservé en MySQL 8.0 (lié à GROUP BY ... WITH CUBE), d'où les backticks.
CREATE TABLE `Cube` (
  id INT PRIMARY KEY,              -- on garde l'id du JSON tel quel (pas d'auto-increment)
  nom VARCHAR(100) NOT NULL,
  element VARCHAR(50) NOT NULL,
  rang VARCHAR(50) NOT NULL,
  numero INT NOT NULL,
  image_url VARCHAR(255) NULL,
  INDEX idx_cube_element (element),
  INDEX idx_cube_rang (rang)
) ENGINE=InnoDB;

-- Une ligne par stat, car le nombre de stats varie selon le cube
CREATE TABLE StatCube (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cube_id INT NOT NULL,
  cle_stat VARCHAR(50) NOT NULL,   -- ex: FORCE, PUISSANCE, CHANCE...
  valeur INT NOT NULL,
  libelle VARCHAR(100) NOT NULL,   -- ex: "Force", "Puissance"
  FOREIGN KEY (cube_id) REFERENCES `Cube`(id) ON DELETE CASCADE,
  INDEX idx_statcube_cube (cube_id)
) ENGINE=InnoDB;

-- ============================================
-- Référentiel : Breloques
-- ============================================

CREATE TABLE Breloque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  rang VARCHAR(50) NOT NULL,
  effet TEXT NOT NULL,
  image_url VARCHAR(255) NULL,
  -- Catégorie de filtre (ex: "Dégâts", "Soin - Protection") et famille d'ensemble
  -- de breloques (ex: "Ensemble de Guerre") — CSV "DEDALE - BRELOQUES_NEW.csv".
  tag VARCHAR(150) NULL,
  ensemble_lie VARCHAR(150) NULL,
  -- Bonus conditionnel (onglet "Boosts breloques" de la fiche perso) : type de
  -- contrôle affiché (toggle/range/accumulateur) + les 4 valeurs associées,
  -- conservées en texte brut tel que dans le CSV (ex: "10 soins", "dommages
  -- finaux x1.5") — le nombre exploitable est extrait à l'affichage/sauvegarde
  -- via parseValeurBoost (server/logic/boosts.js), pas ici.
  type_input VARCHAR(20) NULL,
  bonus_min_texte VARCHAR(255) NULL,
  bonus_increment_texte VARCHAR(100) NULL,
  bonus_max_texte VARCHAR(255) NULL,
  bonus_defaut_texte VARCHAR(255) NULL,
  INDEX idx_breloque_rang (rang)
) ENGINE=InnoDB;

-- ============================================
-- Référentiel : Sorts
-- ============================================

CREATE TABLE Sort (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  description TEXT NULL,
  cout_pa INT NULL,
  portee_min INT NULL,
  portee_max INT NULL,
  portee_modifiable VARCHAR(10) NULL,
  ligne_de_vue_requise VARCHAR(10) NULL,
  zone_effet VARCHAR(100) NULL,
  lancers_par_tour VARCHAR(20) NULL,
  lancers_par_combat VARCHAR(20) NULL,
  lancers_par_cible VARCHAR(20) NULL,
  portee_diagonale_ligne VARCHAR(50) NULL,
  intervalle_relance_cd VARCHAR(20) NULL,
  duree_effet VARCHAR(50) NULL,
  cumul_effets VARCHAR(50) NULL,
  rang_evolution VARCHAR(50) NOT NULL DEFAULT 'Novice',
  degats_min INT NULL,
  degats_max INT NULL,
  element VARCHAR(50) NULL,
  degats_critique_min INT NULL,
  degats_critique_max INT NULL,
  chance_critique TINYINT UNSIGNED NULL,   -- pourcentage entier (0 à 100), ex: 15 pour 15%
  -- Sorts utilitaires sans dégâts (ex: "Botte - Novice", "Aimantation - Novice") : hors
  -- sujet pour un calculateur de dégâts, masqués du site mais conservés en base.
  visible TINYINT(1) NOT NULL DEFAULT 1,
  image_url VARCHAR(255) NULL,
  INDEX idx_sort_element (element),
  INDEX idx_sort_rang_evolution (rang_evolution)
) ENGINE=InnoDB;

-- ============================================
-- Équipement (le "stuff" d'un personnage)
-- ============================================

CREATE TABLE Equipement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  personnage_id INT NOT NULL,
  lien_partage VARCHAR(64) NOT NULL UNIQUE,
  mis_a_jour_le DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- "Parcho" : bonus de caractéristiques éditable par le joueur (façon scrolls),
  -- affiché sur la fiche perso en plus des stats apportées par les cubes.
  parcho_vitalite INT NOT NULL DEFAULT 0,
  parcho_sagesse INT NOT NULL DEFAULT 0,
  parcho_force INT NOT NULL DEFAULT 0,
  parcho_intelligence INT NOT NULL DEFAULT 0,
  parcho_chance INT NOT NULL DEFAULT 0,
  parcho_agilite INT NOT NULL DEFAULT 0,
  FOREIGN KEY (personnage_id) REFERENCES Personnage(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE EquipementCube (
  equipement_id INT NOT NULL,
  emplacement TINYINT NOT NULL,   -- 1 à 9
  cube_id INT NULL,
  PRIMARY KEY (equipement_id, emplacement),
  FOREIGN KEY (equipement_id) REFERENCES Equipement(id) ON DELETE CASCADE,
  FOREIGN KEY (cube_id) REFERENCES `Cube`(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE EquipementBreloque (
  equipement_id INT NOT NULL,
  emplacement TINYINT NOT NULL,   -- 1 à 7
  breloque_id INT NULL,
  -- Valeur actuelle du bonus conditionnel (onglet "Boosts breloques"), réglée
  -- par le joueur. Sémantique dépendante de Breloque.type_input : toggle -> 0/1
  -- (off/on), range/accumulateur -> la valeur numérique choisie dans la plage
  -- [bonus_min_texte, bonus_max_texte]. NULL si la breloque équipée n'a pas de
  -- bonus conditionnel (type_input NULL).
  boost_valeur DECIMAL(10,3) NULL,
  PRIMARY KEY (equipement_id, emplacement),
  FOREIGN KEY (equipement_id) REFERENCES Equipement(id) ON DELETE CASCADE,
  FOREIGN KEY (breloque_id) REFERENCES Breloque(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE EquipementSort (
  equipement_id INT NOT NULL,
  emplacement TINYINT NOT NULL,   -- 1 à 9
  sort_id INT NULL,
  PRIMARY KEY (equipement_id, emplacement),
  FOREIGN KEY (equipement_id) REFERENCES Equipement(id) ON DELETE CASCADE,
  FOREIGN KEY (sort_id) REFERENCES Sort(id) ON DELETE SET NULL
) ENGINE=InnoDB;
