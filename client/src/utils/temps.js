// Temps relatif en une seule unité (jamais "1 mois 2 semaines") : minute,
// heure, jour, mois (~30 jours) ou année — la plus grande unité pertinente.
function formaterUnite(valeur, unite) {
  return `il y a ${valeur} ${unite}${valeur > 1 ? 's' : ''}`;
}

export function tempsRelatif(dateIso) {
  const secondes = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000);
  const minutes = Math.floor(secondes / 60);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return formaterUnite(minutes, 'minute');

  const heures = Math.floor(minutes / 60);
  if (heures < 24) return formaterUnite(heures, 'heure');

  const jours = Math.floor(heures / 24);
  if (jours < 30) return formaterUnite(jours, 'jour');

  const mois = Math.floor(jours / 30);
  if (mois < 12) return `il y a ${mois} mois`;

  const ans = Math.floor(mois / 12);
  return formaterUnite(ans, 'an');
}
