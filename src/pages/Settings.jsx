import { useState } from 'react';
import Layout from '../components/layout/Layout';

function Settings() {
  const [mode, setMode] = useState(
    () => localStorage.getItem('displayMode') ?? 'Light'
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

  return (
    <Layout header="Settings" tab={2}>
      <div className="flex h-full justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-alt)]">Display Mode</p>
          <div className="flex rounded-lg border border-[var(--color-primary)] overflow-hidden">
            {['Light', 'Dark'].map((m, i) => (
              <button
                key={m}
                onClick={() => applyMode(m)}
                className={`px-8 py-3 text-sm font-medium ${i > 0 ? 'border-l border-[var(--color-primary)]' : ''} ${mode === m ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-primary)]'}`}
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
