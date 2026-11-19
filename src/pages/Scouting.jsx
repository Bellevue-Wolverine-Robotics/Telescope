import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Export from '../components/ui/Export';
import Import from '../components/ui/Import';
import BottomSheet from '../components/ui/BottomSheet';
import MenuCard from '../components/ui/MenuCard';
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

// Form for each phase: where its "New" card goes and where its draft is saved.
const FORMS = {
  Match: { to: '/scouting/match', draftKey: 'draftMatch' },
  Pit:   { to: '/scouting/pit',   draftKey: 'draftPit'   },
};

// The form saves a draft as soon as it opens, so only count it as in progress
// once the scouter has moved past the first page or entered something.
function hasDraft(phase, draftKey) {
  let draft;
  try { draft = JSON.parse(localStorage.getItem(draftKey)); } catch { return false; }
  if (!draft) return false;
  if ((draft.page ?? 0) > 0) return true;
  return phase.form.pages.flatMap(p => p.questions).some(q => {
    const v = draft.data?.[q.id];
    if (v === undefined) return false;
    if (q.type === 'counter') return v !== (q.min ?? 0);
    if (q.type === 'switch')  return v !== false;
    return v !== '';
  });
}

function entriesTotal(n) {
  return `${n} ${n !== 1 ? 'entries' : 'entry'} total`;
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

          <p className="section-label px-1">New</p>
          {PHASES.map(p => (
            <MenuCard key={p} onClick={() => navigate(FORMS[p].to)} title={p}>
              {hasDraft(PHASE_CONFIG[p], FORMS[p].draftKey) && (
                <span className="badge">
                  <span className="size-1.5 rounded-full bg-[var(--color-primary)]" />
                  Draft saved
                </span>
              )}
            </MenuCard>
          ))}

          <p className="section-label px-1 pt-4">Records</p>
          <MenuCard onClick={openTable} disabled={!hasData} title="View" />
          <MenuCard onClick={() => setSheet('import')} title="Import" />
          <MenuCard onClick={() => setSheet('export')} disabled={!hasData} title="Export" />

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
          subtitle={entriesTotal(records[tablePhase].length)}
          tabs={<Tabs options={PHASES} value={tablePhase} onChange={setTablePhase} className="-mx-4" />}
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
