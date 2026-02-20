import {Navigate, Routes, Route } from "react-router-dom";
import Records from './pages/Records';
import Scouting from './pages/Scouting';
import Settings from './pages/Settings';
import ScoutingPit from './pages/ScoutingPit';
import ScoutingMatch from './pages/ScoutingMatch';
import Debug from './pages/Debug';

function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/scouting" />} />
      <Route path="/records" element={<Records />} />
      <Route path="/scouting" element={<Scouting />} />
      <Route path="/scouting/match" element={<ScoutingMatch />} />
      <Route path="/scouting/pit" element={<ScoutingPit />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/debug" element={<Debug />} />
    </Routes>
  );
}

export default App;
