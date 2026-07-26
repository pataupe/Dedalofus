import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CubeListPage from './pages/CubeListPage';
import CubeDetailPage from './pages/CubeDetailPage';
import BreloqueListPage from './pages/BreloqueListPage';
import SortListPage from './pages/SortListPage';
import ConnexionPage from './pages/ConnexionPage';
import InscriptionPage from './pages/InscriptionPage';
import PersonnagePage from './pages/PersonnagePage';
import PersonnageDetailPage from './pages/PersonnageDetailPage';
import PartagePage from './pages/PartagePage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import PolitiqueConfidentialitePage from './pages/PolitiqueConfidentialitePage';
import CGUPage from './pages/CGUPage';

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
          <Route path="/connexion" element={<ConnexionPage />} />
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route path="/personnage" element={<PersonnagePage />} />
          <Route path="/personnage/:id" element={<PersonnageDetailPage />} />
          <Route path="/partage/:lienPartage" element={<PartagePage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialitePage />} />
          <Route path="/conditions-generales-utilisation" element={<CGUPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
