'use strict';

// Même principe que partageOg.js (partage d'un stuff), mais plus simple : un
// monstre a déjà une vraie image toute faite (le portrait affiché sur les
// cartes), pas besoin de dessiner une image à la volée comme ogImage.js pour
// les stuffs. On pointe juste og:image directement dessus.

const express = require('express');
const router = express.Router();
const path = require('path');
const monstresData = require('../../client/src/data/monstres.json');

const BOT_UA = /Discordbot|Twitterbot|facebookexternalhit|WhatsApp|LinkedInBot|Slackbot|TelegramBot|vkShare|iframely/i;

// Index slug -> { monstre, famille, profondeur }, construit une seule fois au
// démarrage (les données sont statiques, générées par generate-monstres.js).
const indexMonstres = new Map();
for (const profondeur of monstresData) {
  for (const biome of profondeur.biomes) {
    for (const famille of biome.familles) {
      for (const monstre of famille.monstres) {
        indexMonstres.set(monstre.slug, { monstre, famille, profondeur });
      }
    }
  }
}

function echapperHtml(texte) {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tronquer(texte, max) {
  if (texte.length <= max) return texte;
  return `${texte.slice(0, max).trimEnd()}…`;
}

router.get('/:slug', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const { slug } = req.params;

  if (!BOT_UA.test(ua)) {
    return res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  }

  const entree = indexMonstres.get(slug);
  if (!entree) return res.status(404).send('Introuvable');

  const { monstre, famille } = entree;
  // Tout le contenu (texte + Mécanique + Conseils pour les boss), pas
  // seulement le premier paragraphe : c'est la vraie "stratégie" qu'on veut
  // voir apparaître dans l'aperçu Discord. Coupé à 1000 caractères par
  // sécurité (les plus longues fiches de boss dépassent 2000) — Discord
  // applique de toute façon sa propre limite d'affichage côté aperçu de lien,
  // qu'on ne contrôle pas depuis le site.
  const texteComplet = monstre.paragraphes.map((p) => p.texte).join('\n\n');
  const description = tronquer(texteComplet || famille.passif || 'Monstre du Dédale.', 1000);

  const titre = echapperHtml(`${monstre.nom}${monstre.boss ? ' (BOSS)' : ''} — Dédalofus`);
  const desc = echapperHtml(description);
  const ogImageUrl = `https://dedalofus.fr${monstre.image}`;
  const pageUrl = `https://dedalofus.fr/monstre/${slug}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${titre}</title>
  <meta property="og:title" content="${titre}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Dédalofus">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titre}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImageUrl}">
</head>
<body></body>
</html>`);
});

module.exports = router;
