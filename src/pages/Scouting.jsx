import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Export from '../components/ui/Export';
import Import from '../components/ui/Import';
import BottomSheet from '../components/ui/BottomSheet';
import Modal from '../components/ui/Modal';
import RecordTable from '../components/ui/RecordTable';
import Tabs from '../components/ui/Tabs';
import {
  PHASE_CONFIG,
  classifyAndValidateImport,
  convertRecordDataJSONToCSV,
  convertRecordDataCSVToJSON,
  getRecordIdentity,
  loadRecordDataAsJSON,
  mergeAndStoreRecordData,
} from '../lib/RecordData';

const PHASES = Object.keys(PHASE_CONFIG);

const ICON = { fill: 'none', viewBox: '0 0 24 24', strokeWidth: 1.5, stroke: 'currentColor', className: 'size-8' };

const StopwatchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...ICON}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.25h4M12 2.25v3M18.25 6.25l1.25-1.25M12 9.75v3.75" />
    <circle cx="12" cy="13.5" r="7.5" />
  </svg>
);

const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...ICON}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.867 19.125h.008v.008h-.008v-.008Z" />
  </svg>
);

// Form for each phase: its tile icon and where it goes.
const FORMS = {
  Match: { to: '/scouting/match', Icon: StopwatchIcon },
  Pit:   { to: '/scouting/pit',   Icon: WrenchIcon    },
};

function entries(n, kind) {
  return `${n} ${kind} ${n !== 1 ? 'entries' : 'entry'}`;
}

async function loadAll() {
  const lists = await Promise.all(PHASES.map(p => loadRecordDataAsJSON(PHASE_CONFIG[p])));
  return Object.fromEntries(PHASES.map((p, i) => [p, lists[i]]));
}

function Scouting() {
  const navigate = useNavigate();

  const [records, setRecords] = useState({ Match: [], Pit: [] });
  const [tablePhase, setTablePhase] = useState(null); // 'Match' | 'Pit' | null (closed)
  const [showQRImport, setShowQRImport] = useState(false);
  const [showQRExport, setShowQRExport] = useState(false);
  const [sheet, setSheet] = useState(null); // 'import' | 'export' | null
  const [message, setMessage] = useState(null);
  const csvFileInputRef = useRef(null);

  useEffect(() => {
    loadAll().then(setRecords);
  }, []);

  const hasData = PHASES.some(p => records[p].length > 0);

  function exportCSV(phaseKey) {
    const csv = convertRecordDataJSONToCSV(PHASE_CONFIG[phaseKey], records[phaseKey]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${phaseKey.toLowerCase()}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(parsed) {
    const result = classifyAndValidateImport(parsed);
    if (!result.valid) {
      setMessage({ type: 'error', lines: result.errors });
      return;
    }

    const summaryParts = [];
    for (const [phaseKey, imported] of Object.entries(result.byPhase)) {
      if (imported.length === 0) continue;
      const phaseConfig  = PHASE_CONFIG[phaseKey];
      const existing     = await loadRecordDataAsJSON(phaseConfig);
      const seen         = new Set(existing.map(r => getRecordIdentity(phaseConfig, r)));
      let added = 0;
      for (const r of imported) {
        const identity = getRecordIdentity(phaseConfig, r);
        if (!seen.has(identity)) { seen.add(identity); added++; }
      }
      const alreadyHad = imported.length - added;
      await mergeAndStoreRecordData(phaseConfig, imported);
      const sub = [];
      if (added      > 0) sub.push(`${added} new`);
      if (alreadyHad > 0) sub.push(`${alreadyHad} already on this device`);
      summaryParts.push(`${imported.length} ${phaseKey.toLowerCase()} record${imported.length !== 1 ? 's' : ''} (${sub.join(', ')})`);
    }

    setRecords(await loadAll());
    const text = summaryParts.length ? summaryParts.join(' and ') + ' imported.' : 'No records to import.';
    setMessage({ type: 'success', lines: [text] });
  }

  function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleImport(convertRecordDataCSVToJSON(event.target.result));
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Open the table on the first phase that has records.
  function openTable() {
    setTablePhase(PHASES.find(p => records[p].length > 0) ?? PHASES[0]);
  }

  return (
    <Layout header="Scouting" tab={1}>
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col gap-2 p-4">

          <div className="flex gap-3">
            {PHASES.map(p => {
              const { to, Icon } = FORMS[p];
              return (
                <button key={p} type="button" onClick={() => navigate(to)} className="start-tile">
                  <Icon />
                  <span className="text-lg font-semibold">{p}</span>
                </button>
              );
            })}
          </div>

          <p className="section-label px-1 pt-4">Records</p>
          <div className="card">
            <p className="text-sm text-[var(--color-muted)]">
              {PHASES.map(p => entries(records[p].length, p.toLowerCase())).join(' · ')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={openTable} disabled={!hasData} className="btn-outline">View</button>
              <button onClick={() => setSheet('import')} className="btn-outline">Import</button>
              <button onClick={() => setSheet('export')} disabled={!hasData} className="btn-outline">Export</button>
            </div>
          </div>

          {message && (
            <div className={`message ${message.type} m-0 mt-2`}>
              <div className="flex flex-col gap-0.5">
                {message.lines.map((line, i) => <span key={i}>{line}</span>)}
              </div>
              <button onClick={() => setMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}
        </div>
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleCSVImport}
        />
      </div>
      {tablePhase && (
        <RecordTable
          title="Records"
          tabs={<Tabs options={PHASES} value={tablePhase} onChange={setTablePhase} className="-mx-6" />}
          columns={PHASE_CONFIG[tablePhase].columns}
          records={records[tablePhase]}
          onClose={() => setTablePhase(null)}
        />
      )}
      {showQRImport && (
        <Modal
          title="Import from QR code"
          description="Point the camera at the QR code on the other device."
          onClose={() => setShowQRImport(false)}
        >
          <Import
            onImport={(recordDataString) => {
              setShowQRImport(false);
              let parsed;
              try { parsed = JSON.parse(recordDataString); } catch {
                setMessage({ type: 'error', lines: ['Invalid JSON format.'] });
                return;
              }
              handleImport(parsed);
            }}
          />
        </Modal>
      )}
      {showQRExport && (
        <Modal
          title="Export records"
          description="Scan with Import → QR code on the other device."
          onClose={() => setShowQRExport(false)}
        >
          <Export value={JSON.stringify(PHASES.flatMap(p => records[p]))} />
        </Modal>
      )}
      {sheet === 'import' && (
        <BottomSheet
          title="Import records"
          onClose={() => setSheet(null)}
          options={[
            { label: 'CSV file', description: 'Choose a .csv file from this device', onSelect: () => csvFileInputRef.current.click() },
            { label: 'QR code',  description: 'Scan QR codes from another device',  onSelect: () => setShowQRImport(true) },
          ]}
        />
      )}
      {sheet === 'export' && (
        <BottomSheet
          title="Export records"
          onClose={() => setSheet(null)}
          options={[
            { label: 'QR code', description: 'Show match and pit records for another device to scan', onSelect: () => setShowQRExport(true) },
            ...PHASES.filter(p => records[p].length > 0).map(p => ({
              label:       `${p} CSV`,
              description: `Download ${p.toLowerCase()} records as a spreadsheet file`,
              onSelect:    () => exportCSV(p),
            })),
          ]}
        />
      )}
    </Layout>
  );
}

export default Scouting;
