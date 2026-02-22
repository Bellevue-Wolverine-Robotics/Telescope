import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Counter from '../components/ui/Counter';
import NumericInput from '../components/ui/NumericInput';
import Switch from '../components/ui/Switch';
import TextField from '../components/ui/TextField';
import { PHASE_CONFIG, mergeAndStoreRecordData } from '../lib/RecordData';

const PAGES = ['Team Info', 'Robot', 'Performance', 'Dimensions'];

function ScoutingPit() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [data, setData] = useState({
    scouterName:     localStorage.getItem('scouterName') ?? '',
    teamNumber:      '',
    weight:          '',
    drivetrain:      '',
    hasAutoAlign:    false,
    autoDescription: '',
    hopperCapacity:  0,
    shooterSpeed:    0,
    intakeSpeed:     0,
    supportedPaths:  '',
    climbLevel:      '',
    climbType:       '',
    robotLength:     '',
    robotHeight:     '',
    robotWidth:      '',
  });

  const set = key => value => setData(prev => ({ ...prev, [key]: value }));

  const pageValid = [
    !!data.teamNumber,
    !!(data.weight && data.drivetrain),
    !!(data.supportedPaths && data.climbLevel && data.climbType),
    !!(data.robotLength && data.robotHeight && data.robotWidth),
  ];

  function handleSubmit() {
    const record = {
      ...data,
      teamNumber:  Number(data.teamNumber),
      weight:      Number(data.weight),
      robotLength: Number(data.robotLength),
      robotHeight: Number(data.robotHeight),
      robotWidth:  Number(data.robotWidth),
    };
    mergeAndStoreRecordData(PHASE_CONFIG.Pit, [record]);
    navigate('/scouting');
  }

  const isLast  = page === PAGES.length - 1;
  const isValid = pageValid[page];

  return (
    <Layout header="Pit Interview" tab={1}>
      <div className="h-full flex flex-col">

        {/* Progress bar */}
        <div className="flex px-4 pt-3 pb-1 gap-1.5">
          {PAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= page ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
            />
          ))}
        </div>
        <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-alt)]">
          {PAGES[page]}
        </p>

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-2">

          {page === 0 && (
            <NumericInput label="Team Number" value={data.teamNumber} onChange={set('teamNumber')} />
          )}

          {page === 1 && (
            <>
              <NumericInput label="Weight (lbs)" value={data.weight}     onChange={set('weight')} />
              <TextField    label="Drivetrain"   value={data.drivetrain} onChange={set('drivetrain')} placeholder="e.g. Swerve, Tank, Mecanum" />
              <Switch label="Auto Align" value={data.hasAutoAlign} onChange={set('hasAutoAlign')} />
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[var(--color-muted)]">Auto Notes</label>
                <textarea
                  value={data.autoDescription}
                  onChange={e => set('autoDescription')(e.target.value)}
                  rows={3}
                  placeholder="Describe autonomous capabilities..."
                  className="p-3 border border-[var(--color-border-mid)] rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] resize-none"
                />
              </div>
            </>
          )}

          {page === 2 && (
            <>
              <Counter   label="Hopper Capacity" value={data.hopperCapacity} onChange={set('hopperCapacity')} />
              <Counter   label="Shooter Speed"   value={data.shooterSpeed}   onChange={set('shooterSpeed')} />
              <Counter   label="Intake Speed"    value={data.intakeSpeed}    onChange={set('intakeSpeed')} />
              <TextField label="Supported Paths" value={data.supportedPaths} onChange={set('supportedPaths')} placeholder="e.g. Left, Center, Right" />
              <TextField label="Climb Level"     value={data.climbLevel}     onChange={set('climbLevel')}     placeholder="e.g. None, Low, Mid, High" />
              <TextField label="Climb Type"      value={data.climbType}      onChange={set('climbType')}      placeholder="e.g. Hook, Elevator" />
            </>
          )}

          {page === 3 && (
            <>
              <NumericInput label="Length (in)" value={data.robotLength} onChange={set('robotLength')} />
              <NumericInput label="Height (in)" value={data.robotHeight} onChange={set('robotHeight')} />
              <NumericInput label="Width (in)"  value={data.robotWidth}  onChange={set('robotWidth')} />
            </>
          )}

        </div>

        {/* Navigation buttons */}
        <div className="px-4 pb-4 pt-2 flex gap-2">
          {page > 0 && (
            <button
              onClick={() => setPage(p => p - 1)}
              className="flex-1 p-3 border border-[var(--color-primary)] rounded-lg text-[var(--color-primary)] bg-[var(--color-surface)]"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? handleSubmit : () => setPage(p => p + 1)}
            disabled={!isValid}
            className={`flex-1 p-3 border rounded-lg text-[var(--color-on-primary)] ${
              isValid
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                : 'bg-[var(--color-border-mid)] border-[var(--color-border-mid)]'
            }`}
          >
            {page === 0 ? 'Start' : isLast ? 'Submit' : 'Next'}
          </button>
        </div>

      </div>
    </Layout>
  );
}

export default ScoutingPit;
