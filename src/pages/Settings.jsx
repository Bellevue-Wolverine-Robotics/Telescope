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
          <p className="section-label">Scouter Name</p>
          <input
            type="text"
            value={scouterName}
            onChange={(e) => handleScouterName(e.target.value)}
            placeholder="Enter your name"
            className="field-input"
          />
        </div>
        <div className="divider" />
        <div className="flex flex-col gap-2">
          <p className="section-label">Display Mode</p>
          <div className="segment-control">
            {['Light', 'Dark'].map((m) => (
              <button
                key={m}
                onClick={() => applyMode(m)}
                className={`segment-btn py-3 ${mode === m ? 'active' : ''}`}
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
