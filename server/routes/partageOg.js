'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/db');

const BOT_UA = /Discordbot|Twitterbot|facebookexternalhit|WhatsApp|LinkedInBot|Slackbot|TelegramBot|vkShare|iframely/i;

router.get('/:lienPartage', async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const { lienPartage } = req.params;

  if (!BOT_UA.test(ua)) {
    return res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  }

  try {
    const [[perso]] = await db.query(
      `SELECT p.nom FROM Personnage p
       JOIN Equipement e ON e.personnage_id = p.id
       WHERE e.lien_partage = ?`,
      [lienPartage]
    );

    if (!perso) return res.status(404).send('Introuvable');

    const ogImageUrl = `https://dedalofus.fr/api/og-image/${lienPartage}`;
    const pageUrl    = `https://dedalofus.fr/partage/${lienPartage}`;
    const titre      = `${perso.nom} — Dédalofus`;
    const desc       = `Voir le stuff de ${perso.nom} sur Dédalofus, le simulateur d'équipement pour le Dédale de Dofus Touch.`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${titre}</title>
  <meta property="og:title" content="${titre}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
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
  } catch (err) {
    console.error('[partage-og] Erreur:', err);
    res.status(500).send('Erreur');
  }
});

module.exports = router;
