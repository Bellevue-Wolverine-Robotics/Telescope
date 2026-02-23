import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PhaseToggle from '../components/ui/PhaseToggle';
import { PHASE_CONFIG, storeRecordData } from '../lib/RecordData';
import matchData1 from '../../data/match/data_1.json';
import matchData2 from '../../data/match/data_2.json';
import pitData1 from '../../data/pit/data_1.json';
import pitData2 from '../../data/pit/data_2.json';

const DATASETS = {
  Match: [
    { label: 'Sample 1', data: matchData1 },
    { label: 'Sample 2', data: matchData2 },
  ],
  Pit: [
    { label: 'Sample 1', data: pitData1 },
    { label: 'Sample 2', data: pitData2 },
  ],
};

function Debug() {
  const [searchParams, setSearchParams] = useSearchParams();
  const phaseKey = searchParams.get('phase') ?? 'Match';
  const phase = PHASE_CONFIG[phaseKey] ?? PHASE_CONFIG.Match;
  const datasets = DATASETS[phaseKey] ?? DATASETS.Match;

  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!searchParams.get('phase')) {
      setSearchParams({ phase: 'Match' }, { replace: true });
    }
    setSelected(0);
    setStatus(null);
  }, [phaseKey]);

  async function loadDataset() {
    try {
      const { label, data } = datasets[selected];
      await storeRecordData(phase, data);
      setStatus({ type: 'success', message: `"${label}" loaded.` });
    } catch {
      setStatus({ type: 'error', message: 'Failed to write to IndexedDB.' });
    }
  }

  async function clearData() {
    await storeRecordData(phase, []);
    setStatus({ type: 'cleared', message: 'Data cleared.' });
  }

  return (
    <Layout header="Debug" tab={3}>
      <div className="flex flex-col gap-3 p-4">
        <PhaseToggle />
        <p className="section-label">Load dataset</p>
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="field-input"
        >
          {datasets.map((dataset, i) => (
            <option key={dataset.label} value={i}>{dataset.label}</option>
          ))}
        </select>
        <button onClick={loadDataset} className="btn-primary">
          Load
        </button>
        <div className="divider my-1" />
        <button onClick={clearData} className="btn-outline">
          Clear Data
        </button>
        {status && (
          <p className={`text-center text-sm ${
            status.type === 'success' ? 'text-green-600' :
            status.type === 'error'   ? 'text-red-600'   :
                                        'text-[var(--color-muted)]'
          }`}>
            {status.message}
          </p>
        )}
      </div>
    </Layout>
  );
}

export default Debug;
