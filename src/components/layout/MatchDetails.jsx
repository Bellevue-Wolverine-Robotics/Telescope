import NumericInput from '../ui/NumericInput';
import { PHASE_CONFIG } from '../../lib/RecordData';

const col = key => PHASE_CONFIG.Match.columns.find(c => c.key === key);

function MatchDetails({ data, onChange }) {
  return (
    <>
      <NumericInput label="Match Number" value={data.matchNumber} onChange={onChange('matchNumber')} max={col('matchNumber').max} />
      <NumericInput label="Team Number"  value={data.teamNumber}  onChange={onChange('teamNumber')}  max={col('teamNumber').max} />
      <div className="flex flex-col gap-1">
        <label className="field-label">Robot Position</label>
        <select
          value={data.robotPosition}
          onChange={e => onChange('robotPosition')(e.target.value)}
          className="field-input"
        >
          <option value="">Select position...</option>
          {col('robotPosition').options.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>
    </>
  );
}

export default MatchDetails;
