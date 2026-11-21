import { useState } from 'react';
import Layout from '../components/layout/Layout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PHASES, loadAllPhases, replaceRecords } from '../lib/RecordData';

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
    const device = await loadAllPhases();
    return PHASES.map(p => plural(device[p].records.length, p.toLowerCase())).join(' and ');
  }

  async function askClearData() {
    setConfirm({
      title:        'Clear all data?',
      message:      `This deletes all ${await countRecords()} on this device. This can't be undone.`,
      confirmLabel: 'Delete',
      onConfirm:    async () => {
        try {
          for (const p of PHASES) await replaceRecords(p, []);
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
