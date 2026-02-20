import { useState } from 'react';
import Layout from '../components/layout/Layout';
import data1 from '../../data/scouting_app_sample_data_1.json';
import data2 from '../../data/scouting_app_sample_data_2.json';

const DATASETS = [
  { label: 'Sample Data 1', data: data1 },
  { label: 'Sample Data 2', data: data2 },
];

function Debug() {
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState(null);

  function loadDataset() {
    try {
      localStorage.setItem('matches', JSON.stringify(DATASETS[selected].data));
      setStatus({ type: 'success', message: `"${DATASETS[selected].label}" loaded.` });
    } catch {
      setStatus({ type: 'error', message: 'Failed to write to localStorage.' });
    }
  }

  function clearData() {
    localStorage.removeItem('matches');
    setStatus({ type: 'cleared', message: 'localStorage cleared.' });
  }

  return (
    <Layout header="Debug" tab={3}>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#868e96]">Load dataset</p>
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="p-3 border border-[#212529] rounded-lg bg-white w-full"
        >
          {DATASETS.map((dataset, i) => (
            <option key={dataset.label} value={i}>{dataset.label}</option>
          ))}
        </select>
        <button
          onClick={loadDataset}
          className="p-3 bg-[#212529] text-white border rounded-lg flex justify-center"
        >
          Load
        </button>
        <div className="border-t border-[#E9ECEF] my-1" />
        <button
          onClick={clearData}
          className="p-3 border border-[#212529] rounded-lg flex justify-center"
        >
          Clear localStorage
        </button>
        {status && (
          <p className={`text-center text-sm ${
            status.type === 'success' ? 'text-green-600' :
            status.type === 'error'   ? 'text-red-600'   :
                                        'text-gray-500'
          }`}>
            {status.message}
          </p>
        )}
      </div>
    </Layout>
  );
}

export default Debug;
