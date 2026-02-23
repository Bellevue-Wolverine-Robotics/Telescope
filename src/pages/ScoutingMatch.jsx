import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Counter from '../components/ui/Counter';
import NumericInput from '../components/ui/NumericInput';
import Switch from '../components/ui/Switch';
import TextField from '../components/ui/TextField';
import MatchDetails from '../components/layout/MatchDetails';
import { PHASE_CONFIG, mergeAndStoreRecordData } from '../lib/RecordData';

const col = key => PHASE_CONFIG.Match.columns.find(c => c.key === key);

const DRAFT_KEY = 'draftMatch';

const DEFAULT_DATA = {
  scouterName:    '',
  matchNumber:    '',
  teamNumber:     '',
  robotPosition:  '',
  fuelMissedAuto: 0,
  autoPoints:     0,
  autoClimb:      false,
  cycles:         0,
  numberDepot:    0,
  intakeType:     '',
  endgameClimb:   '',
  superChargedRP: false,
  chargedRP:      false,
  climbRP:        false,
  yellowCard:     false,
  brokeDown:      false,
  minorFouls:     0,
  majorFouls:     0,
  playstyle:      '',
  redScore:       '',
  blueScore:      '',
  result:         '',
  observations:   '',
};

const PAGES = ['Match Info', 'Autonomous', 'Teleop', 'Outcome'];

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) ?? {}; } catch { return {}; }
}

function ScoutingMatch() {
  const navigate = useNavigate();
  const [page, setPage] = useState(() => loadDraft().page ?? 0);
  const [data, setData] = useState(() => ({ ...DEFAULT_DATA, ...(loadDraft().data ?? {}), scouterName: localStorage.getItem('scouterName') ?? '' }));

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, page }));
  }, [data, page]);

  const set = key => value => setData(prev => ({ ...prev, [key]: value }));

  // Derive result from alliance (via robotPosition) and scores
  const alliance = data.robotPosition.startsWith('Red') ? 'Red'
                 : data.robotPosition.startsWith('Blue') ? 'Blue'
                 : null;
  const red  = Number(data.redScore);
  const blue = Number(data.blueScore);
  const scoresComplete = data.redScore !== '' && data.blueScore !== '';
  const scoresTied     = scoresComplete && red === blue;
  const derivedResult  = (scoresComplete && !scoresTied && alliance)
    ? (alliance === 'Red' ? (red > blue ? 'Win' : 'Loss') : (blue > red ? 'Win' : 'Loss'))
    : null;
  const effectiveResult = derivedResult ?? data.result;

  const pageValid = [
    !!(data.matchNumber && data.teamNumber && data.robotPosition),
    true,
    !!(data.intakeType && data.endgameClimb),
    !!(data.redScore && data.blueScore && effectiveResult),
  ];

  function handleSubmit() {
    const record = {
      ...data,
      result:      effectiveResult,
      matchNumber: Number(data.matchNumber),
      teamNumber:  Number(data.teamNumber),
      redScore:    red,
      blueScore:   blue,
    };
    mergeAndStoreRecordData(PHASE_CONFIG.Match, [record]);
    localStorage.removeItem(DRAFT_KEY);
    navigate('/scouting');
  }

  const isLast  = page === PAGES.length - 1;
  const isValid = pageValid[page];

  return (
    <Layout header="Match Scouting" tab={1}>
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
        <div className="flex-1 min-h-0 overflow-y-auto px-4 flex flex-col gap-4 pb-2">

          {page === 0 && <MatchDetails data={data} onChange={set} />}

          {page === 1 && (
            <>
              <Counter label="Fuel Missed Auto" value={data.fuelMissedAuto} onChange={set('fuelMissedAuto')} min={col('fuelMissedAuto').min} max={col('fuelMissedAuto').max} />
              <Counter label="Auto Points"      value={data.autoPoints}     onChange={set('autoPoints')}     min={col('autoPoints').min}     max={col('autoPoints').max} />
              <Switch  label="Auto Climb"       value={data.autoClimb}      onChange={set('autoClimb')} />
            </>
          )}

          {page === 2 && (
            <>
              <Counter label="Cycles" value={data.cycles}      onChange={set('cycles')}      min={col('cycles').min}      max={col('cycles').max} />
              <Counter label="Depot"  value={data.numberDepot} onChange={set('numberDepot')} min={col('numberDepot').min} max={col('numberDepot').max} />
              <div className="flex flex-col gap-1">
                <label className="field-label">Intake Type</label>
                <select
                  value={data.intakeType}
                  onChange={e => set('intakeType')(e.target.value)}
                  className="field-input"
                >
                  <option value="">Select intake type...</option>
                  {col('intakeType').options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="field-label">Endgame Climb</label>
                <select
                  value={data.endgameClimb}
                  onChange={e => set('endgameClimb')(e.target.value)}
                  className="field-input"
                >
                  <option value="">Select climb...</option>
                  {col('endgameClimb').options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </>
          )}

          {page === 3 && (
            <>
              <Switch  label="Super Charged RP" value={data.superChargedRP} onChange={set('superChargedRP')} />
              <Switch  label="Charged RP"       value={data.chargedRP}      onChange={set('chargedRP')} />
              <Switch  label="Climb RP"         value={data.climbRP}        onChange={set('climbRP')} />
              <Switch  label="Yellow Card"      value={data.yellowCard}     onChange={set('yellowCard')} />
              <Switch  label="Broke Down"       value={data.brokeDown}      onChange={set('brokeDown')} />
              <Counter label="Minor Fouls"      value={data.minorFouls}     onChange={set('minorFouls')} min={col('minorFouls').min} max={col('minorFouls').max} />
              <Counter label="Major Fouls"      value={data.majorFouls}     onChange={set('majorFouls')} min={col('majorFouls').min} max={col('majorFouls').max} />
              <div className="flex flex-col gap-1">
                <label className="field-label">Playstyle</label>
                <select
                  value={data.playstyle}
                  onChange={e => set('playstyle')(e.target.value)}
                  className="field-input"
                >
                  <option value="">Select playstyle...</option>
                  {col('playstyle').options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <NumericInput label="Red Score"  value={data.redScore}  onChange={set('redScore')}  max={col('redScore').max} />
              <NumericInput label="Blue Score" value={data.blueScore} onChange={set('blueScore')} max={col('blueScore').max} />
              <div className="flex flex-col gap-1">
                <label className="field-label">
                  Result{scoresTied ? ' (scores tied — select manually)' : ''}
                </label>
                {derivedResult ? (
                  <div className="p-3 border border-[var(--color-border-mid)] rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-primary)]">
                    {derivedResult}
                  </div>
                ) : (
                  <select
                    value={data.result}
                    onChange={e => set('result')(e.target.value)}
                    className="field-input"
                  >
                    <option value="">Select result...</option>
                    {col('result').options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="field-label">Observations</label>
                <textarea
                  value={data.observations}
                  onChange={e => set('observations')(e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                  className="field-input resize-none"
                />
              </div>
            </>
          )}

        </div>

        {/* Navigation buttons */}
        <div className="px-4 pb-4 pt-2 flex gap-2">
          {page > 0 && (
            <button
              onClick={() => setPage(p => p - 1)}
              className="flex-1 btn-outline"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? handleSubmit : () => setPage(p => p + 1)}
            disabled={!isValid}
            className="flex-1 btn-primary"
          >
            {page === 0 ? 'Start' : isLast ? 'Submit' : 'Next'}
          </button>
        </div>

      </div>
    </Layout>
  );
}

export default ScoutingMatch;
