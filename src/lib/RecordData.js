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

// The forms that ship with this version of the app. A device only switches to one of these once it
// has no records for that phase; until then it keeps the form its records were collected with.
const LATEST_FORMS = { Match: matchForm, Pit: pitForm };
export const PHASES = Object.keys(LATEST_FORMS);
const STORAGE_KEYS = { Match: 'matches', Pit: 'pit' };
const LATEST_COLUMNS = Object.fromEntries(PHASES.map(p => [p, columnsFromForm(LATEST_FORMS[p])]));

// What a form's records hold: each question's id and the kind of value it stores (number,
// true/false or text). Anything else (labels, options, limits, layout) can change without
// making existing records invalid, so it doesn't count as a new form.
function formSignature(form) {
  return JSON.stringify(
    form.pages
      .flatMap(page => page.questions)
      .map(q => {
        const type = QUESTION_TYPE_TO_COLUMN_TYPE[q.type];
        // Dropdown answers and notes are both stored as text
        return [q.id, type === 'text' ? 'string' : type];
      })
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  );
}

// A short id for a form's signature (8 hex characters, 32-bit FNV-1a), so two devices can check
// they're on the same form. Changes only when the signature does.
export function formHash(form) {
  let hash = 0x811c9dc5;
  for (const ch of formSignature(form)) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Records are ordered oldest first by the app-filled timestamp, so sorting never
// depends on which questions a form asks. Timestamps are ISO 8601 UTC strings,
// which sort correctly as plain text.
function byTimestamp(a, b) {
  const ta = a.timestamp ?? '';
  const tb = b.timestamp ?? '';
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}

// Two records are duplicates only when every field is identical.
// Records for the same match/team with different data are both kept.
function getRecordIdentity(columns, record) {
  return JSON.stringify(columns.map(({ key }) => record[key]));
}

function checkRecord(columns, record) {
  const expectedKeys   = columns.map(c => c.key);
  const expectedKeySet = new Set(expectedKeys);
  const missing    = expectedKeys.filter(k => !(k in record));
  const extra      = Object.keys(record).filter(k => !expectedKeySet.has(k));
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
  const keysMatch = missing.length === 0 && extra.length === 0;
  return { missing, extra, typeErrors, keysMatch, valid: keysMatch && typeErrors.length === 0 };
}

// Most per-row errors shown for malformed data, so a bad file doesn't fill the screen
const MAX_ROW_ERRORS = 3;

// Sorts imported records into phases by matching them against this device's forms.
// device: { Match: { columns, outdated }, Pit: { ... } }, as returned by loadAllPhases.
export function classifyAndValidateImport(records, device) {
  if (!Array.isArray(records))
    return { valid: false, errors: ['Data must be a JSON array.'] };
  if (records.length === 0)
    return { valid: false, errors: ['Data array is empty.'] };

  const byPhase   = Object.fromEntries(PHASES.map(p => [p, []]));
  const newer     = new Set(); // phases where the data is from the latest form but this device isn't
  const different = new Set(); // phases where the data is from some other version of the form
  const rowErrors = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      rowErrors.push(`Row ${i + 1}: not a record.`);
      continue;
    }

    const results = PHASES.map(p => ({ phase: p, ...checkRecord(device[p].columns, record) }));
    const exact   = results.find(r => r.valid);
    if (exact) {
      byPhase[exact.phase].push(record);
      continue;
    }

    // Find closest form by fewest field discrepancies
    const closest = results.reduce((a, b) =>
      (a.missing.length + a.extra.length) <= (b.missing.length + b.extra.length) ? a : b
    );
    if (closest.keysMatch) {
      // Right questions, wrong values: malformed rather than from another form
      rowErrors.push(`Row ${i + 1}: ${closest.typeErrors.join('; ')}.`);
    } else if (device[closest.phase].outdated && checkRecord(LATEST_COLUMNS[closest.phase], record).keysMatch) {
      newer.add(closest.phase);
    } else {
      different.add(closest.phase);
    }
  }

  const errors = [
    ...[...newer].map(p =>
      `This data uses a newer ${p.toLowerCase()} form. Clear this device's ${p.toLowerCase()} records to update.`),
    ...[...different].map(p =>
      `This data uses a different version of the ${p.toLowerCase()} form. Both devices need the same version.`),
    ...rowErrors.slice(0, MAX_ROW_ERRORS),
  ];
  if (rowErrors.length > MAX_ROW_ERRORS)
    errors.push(`…and ${rowErrors.length - MAX_ROW_ERRORS} more rows with errors.`);

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, byPhase };
}

// ── IndexedDB storage ─────────────────────────────────────────────
// One entry per phase: { phase, data, form }, where data is the records and form is the form
// they were collected with.
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

