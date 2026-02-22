import { useState } from 'react';
import Layout from '../components/layout/Layout';

function Settings() {
  const [mode, setMode] = useState(
    () => localStorage.getItem('displayMode') ?? 'Light'
  );
  const [scouterName, setScouterName] = useState(
    () => localStorage.getItem('scouterName') ?? ''
  );

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

  return (
    <Layout header="Settings" tab={2}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-alt)]">Scouter Name</p>
          <input
            type="text"
            value={scouterName}
            onChange={(e) => handleScouterName(e.target.value)}
            placeholder="Enter your name"
            className="p-3 border border-[var(--color-border-mid)] rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] w-full"
          />
        </div>
        <div className="border-t border-[var(--color-border)]" />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-alt)]">Display Mode</p>
          <div className="flex rounded-lg border border-[var(--color-primary)] overflow-hidden">
            {['Light', 'Dark'].map((m, i) => (
              <button
                key={m}
                onClick={() => applyMode(m)}
                className={`flex-1 py-3 text-sm font-medium ${i > 0 ? 'border-l border-[var(--color-primary)]' : ''} ${mode === m ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-primary)]'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
