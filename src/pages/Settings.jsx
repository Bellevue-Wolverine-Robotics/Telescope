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

          <p className="section-label px-1">General</p>
          <div className="settings-list">
            <div className="settings-row">
              <label htmlFor="scouter-name" className="shrink-0">Name</label>
              <input
                id="scouter-name"
                type="text"
                value={scouterName}
                onChange={(e) => handleScouterName(e.target.value)}
                placeholder="Enter your name"
                className="field-input py-2 max-w-52"
              />
            </div>
            <div className="settings-row">
              <span className="shrink-0">Appearance</span>
              <div className="segment-control w-44">
                {['Light', 'Dark'].map((m) => (
                  <button
                    key={m}
                    onClick={() => applyMode(m)}
                    className={`segment-btn h-8 ${mode === m ? 'active' : ''}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="section-label px-1 pt-4">Data</p>
          <div className="settings-list">
            <button onClick={askClearData} className="settings-row">
              <span>Clear all data</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5 text-[var(--color-muted-alt)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <p className="section-label px-1 pt-4">About</p>
          <div className="settings-list">
            <div className="settings-row">
              <span className="shrink-0">Build</span>
              <span className="text-[var(--color-muted)]">{__BUILD_NUMBER__}</span>
            </div>
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
