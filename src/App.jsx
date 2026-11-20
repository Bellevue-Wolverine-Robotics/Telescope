import { Navigate, Routes, Route } from "react-router-dom";
import Scouting from './pages/Scouting';
import Settings from './pages/Settings';
import ScoutingPit from './pages/ScoutingPit';
import ScoutingMatch from './pages/ScoutingMatch';

function App() {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/scouting" replace />} />
      <Route path="/scouting" element={<Scouting />} />
      <Route path="/scouting/match" element={<ScoutingMatch />} />
      <Route path="/scouting/pit" element={<ScoutingPit />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;
