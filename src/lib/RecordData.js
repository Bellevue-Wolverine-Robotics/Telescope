const MATCH_COLUMNS = [
  { key: 'scouterName',   label: 'Scouter',      type: 'string'  },
  { key: 'matchNumber',   label: 'Match',         type: 'number',  min: 0, max: 200 },
  { key: 'teamNumber',    label: 'Team',          type: 'number',  min: 0, max: 100000 },
  { key: 'robotPosition', label: 'Position',      type: 'string',  options: ['Red Bottom', 'Red Center', 'Red Top', 'Blue Bottom', 'Blue Center', 'Blue Top'] },
  { key: 'fuelMissedAuto',label: 'Missed Auto',   type: 'number',  min: 0, max: 100 },
  { key: 'autoPoints',    label: 'Auto Pts',      type: 'number',  min: 0, max: 300 },
  { key: 'autoClimb',     label: 'Auto Climb',    type: 'boolean' },
  { key: 'cycles',        label: 'Cycles',        type: 'number',  min: 0, max: 50 },
  { key: 'numberDepot',   label: 'Depot',         type: 'number',  min: 0, max: 400 },
  { key: 'intakeType',    label: 'Intake',        type: 'string',  options: ['Over Bumper', 'Depot', 'Through Bumper'] },
  { key: 'endgameClimb',  label: 'Climb',         type: 'string',  options: ['No Climb', 'L1', 'L2', 'L3'] },
  { key: 'superChargedRP',label: 'Super RP',      type: 'boolean' },
  { key: 'chargedRP',     label: 'Charged RP',    type: 'boolean' },
  { key: 'climbRP',       label: 'Climb RP',      type: 'boolean' },
  { key: 'yellowCard',    label: 'Yellow Card',   type: 'boolean' },
  { key: 'brokeDown',     label: 'Broke Down',    type: 'boolean' },
  { key: 'minorFouls',    label: 'Minor Fouls',   type: 'number',  min: 0, max: 50 },
  { key: 'majorFouls',    label: 'Major Fouls',   type: 'number',  min: 0, max: 50 },
  { key: 'playstyle',     label: 'Playstyle',     type: 'string',  options: ['Offense', 'Defense', 'Both'] },
  { key: 'redScore',      label: 'Red',           type: 'number',  min: 0, max: 2000 },
  { key: 'blueScore',     label: 'Blue',          type: 'number',  min: 0, max: 2000 },
  { key: 'result',        label: 'Result',        type: 'string',  options: ['Win', 'Loss'] },
  { key: 'observations',  label: 'Notes',         type: 'text'    },
];

const PIT_COLUMNS = [
  { key: 'scouterName',   label: 'Scouter',       type: 'string'  },
  { key: 'teamNumber',    label: 'Team',           type: 'number',  min: 0, max: 100000 },
  { key: 'weight',        label: 'Weight (lbs)',   type: 'number',  min: 0, max: 200 },
  { key: 'drivetrain',    label: 'Drivetrain',     type: 'string',  options: ['Swerve', 'Tank', 'Mecanum'] },
  { key: 'hasAutoAlign',  label: 'Auto Align',     type: 'boolean' },
  { key: 'autoDescription',label: 'Auto Notes',   type: 'text'    },
  { key: 'hopperCapacity',label: 'Hopper',         type: 'number',  min: 0, max: 200 },
  { key: 'shooterSpeed',  label: 'Shooter',        type: 'number',  min: 0, max: 100 },
  { key: 'intakeSpeed',   label: 'Intake',         type: 'number',  min: 0, max: 100 },
  { key: 'supportedPaths',label: 'Paths',          type: 'string',  options: ['Bump', 'Trench', 'Both'] },
  { key: 'climbLevel',    label: 'Climb Lvl',      type: 'string',  options: ['None', 'L1', 'L2', 'L3'] },
  { key: 'climbType',     label: 'Climb Type',     type: 'string',  options: ['Side', 'Front', 'Both', 'Neither'] },
  { key: 'robotLength',   label: 'Length',         type: 'number',  min: 0, max: 150 },
  { key: 'robotHeight',   label: 'Height',         type: 'number',  min: 0, max: 50 },
  { key: 'robotWidth',    label: 'Width',          type: 'number',  min: 0, max: 150 },
];

export const PHASE_CONFIG = {
  Match: {
    columns:      MATCH_COLUMNS,
    storageKey:   'matches',
    getUniqueKey: m => `${m.matchNumber}-${m.teamNumber}`,
    sort:         (a, b) => a.matchNumber - b.matchNumber ||
                    (a.robotPosition < b.robotPosition ? -1 : a.robotPosition > b.robotPosition ? 1 : 0),
  },
  Pit: {
    columns:      PIT_COLUMNS,
    storageKey:   'pit',
    getUniqueKey: m => `${m.teamNumber}`,
    sort:         (a, b) => a.teamNumber - b.teamNumber,
  },
};

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

export function convertRecordDataStringToJSON(recordDataString) {
  try {
    if (recordDataString) return JSON.parse(recordDataString);
  } catch {}
  return [];
}

export function loadRecordDataAsJSON(phase) {
  try {
    const raw = localStorage.getItem(phase.storageKey);
    return convertRecordDataStringToJSON(raw);
  } catch {}
  return [];
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

export function storeRecordData(phase, recordDataJSON) {
  localStorage.setItem(phase.storageKey, JSON.stringify(recordDataJSON));
}

export function mergeAndStoreRecordData(phase, recordDataJSON) {
  const merged = mergeRecordData(phase, loadRecordDataAsJSON(phase), recordDataJSON);
  storeRecordData(phase, merged);
  return merged;
}

export function mergeRecordData(phase, existing, imported) {
  const merged = new Map(existing.map(m => [phase.getUniqueKey(m), m]));
  for (const record of imported) {
    merged.set(phase.getUniqueKey(record), record);
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
