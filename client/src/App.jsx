import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CubeListPage from './pages/CubeListPage';
import CubeDetailPage from './pages/CubeDetailPage';
import BreloqueListPage from './pages/BreloqueListPage';
import SortListPage from './pages/SortListPage';
import BreuvageListPage from './pages/BreuvageListPage';
import EnsembleListPage from './pages/EnsembleListPage';
import MonstreListPage from './pages/MonstreListPage';
import MonstrePartagePage from './pages/MonstrePartagePage';
import ConnexionPage from './pages/ConnexionPage';
import InscriptionPage from './pages/InscriptionPage';
import PersonnagePage from './pages/PersonnagePage';
import PersonnageDetailPage from './pages/PersonnageDetailPage';
import PartagePage from './pages/PartagePage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import PolitiqueConfidentialitePage from './pages/PolitiqueConfidentialitePage';

function App() {
  return (
    <div className="app-mise-en-page">
      <Header />
      <main className="app-contenu">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cubes" element={<CubeListPage />} />
          <Route path="/cubes/:id" element={<CubeDetailPage />} />
          <Route path="/breloques" element={<BreloqueListPage />} />
          <Route path="/sorts" element={<SortListPage />} />
          <Route path="/breuvages" element={<BreuvageListPage />} />
          <Route path="/ensembles" element={<EnsembleListPage />} />
          <Route path="/monstres" element={<MonstreListPage />} />
          <Route path="/monstre/:slug" element={<MonstrePartagePage />} />
          <Route path="/connexion" element={<ConnexionPage />} />
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route path="/personnage" element={<PersonnagePage />} />
          <Route path="/personnage/:id" element={<PersonnageDetailPage />} />
          {/* :version optionnel — posé par le bouton "Copier le lien de partage" pour
              forcer un aperçu Discord neuf (voir PersonnageDetailPage.jsx). Un
              paramètre ?v=... était ignoré par le cache d'aperçu de Discord ; un
              segment de chemin, lui, change forcément l'URL vue par le robot. */}
          <Route path="/partage/:lienPartage/:version?" element={<PartagePage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialitePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
