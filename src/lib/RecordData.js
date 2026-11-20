import matchForm from '../forms/match.json';
import pitForm from '../forms/pit.json';

// Metadata is filled in automatically by the app (not asked on the form),
// so it is defined here rather than in the form JSON files.
const METADATA_COLUMNS = [
  { key: 'timestamp',   label: 'Timestamp', type: 'string' },
  { key: 'scouterName', label: 'Scouter',   type: 'string' },
];

// How each question type from the form JSON is stored in a record.
const QUESTION_TYPE_TO_COLUMN_TYPE = {
  number:   'number',
  counter:  'number',
  dropdown: 'string',
  switch:   'boolean',
  notes:    'text',
};

function columnsFromForm(form) {
  const questions = form.pages.flatMap(page => page.questions);
  return [
    ...METADATA_COLUMNS,
    ...questions.map(q => ({
      key:     q.id,
      label:   q.tableLabel ?? q.label,
      type:    QUESTION_TYPE_TO_COLUMN_TYPE[q.type],
      min:     q.min,
      max:     q.max,
      options: q.options,
    })),
  ];
}

const MATCH_COLUMNS = columnsFromForm(matchForm);
const PIT_COLUMNS   = columnsFromForm(pitForm);

// Records are ordered oldest first by the app-filled timestamp, so sorting never
// depends on which questions a form asks. Timestamps are ISO 8601 UTC strings,
// which sort correctly as plain text.
function byTimestamp(a, b) {
  const ta = a.timestamp ?? '';
  const tb = b.timestamp ?? '';
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}

export const PHASE_CONFIG = {
  Match: {
    form:       matchForm,
    columns:    MATCH_COLUMNS,
    storageKey: 'matches',
  },
  Pit: {
    form:       pitForm,
    columns:    PIT_COLUMNS,
    storageKey: 'pit',
  },
};

// Two records are duplicates only when every field is identical.
// Records for the same match/team with different data are both kept.
export function getRecordIdentity(phase, record) {
  return JSON.stringify(phase.columns.map(({ key }) => record[key]));
}

export function classifyAndValidateImport(records) {
  if (!Array.isArray(records))
    return { valid: false, errors: ['Data must be a JSON array.'] };
  if (records.length === 0)
    return { valid: false, errors: ['Data array is empty.'] };

  const schemas = [
    { key: 'Match', columns: MATCH_COLUMNS },
    { key: 'Pit',   columns: PIT_COLUMNS   },
  ];

  function checkRecord(columns, record) {
    const expectedKeys = columns.map(c => c.key);
    const expectedKeySet = new Set(expectedKeys);
    const recordKeys = Object.keys(record);
    const missing    = expectedKeys.filter(k => !(k in record));
    const extra      = recordKeys.filter(k => !expectedKeySet.has(k));
    const typeErrors = [];
    for (const { key, type } of columns) {
      if (!(key in record)) continue;
      const v = record[key];
      if (type === 'boolean' && typeof v !== 'boolean')
        typeErrors.push(`"${key}" must be true or false`);
      else if (type === 'number' && typeof v !== 'number')
        typeErrors.push(`"${key}" must be a number`);
      else if ((type === 'string' || type === 'text') && typeof v !== 'string')
        typeErrors.push(`"${key}" must be a string`);
    }
    return { missing, extra, typeErrors, valid: missing.length === 0 && extra.length === 0 && typeErrors.length === 0 };
  }

  const byPhase = { Match: [], Pit: [] };
  const errors  = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      errors.push(`Row ${i + 1}: not an object.`);
      continue;
    }

    const results = schemas.map(s => ({ key: s.key, ...checkRecord(s.columns, record) }));
    const exact   = results.find(r => r.valid);
    if (exact) {
      byPhase[exact.key].push(record);
      continue;
    }

    // Find closest schema by fewest key discrepancies
    const closest = results.reduce((a, b) =>
      (a.missing.length + a.extra.length) <= (b.missing.length + b.extra.length) ? a : b
    );
    const parts = [];
    if (closest.missing.length)    parts.push(`missing ${closest.missing.map(k => `"${k}"`).join(', ')}`);
    if (closest.extra.length)      parts.push(`unexpected ${closest.extra.map(k => `"${k}"`).join(', ')}`);
    if (closest.typeErrors.length) parts.push(...closest.typeErrors);
    errors.push(`Row ${i + 1} (closest to ${closest.key}): ${parts.join('; ')}.`);
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, byPhase };
}

// ── IndexedDB storage ─────────────────────────────────────────────
const DB_NAME    = 'scouting';
const DB_VERSION = 1;
const STORE_NAME = 'records';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'phase' });
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror   = e => reject(e.target.error);
  });
}

export async function loadRecordDataAsJSON(phase) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readonly')
                    .objectStore(STORE_NAME)
                    .get(phase.storageKey);
      req.onsuccess = e => resolve(e.target.result?.data ?? []);
      req.onerror   = e => reject(e.target.error);
    });
  } catch { return []; }
}

// Ask the browser to keep this site's storage instead of clearing it when space runs low or the
// site goes unused for a while. Chrome and Safari decide on their own; Firefox asks the user.
// Asked when records are first saved, once per session.
let persistRequested = false;
function requestPersistentStorage() {
  if (persistRequested || !navigator.storage?.persist) return;
  persistRequested = true;
  navigator.storage.persisted()
    .then(persisted => persisted || navigator.storage.persist())
    .catch(() => {});
}

export async function storeRecordData(phase, recordDataJSON) {
  requestPersistentStorage();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .put({ phase: phase.storageKey, data: recordDataJSON });
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// Wrap a CSV field in quotes when it contains a comma, quote or line break,
// doubling any quotes inside it (standard CSV, as used by Sheets and Excel).
function escapeCSVField(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function convertRecordDataJSONToCSV(phase, recordDataJSON) {
  const header = phase.columns.map(col => escapeCSVField(col.key)).join(',');
  const rows = recordDataJSON.map(record =>
    phase.columns.map(({ key, type }) => {
      const value = record[key];
      if (type === 'boolean') return value ? 'Yes' : 'No';
      return escapeCSVField(value ?? '');
    }).join(',')
  );
  return [header, ...rows].join('\n') + '\n';
}

// Split CSV text into rows of fields, handling quoted fields that contain
// commas, doubled quotes and line breaks.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip byte order mark
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

  // Ignore blank lines
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}

export async function mergeAndStoreRecordData(phase, recordDataJSON) {
  const existing = await loadRecordDataAsJSON(phase);
  const merged   = mergeRecordData(phase, existing, recordDataJSON);
  await storeRecordData(phase, merged);
  return merged;
}

export function mergeRecordData(phase, existing, imported) {
  const merged = new Map(existing.map(r => [getRecordIdentity(phase, r), r]));
  for (const record of imported) {
    const identity = getRecordIdentity(phase, record);
    if (!merged.has(identity)) merged.set(identity, record);
  }
  return [...merged.values()].sort(byTimestamp);
}

export function convertRecordDataCSVToJSON(text) {
  const allColumns = [...MATCH_COLUMNS, ...PIT_COLUMNS];
  const columnByKey = new Map(allColumns.map(col => [col.key, col]));
  const [keys = [], ...dataRows] = parseCSV(text);
  return dataRows.map(values =>
    Object.fromEntries(
      keys.map((key, i) => {
        const col = columnByKey.get(key);
        const raw = values[i] ?? '';
        if (col?.type === 'boolean') return [key, raw === 'Yes'];
        if (col?.type === 'number')  return [key, Number(raw)];
        return [key, raw];
      })
    )
  );
}
