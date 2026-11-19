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

export const PHASE_CONFIG = {
  Match: {
    form:       matchForm,
    columns:    MATCH_COLUMNS,
    storageKey: 'matches',
    sort:       (a, b) => a.matchNumber - b.matchNumber ||
                  (a.robotPosition < b.robotPosition ? -1 : a.robotPosition > b.robotPosition ? 1 : 0),
  },
  Pit: {
    form:       pitForm,
    columns:    PIT_COLUMNS,
    storageKey: 'pit',
    sort:       (a, b) => a.teamNumber - b.teamNumber,
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

export async function storeRecordData(phase, recordDataJSON) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .put({ phase: phase.storageKey, data: recordDataJSON });
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

export function convertRecordDataJSONToTSV(phase, recordDataJSON) {
  const header = phase.columns.map(col => col.key).join('\t');
  const rows = recordDataJSON.map(record =>
    phase.columns.map(({ key, type }) => {
      const value = record[key];
      if (type === 'boolean') return value ? 'Yes' : 'No';
      return value ?? '';
    }).join('\t')
  );
  return [header, ...rows].join('\n') + '\n';
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
  return [...merged.values()].sort(phase.sort);
}

export function convertRecordDataTSVToJSON(text) {
  const allColumns = [...MATCH_COLUMNS, ...PIT_COLUMNS];
  const columnByKey = new Map(allColumns.map(col => [col.key, col]));
  const [headerLine, ...dataLines] = text.trim().split(/\r?\n/);
  const keys = headerLine.split('\t');
  return dataLines.map(line => {
    const values = line.split('\t');
    return Object.fromEntries(
      keys.map((key, i) => {
        const col = columnByKey.get(key);
        const raw = values[i] ?? '';
        if (col?.type === 'boolean') return [key, raw === 'Yes'];
        if (col?.type === 'number')  return [key, Number(raw)];
        return [key, raw];
      })
    );
  });
}
