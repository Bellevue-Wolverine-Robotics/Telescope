import { useRef, useState } from 'react';
import Layout from '../components/layout/Layout';
import Export from '../components/ui/Export';
import Import from '../components/ui/Import';
import { COLUMNS, loadMatches, matchesToTSV, mergeMatches, tsvToMatches } from '../lib/MatchData';

function Cell({ column, value }) {
  if (column.type === 'boolean') {
    return <span className={value ? 'text-green-600' : 'text-gray-300'}>{value ? '✓' : '✕'}</span>;
  }
  if (column.type === 'text') {
    return <span className="block max-w-40 truncate" title={value}>{value ?? '–'}</span>;
  }
  return value ?? '–';
}

function Records() {
  const [showQRImport, setShowQRImport] = useState(false);
  const [showQRExport, setShowQRExport] = useState(false);
  const [matches, setMatches] = useState(loadMatches);
  const tsvFileInputRef = useRef(null);

  const hasData = matches.length > 0;

  function exportTSV() {
    const tsv = matchesToTSV(matches);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scouting_data.tsv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleTSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = tsvToMatches(event.target.result);
      localStorage.setItem('matches', JSON.stringify(parsed));
      setMatches(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <Layout header="Records" tab={0}>
      {!(showQRImport || showQRExport) && (
        <div className="flex flex-col h-full">
          <div className="grid grid-cols-2 gap-2 p-2">
            <button
              onClick={exportTSV}
              disabled={!hasData}
              className="p-3 border rounded-lg flex justify-center text-white bg-[#212529] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Export TSV
            </button>
            <button
              onClick={() => setShowQRExport(true)}
              disabled={!hasData}
              className="p-3 border rounded-lg flex justify-center text-white bg-[#212529] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Export QR
            </button>
            <button
              onClick={() => tsvFileInputRef.current.click()}
              className="p-3 border border-[#212529] rounded-lg flex justify-center"
            >
              Import TSV
            </button>
            <button
              onClick={() => setShowQRImport(true)}
              className="p-3 border border-[#212529] rounded-lg flex justify-center"
            >
              Import QR
            </button>
          </div>
          <input
            ref={tsvFileInputRef}
            type="file"
            accept=".tsv"
            className="hidden"
            onChange={handleTSVImport}
          />

          {hasData ? (
            <div className="flex-1 overflow-auto">
              <table className="text-xs border-collapse w-max min-w-full">
                <thead>
                  <tr>
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        className="sticky top-0 px-3 py-2 text-left font-semibold whitespace-nowrap bg-[#212529] text-white border-b border-[#495057]"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                      {COLUMNS.map(col => (
                        <td
                          key={col.key}
                          className="px-3 py-2 whitespace-nowrap border-b border-[#E9ECEF]"
                        >
                          <Cell column={col} value={match[col.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex justify-center items-center text-sm text-gray-400">
              No records found.
            </div>
          )}
        </div>
      )}
      {showQRImport && (
        <Import
          close={() => setShowQRImport(false)}
          onImport={(result) => {
            const merged = mergeMatches(loadMatches(), JSON.parse(result));
            localStorage.setItem('matches', JSON.stringify(merged));
            setMatches(merged);
            setShowQRImport(false);
          }}
        />
      )}
      {showQRExport && <Export close={() => setShowQRExport(false)} value={localStorage.getItem('matches')} />}
    </Layout>
  );
}

export default Records;
