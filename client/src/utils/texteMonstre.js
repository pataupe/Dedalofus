// Les textes de monstres.json peuvent contenir du balisage minimal écrit dans
// data/monstres.md : **gras** et des sauts de ligne (une ligne du .md = une ligne
// affichée). Partout où on a besoin d'un texte brut (extrait de carte...), on
// retire le balisage plutôt que d'afficher les "**" tels quels.
export function enTexteBrut(texte) {
  return texte.replace(/\*\*/g, '').replace(/\s*\n\s*/g, ' ');
}
