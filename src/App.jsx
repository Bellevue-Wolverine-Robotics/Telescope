import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Scouting from './pages/Scouting';
import Settings from './pages/Settings';
import ScoutingPit from './pages/ScoutingPit';
import ScoutingMatch from './pages/ScoutingMatch';

// The Records page was renamed to Scouting; keep old links (and their ?phase) working.
function RecordsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/scouting${search}`} replace />;
}

function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/scouting" />} />
      <Route path="/records" element={<RecordsRedirect />} />
      <Route path="/scouting" element={<Scouting />} />
      <Route path="/scouting/match" element={<ScoutingMatch />} />
      <Route path="/scouting/pit" element={<ScoutingPit />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;
