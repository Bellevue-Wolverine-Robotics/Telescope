import { useState } from 'react';
import Layout from '../components/layout/Layout';
import testData from '../../data/scouting_app_sample_data_1.json';

function Debug() {
  const [status, setStatus] = useState(null);

  function populateTestData() {
    try {
      localStorage.setItem('matches', JSON.stringify(testData));
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  }

  function clearData() {
    localStorage.removeItem('matches');
    setStatus('cleared');
  }

  return (
    <Layout header="Debug" tab={3}>
      <div className="flex flex-col gap-3 p-4">
        <button
          onClick={populateTestData}
          className="p-3 bg-[#212529] text-white border rounded-lg flex justify-center"
        >
          Populate test data
        </button>
        <button
          onClick={clearData}
          className="p-3 border border-[#212529] rounded-lg flex justify-center"
        >
          Clear localStorage
        </button>
        {status === 'success' && (
          <p className="text-center text-sm text-green-600">Test data loaded into localStorage.</p>
        )}
        {status === 'cleared' && (
          <p className="text-center text-sm text-gray-500">localStorage cleared.</p>
        )}
        {status === 'error' && (
          <p className="text-center text-sm text-red-600">Failed to write to localStorage.</p>
        )}
      </div>
    </Layout>
  );
}

export default Debug;
