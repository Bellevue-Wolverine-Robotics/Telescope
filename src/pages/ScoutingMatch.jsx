import ScoutingForm from '../components/layout/ScoutingForm';
import { PHASE_CONFIG } from '../lib/RecordData';

function ScoutingMatch() {
  return <ScoutingForm header="Match Scouting" phase={PHASE_CONFIG.Match} />;
}

export default ScoutingMatch;
