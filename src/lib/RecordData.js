const MATCH_COLUMNS = [
  { key: 'scouterName',   label: 'Scouter',      type: 'string'  },
  { key: 'matchNumber',   label: 'Match',         type: 'number'  },
  { key: 'teamNumber',    label: 'Team',          type: 'number'  },
  { key: 'robotPosition', label: 'Position',      type: 'string',  options: ['Red Bottom', 'Red Center', 'Red Top', 'Blue Bottom', 'Blue Center', 'Blue Top'] },
  { key: 'fuelMissedAuto',label: 'Missed Auto',   type: 'number',  min: 0, max: 100 },
  { key: 'autoPoints',    label: 'Auto Pts',      type: 'number',  min: 0, max: 100 },
  { key: 'autoClimb',     label: 'Auto Climb',    type: 'boolean' },
  { key: 'cycles',        label: 'Cycles',        type: 'number',  min: 0, max: 100 },
  { key: 'numberDepot',   label: 'Depot',         type: 'number',  min: 0, max: 100 },
  { key: 'intakeType',    label: 'Intake',        type: 'string',  options: ['Over Bumper', 'Depot', 'Through Bumper'] },
  { key: 'endgameClimb',  label: 'Climb',         type: 'string',  options: ['No Climb', 'L1', 'L2', 'L3'] },
  { key: 'superChargedRP',label: 'Super RP',      type: 'boolean' },
  { key: 'chargedRP',     label: 'Charged RP',    type: 'boolean' },
  { key: 'climbRP',       label: 'Climb RP',      type: 'boolean' },
  { key: 'yellowCard',    label: 'Yellow Card',   type: 'boolean' },
  { key: 'brokeDown',     label: 'Broke Down',    type: 'boolean' },
  { key: 'minorFouls',    label: 'Minor Fouls',   type: 'number',  min: 0, max: 100 },
  { key: 'majorFouls',    label: 'Major Fouls',   type: 'number',  min: 0, max: 100 },
  { key: 'playstyle',     label: 'Playstyle',     type: 'string',  options: ['Offense', 'Defense', 'Both'] },
  { key: 'redScore',      label: 'Red',           type: 'number'  },
  { key: 'blueScore',     label: 'Blue',          type: 'number'  },
  { key: 'result',        label: 'Result',        type: 'string',  options: ['Win', 'Loss'] },
  { key: 'observations',  label: 'Notes',         type: 'text'    },
];

const PIT_COLUMNS = [
  { key: 'scouterName',   label: 'Scouter',       type: 'string'  },
  { key: 'teamNumber',    label: 'Team',           type: 'number'  },
  { key: 'weight',        label: 'Weight (lbs)',   type: 'number'  },
  { key: 'drivetrain',    label: 'Drivetrain',     type: 'string',  options: ['Swerve', 'Tank', 'Mecanum'] },
  { key: 'hasAutoAlign',  label: 'Auto Align',     type: 'boolean' },
  { key: 'autoDescription',label: 'Auto Notes',   type: 'text'    },
  { key: 'hopperCapacity',label: 'Hopper',         type: 'number',  min: 0, max: 100 },
  { key: 'shooterSpeed',  label: 'Shooter',        type: 'number',  min: 0, max: 100 },
  { key: 'intakeSpeed',   label: 'Intake',         type: 'number',  min: 0, max: 100 },
  { key: 'supportedPaths',label: 'Paths',          type: 'string',  options: ['Bump', 'Trench', 'Both'] },
  { key: 'climbLevel',    label: 'Climb Lvl',      type: 'string',  options: ['None', 'L1', 'L2', 'L3'] },
  { key: 'climbType',     label: 'Climb Type',     type: 'string',  options: ['Side', 'Front', 'Both', 'Neither'] },
  { key: 'robotLength',   label: 'Length',         type: 'number'  },
  { key: 'robotHeight',   label: 'Height',         type: 'number'  },
  { key: 'robotWidth',    label: 'Width',          type: 'number'  },
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

export function convertRecordDataTSVToJSON(phase, text) {
  const columnByKey = new Map(phase.columns.map(col => [col.key, col]));
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
