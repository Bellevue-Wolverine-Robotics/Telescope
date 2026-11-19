import ScoutingForm from '../components/layout/ScoutingForm';
import { PHASE_CONFIG } from '../lib/RecordData';

function ScoutingPit() {
  return <ScoutingForm header="Pit Scouting" phase={PHASE_CONFIG.Pit} draftKey="draftPit" />;
}

export default ScoutingPit;