async function readEntry(phaseKey) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly')
                  .objectStore(STORE_NAME)
                  .get(STORAGE_KEYS[phaseKey]);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
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

// Fires 'change' whenever stored records change, so screens showing them can reload.
export const recordEvents = new EventTarget();

async function writeEntry(phaseKey, records, form) {
  requestPersistentStorage();
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .put({ phase: STORAGE_KEYS[phaseKey], data: records, form });
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
  recordEvents.dispatchEvent(new Event('change'));
}

// Reads a phase's entry and writes back whatever change(entry) asks for, in one transaction, so no
// other save can land between the read and the write and be overwritten. change returns
// { result, write }, where write is { records, form } to store, or null to leave the entry as is.
async function updateEntry(phaseKey, change) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let result;
    let wrote = false;
    store.get(STORAGE_KEYS[phaseKey]).onsuccess = e => {
      const update = change(e.target.result);
      result = update.result;
      if (update.write) {
        requestPersistentStorage();
        store.put({ phase: STORAGE_KEYS[phaseKey], data: update.write.records, form: update.write.form });
        wrote = true;
      }
    };
    tx.oncomplete = () => {
      if (wrote) recordEvents.dispatchEvent(new Event('change'));
      resolve(result);
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Works out which form a stored entry's records use: { records, form, outdated }, where outdated
// means the device is held on an older form until its records are cleared.
function resolveEntry(phaseKey, entry) {
  const latest  = LATEST_FORMS[phaseKey];
  const records = entry?.data ?? [];
  // With no records there's nothing to keep, and a missing form means the records were saved
  // before forms were stored with them, so with this version's form.
  if (records.length === 0 || !entry.form || formSignature(entry.form) === formSignature(latest))
    return { records, form: latest, outdated: false };
  return { records, form: entry.form, outdated: true };
}

function withColumns(phaseKey, state) {
  return { ...state, columns: state.outdated ? columnsFromForm(state.form) : LATEST_COLUMNS[phaseKey] };
}

// This device's records for a phase and the form they use: { records, form, columns, outdated }.
export async function loadPhase(phaseKey) {
  try {
    return withColumns(phaseKey, await updateEntry(phaseKey, entry => {
      const state = resolveEntry(phaseKey, entry);
      // When the records still fit the latest form but the stored copy differs (only labels,
      // options or similar changed, or no copy was stored yet), store the latest one, so a later
      // change that does hold this device back keeps these updates.
      const stale = state.records.length > 0 && !state.outdated
        && JSON.stringify(entry.form) !== JSON.stringify(state.form);
      return { result: state, write: stale ? { records: state.records, form: state.form } : null };
    }));
  } catch {
    // Storing the update failed (e.g. storage full): still show what's stored
    try { return withColumns(phaseKey, resolveEntry(phaseKey, await readEntry(phaseKey))); }
    catch { return withColumns(phaseKey, resolveEntry(phaseKey, undefined)); }
  }
}

export async function loadAllPhases() {
  const phases = await Promise.all(PHASES.map(loadPhase));
  return Object.fromEntries(PHASES.map((p, i) => [p, phases[i]]));
}

// Adds records collected with this device's form, skipping duplicates. Returns how many were new.
export async function addRecords(phaseKey, newRecords) {
  return updateEntry(phaseKey, entry => {
    const { records, form, columns } = withColumns(phaseKey, resolveEntry(phaseKey, entry));
    const merged = new Map(records.map(r => [getRecordIdentity(columns, r), r]));
    let added = 0;
    for (const record of newRecords) {
      const identity = getRecordIdentity(columns, record);
      if (!merged.has(identity)) { merged.set(identity, record); added++; }
    }
    return { result: added, write: { records: [...merged.values()].sort(byTimestamp), form } };
  });
}

// Replaces all of a phase's records with ones collected with the latest form (or with none),
// which also switches this device to the latest form.
export async function replaceRecords(phaseKey, records) {
  await writeEntry(phaseKey, records, LATEST_FORMS[phaseKey]);
}

// Wrap a CSV field in quotes when it contains a comma, quote or line break,
// doubling any quotes inside it (standard CSV, as used by Sheets and Excel).
function escapeCSVField(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function convertRecordDataJSONToCSV(columns, recordDataJSON) {
  const header = columns.map(col => escapeCSVField(col.key)).join(',');
  const rows = recordDataJSON.map(record =>
    columns.map(({ key, type }) => {
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

// Reads a CSV file, converting each column by its type on this device's forms.
// device: as returned by loadAllPhases.
export function convertRecordDataCSVToJSON(text, device) {
  const allColumns  = PHASES.flatMap(p => device[p].columns);
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
