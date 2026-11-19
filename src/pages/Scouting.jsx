import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Export from '../components/ui/Export';
import Import from '../components/ui/Import';
import BottomSheet from '../components/ui/BottomSheet';
import MenuCard from '../components/ui/MenuCard';
import Modal from '../components/ui/Modal';
import PhaseToggle from '../components/ui/PhaseToggle';
import RecordTable from '../components/ui/RecordTable';
import {
  PHASE_CONFIG,
  classifyAndValidateImport,
  convertRecordDataJSONToCSV,
  convertRecordDataCSVToJSON,
  getRecordIdentity,
  loadRecordDataAsJSON,
  mergeAndStoreRecordData,
} from '../lib/RecordData';

// Form for each phase: where "New" goes and where its draft is saved.
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


function Scouting() {
  const [searchParams, setSearchParams] = useSearchParams();
  const phaseKey = searchParams.get('phase') ?? 'Match';
  const phase = PHASE_CONFIG[phaseKey] ?? PHASE_CONFIG.Match;
  const form = FORMS[phaseKey] ?? FORMS.Match;
  const navigate = useNavigate();

  const [showQRImport, setShowQRImport] = useState(false);
  const [showQRExport, setShowQRExport] = useState(false);
  const [sheet, setSheet] = useState(null); // 'import' | 'export' | null
  const [showTable, setShowTable] = useState(false);
  const [recordDataJSON, setRecordDataJSON] = useState([]);
  const [message, setMessage] = useState(null);
  const csvFileInputRef = useRef(null);

  useEffect(() => {
    if (!searchParams.get('phase')) {
      setSearchParams({ phase: 'Match' }, { replace: true });
    }
    loadRecordDataAsJSON(phase).then(data => {
      setRecordDataJSON(data);
      setMessage(null);
    });
  }, [phaseKey]);

  const hasData = recordDataJSON.length > 0;
  const phaseName = phaseKey.toLowerCase();
  const count = recordDataJSON.length;

  function exportCSV() {
    const csv = convertRecordDataJSONToCSV(phase, recordDataJSON);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scouting_data.csv';
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
    for (const [phaseKey, records] of Object.entries(result.byPhase)) {
      if (records.length === 0) continue;
      const phaseConfig  = PHASE_CONFIG[phaseKey];
      const existing     = await loadRecordDataAsJSON(phaseConfig);
      const seen         = new Set(existing.map(r => getRecordIdentity(phaseConfig, r)));
      let added = 0;
      for (const r of records) {
        const identity = getRecordIdentity(phaseConfig, r);
        if (!seen.has(identity)) { seen.add(identity); added++; }
      }
      const alreadyHad = records.length - added;
      await mergeAndStoreRecordData(phaseConfig, records);
      const sub = [];
      if (added      > 0) sub.push(`${added} new`);
      if (alreadyHad > 0) sub.push(`${alreadyHad} already on this device`);
      summaryParts.push(`${records.length} ${phaseKey.toLowerCase()} record${records.length !== 1 ? 's' : ''} (${sub.join(', ')})`);
    }

    setRecordDataJSON(await loadRecordDataAsJSON(phase));
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

  return (
    <Layout header="Scouting" tab={1}>
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
          <PhaseToggle />
          <MenuCard
            onClick={() => navigate(form.to)}
            title="New"
          >
            {hasDraft(phase, form.draftKey) && (
              <span className="badge">
                <span className="size-1.5 rounded-full bg-[var(--color-primary)]" />
                Draft saved
              </span>
            )}
          </MenuCard>
          <MenuCard
            onClick={() => setShowTable(true)}
            disabled={!hasData}
            title="Records"
          />
          <MenuCard
            onClick={() => setSheet('import')}
            title="Import"
          />
          <MenuCard
            onClick={() => setSheet('export')}
            disabled={!hasData}
            title="Export"
          />
          {message && (
            <div className={`message ${message.type} m-0`}>
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
      {showTable && (
        <RecordTable
          title={`${phaseKey} records`}
          subtitle={`${count} record${count !== 1 ? 's' : ''}`}
          columns={phase.columns}
          records={recordDataJSON}
          onClose={() => setShowTable(false)}
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
          title={`Export ${phaseName} records`}
          description="Scan with Import → QR code on the other device."
          onClose={() => setShowQRExport(false)}
        >
          <Export value={JSON.stringify(recordDataJSON)} />
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
          title={`Export ${phaseName} records`}
          onClose={() => setSheet(null)}
          options={[
            { label: 'CSV file', description: 'Download a spreadsheet file',         onSelect: exportCSV },
            { label: 'QR code',  description: 'Show QR codes for another device to scan', onSelect: () => setShowQRExport(true) },
          ]}
        />
      )}
    </Layout>
  );
}

export default Scouting;
