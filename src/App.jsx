import { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Report from './pages/Report';
import News from './pages/News';
import Resources from './pages/Resources';
import PlantTree from './pages/PlantTree';
import { useAlerts } from './hooks/useAlerts';

function AppContent() {
  const { newAlertCount, clearNewAlertCount } = useAlerts();
  const [alertFeedOpen, setAlertFeedOpen] = useState(false);

  const handleAlertToggle = useCallback(() => {
    setAlertFeedOpen(prev => !prev);
    clearNewAlertCount();
  }, [clearNewAlertCount]);

  return (
    <>
      <Header alertCount={newAlertCount} onAlertClick={handleAlertToggle} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/report" element={<Report />} />
          <Route path="/news" element={<News />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/plant" element={<PlantTree />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
