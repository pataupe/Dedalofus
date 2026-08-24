// navigator.clipboard n'existe pas sur tous les navigateurs mobiles (ou est
// bloqué selon le contexte) : y accéder directement plante avant même
// d'atteindre le .then(), donc aucun message d'erreur ne s'affichait — juste
// "le bouton ne fait rien" sur les appareils concernés. Repli sur l'ancienne
// méthode (textarea invisible + execCommand) si l'API moderne est absente ou
// échoue. Partagé entre MonstreDetail et PersonnageDetailPage (même bug, même
// correctif) plutôt que dupliqué.
export function copierTexte(texte) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texte);
  }

  return new Promise((resolve, reject) => {
    const zone = document.createElement('textarea');
    zone.value = texte;
    zone.style.position = 'fixed';
    zone.style.opacity = '0';
    document.body.appendChild(zone);
    zone.focus();
    zone.select();
    try {
      const succes = document.execCommand('copy');
      document.body.removeChild(zone);
      if (succes) resolve();
      else reject(new Error('execCommand a échoué'));
    } catch (err) {
      document.body.removeChild(zone);
      reject(err);
    }
  });
}
