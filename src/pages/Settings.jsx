import { useState } from 'react';
import Layout from '../components/layout/Layout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PHASE_CONFIG, loadRecordDataAsJSON, storeRecordData } from '../lib/RecordData';
import matchData1 from '../../data/match/data_1.json';
import matchData2 from '../../data/match/data_2.json';
import pitData1 from '../../data/pit/data_1.json';
import pitData2 from '../../data/pit/data_2.json';

// Each sample loads its Match and Pit data together.
const SAMPLES = [
  { label: 'Sample 1', Match: matchData1, Pit: pitData1 },
  { label: 'Sample 2', Match: matchData2, Pit: pitData2 },
];

const PHASES = Object.keys(PHASE_CONFIG);

function plural(n, word) {
  return `${n} ${word} record${n !== 1 ? 's' : ''}`;
}

function Settings() {
  const [mode, setMode] = useState(
    () => localStorage.getItem('displayMode') ?? 'Light'
  );
  const [scouterName, setScouterName] = useState(
    () => localStorage.getItem('scouterName') ?? ''
  );
  const [selectedSample, setSelectedSample] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [message, setMessage] = useState(null);

  function applyMode(newMode) {
    setMode(newMode);
    localStorage.setItem('displayMode', newMode);
    if (newMode === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function handleScouterName(value) {
    setScouterName(value);
    localStorage.setItem('scouterName', value);
  }

  async function countRecords() {
    const counts = await Promise.all(PHASES.map(p => loadRecordDataAsJSON(PHASE_CONFIG[p])));
    return PHASES.map((p, i) => plural(counts[i].length, p.toLowerCase())).join(' and ');
  }

  async function askLoadSample() {
    const sample = SAMPLES[selectedSample];
    setConfirm({
      title:        `Load ${sample.label}?`,
      message:      `This replaces the ${await countRecords()} on this device with the sample data. This can't be undone.`,
      confirmLabel: 'Replace',
      onConfirm:    async () => {
        try {
          for (const p of PHASES) await storeRecordData(PHASE_CONFIG[p], sample[p]);
          setMessage({ type: 'success', text: `${sample.label} loaded.` });
        } catch {
          setMessage({ type: 'error', text: 'Failed to save sample data.' });
        }
      },
    });
  }

  async function askClearData() {
    setConfirm({
      title:        'Clear all data?',
      message:      `This deletes all ${await countRecords()} on this device. This can't be undone.`,
      confirmLabel: 'Delete',
      onConfirm:    async () => {
        try {
          for (const p of PHASES) await storeRecordData(PHASE_CONFIG[p], []);
          setMessage({ type: 'success', text: 'All data cleared.' });
        } catch {
          setMessage({ type: 'error', text: 'Failed to clear data.' });
        }
      },
    });
  }

  return (
    <Layout header="Settings" tab={2}>
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col gap-2 p-4">

          <p className="section-label px-1">Scouter</p>
          <div className="card">
            <div className="flex flex-col gap-1">
              <label className="field-label">Name</label>
              <input
                type="text"
                value={scouterName}
                onChange={(e) => handleScouterName(e.target.value)}
                placeholder="Enter your name"
                className="field-input"
              />
            </div>
          </div>

          <p className="section-label px-1 pt-4">Display</p>
          <div className="card">
            <div className="segment-control">
              {['Light', 'Dark'].map((m) => (
                <button
                  key={m}
                  onClick={() => applyMode(m)}
                  className={`segment-btn h-10 ${mode === m ? 'active' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <p className="section-label px-1 pt-4">Data</p>
          <div className="card">
            <div className="flex flex-col gap-1">
              <label className="field-label">Sample data</label>
              <div className="flex gap-2">
                <select
                  value={selectedSample}
                  onChange={(e) => setSelectedSample(Number(e.target.value))}
                  className="field-input"
                >
                  {SAMPLES.map((s, i) => (
                    <option key={s.label} value={i}>{s.label}</option>
                  ))}
                </select>
                <button onClick={askLoadSample} className="btn-primary px-5">Load</button>
              </div>
            </div>
            <button onClick={askClearData} className="btn-outline">Clear all data</button>
          </div>

          {message && (
            <div className={`message ${message.type} mx-0`}>
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { setConfirm(null); confirm.onConfirm(); }}
        />
      )}
    </Layout>
  );
}

export default Settings;
