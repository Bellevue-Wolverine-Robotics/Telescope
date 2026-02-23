import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Export from '../components/ui/Export';
import Import from '../components/ui/Import';
import PhaseToggle from '../components/ui/PhaseToggle';
import {
  PHASE_CONFIG,
  classifyAndValidateImport,
  convertRecordDataJSONToTSV,
  convertRecordDataTSVToJSON,
  loadRecordDataAsJSON,
  mergeAndStoreRecordData,
} from '../lib/RecordData';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const phaseKey = searchParams.get('phase') ?? 'Match';
  const phase = PHASE_CONFIG[phaseKey] ?? PHASE_CONFIG.Match;

  const [showQRImport, setShowQRImport] = useState(false);
  const [showQRExport, setShowQRExport] = useState(false);
  const [recordDataJSON, setRecordDataJSON] = useState(() => loadRecordDataAsJSON(phase));
  const [message, setMessage] = useState(null);
  const tsvFileInputRef = useRef(null);

  useEffect(() => {
    if (!searchParams.get('phase')) {
      setSearchParams({ phase: 'Match' }, { replace: true });
    }
    setRecordDataJSON(loadRecordDataAsJSON(phase));
    setMessage(null);
  }, [phaseKey]);

  const hasData = recordDataJSON.length > 0;

  function exportTSV() {
    const tsv = convertRecordDataJSONToTSV(phase, recordDataJSON);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scouting_data.tsv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(parsed) {
    const result = classifyAndValidateImport(parsed);
    if (!result.valid) {
      setMessage({ type: 'error', lines: result.errors });
      return;
    }

    const summaryParts = [];
    for (const [phaseKey, records] of Object.entries(result.byPhase)) {
      if (records.length === 0) continue;
      const phaseConfig = PHASE_CONFIG[phaseKey];
      const existing    = loadRecordDataAsJSON(phaseConfig);
      const existingKeys = new Set(existing.map(r => phaseConfig.getUniqueKey(r)));
      const added  = records.filter(r => !existingKeys.has(phaseConfig.getUniqueKey(r))).length;
      const merged = records.length - added;
      mergeAndStoreRecordData(phaseConfig, records);
      const sub = [];
      if (added  > 0) sub.push(`${added} new`);
      if (merged > 0) sub.push(`${merged} merged`);
      summaryParts.push(`${records.length} ${phaseKey.toLowerCase()} record${records.length !== 1 ? 's' : ''} (${sub.join(', ')})`);
    }

    setRecordDataJSON(loadRecordDataAsJSON(phase));
    const text = summaryParts.length ? summaryParts.join(' and ') + ' imported.' : 'No records to import.';
    setMessage({ type: 'success', lines: [text] });
  }

  function handleTSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleImport(convertRecordDataTSVToJSON(event.target.result));
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <Layout header="Records" tab={0}>
      {!(showQRImport || showQRExport) && (
        <div className="flex flex-col h-full">
          <PhaseToggle />
          {message && (
            <div className={`message ${message.type}`}>
              <div className="flex flex-col gap-0.5">
                {message.lines.map((line, i) => <span key={i}>{line}</span>)}
              </div>
              <button onClick={() => setMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 p-2">
            <button onClick={exportTSV}              disabled={!hasData} className="btn-primary">Export TSV</button>
            <button onClick={() => setShowQRExport(true)} disabled={!hasData} className="btn-primary">Export QR</button>
            <button onClick={() => tsvFileInputRef.current.click()}  className="btn-outline">Import TSV</button>
            <button onClick={() => setShowQRImport(true)}            className="btn-outline">Import QR</button>
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
                    {phase.columns.map(col => (
                      <th key={col.key} className="table-th">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recordDataJSON.map((record, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                      {phase.columns.map(col => (
                        <td key={col.key} className="table-td">
                          <Cell column={col} value={record[col.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex justify-center items-center text-sm text-[var(--color-muted)]">
              No records found.
            </div>
          )}
        </div>
      )}
      {showQRImport && (
        <Import
          close={() => setShowQRImport(false)}
          onImport={(recordDataString) => {
            setShowQRImport(false);
            let parsed;
            try { parsed = JSON.parse(recordDataString); } catch {
              setMessage({ type: 'error', text: 'Invalid JSON format.' });
              return;
            }
            handleImport(parsed);
          }}
        />
      )}
      {showQRExport && (
        <Export
          close={() => setShowQRExport(false)}
          value={JSON.stringify(recordDataJSON)}
        />
      )}
    </Layout>
  );
}

export default Records;
