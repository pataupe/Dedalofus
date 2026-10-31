import './TexteMonstre.css';

// Découpe "avant**gras**après" en nœuds React : les morceaux impairs sont en gras.
// <b> et pas <strong> : certains conteneurs (ex: .detail-monstre__bloc) stylent
// déjà <strong> comme un petit titre en capitales, qui s'appliquerait ici aussi.
function avecGras(ligne) {
  return ligne
    .split('**')
    .map((morceau, i) => (i % 2 === 1 ? <b key={i}>{morceau}</b> : morceau));
}

// Une ligne du .md = une ligne affichée (paragraphe court). Les lignes qui
// commencent par "– " sont regroupées en liste à puces. Aucune taille de texte
// ici : le conteneur parent la décide (fiche, bloc Mécanique, passif...).
function TexteMonstre({ texte }) {
  const elements = [];
  let puces = [];

  function viderPuces() {
    if (puces.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="texte-monstre__liste">
        {puces.map((puce, i) => (
          <li key={i}>{avecGras(puce)}</li>
        ))}
      </ul>
    );
    puces = [];
  }

  for (const ligne of texte.split('\n')) {
    if (ligne.startsWith('– ')) {
      puces.push(ligne.slice(2));
    } else {
      viderPuces();
      elements.push(<p key={`p-${elements.length}`}>{avecGras(ligne)}</p>);
    }
  }
  viderPuces();

  return <div className="texte-monstre">{elements}</div>;
}

export default TexteMonstre;
