export const COLUMNS = [
  { key: 'scouterName',   label: 'Scouter',      type: 'string'  },
  { key: 'matchNumber',   label: 'Match',         type: 'number'  },
  { key: 'teamNumber',    label: 'Team',          type: 'number'  },
  { key: 'robotPosition', label: 'Position',      type: 'string'  },
  { key: 'fuelMissedAuto',label: 'Missed Auto',   type: 'number'  },
  { key: 'autoPoints',    label: 'Auto Pts',      type: 'number'  },
  { key: 'autoClimb',     label: 'Auto Climb',    type: 'boolean' },
  { key: 'cycles',        label: 'Cycles',        type: 'number'  },
  { key: 'numberDepot',   label: 'Depot',         type: 'number'  },
  { key: 'intakeType',    label: 'Intake',        type: 'string'  },
  { key: 'endgameClimb',  label: 'Climb',         type: 'string'  },
  { key: 'superChargedRP',label: 'Super RP',      type: 'boolean' },
  { key: 'chargedRP',     label: 'Charged RP',    type: 'boolean' },
  { key: 'climbRP',       label: 'Climb RP',      type: 'boolean' },
  { key: 'yellowCard',    label: 'Yellow Card',   type: 'boolean' },
  { key: 'brokeDown',     label: 'Broke Down',    type: 'boolean' },
  { key: 'minorFouls',    label: 'Minor Fouls',   type: 'number'  },
  { key: 'majorFouls',    label: 'Major Fouls',   type: 'number'  },
  { key: 'playstyle',     label: 'Playstyle',     type: 'string'  },
  { key: 'redScore',      label: 'Red',           type: 'number'  },
  { key: 'blueScore',     label: 'Blue',          type: 'number'  },
  { key: 'result',        label: 'Result',        type: 'string'  },
  { key: 'observations',  label: 'Notes',         type: 'text'    },
];

const columnByKey = new Map(COLUMNS.map(col => [col.key, col]));

export function loadMatches() {
  try {
    const raw = localStorage.getItem('matches');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function matchesToTSV(matches) {
  const header = COLUMNS.map(col => col.key).join('\t');
  const rows = matches.map(match =>
    COLUMNS.map(({ key, type }) => {
      const value = match[key];
      if (type === 'boolean') return value ? 'Yes' : 'No';
      return value ?? '';
    }).join('\t')
  );
  return [header, ...rows].join('\n') + '\n';
}

export function mergeMatches(existing, imported) {
  const merged = new Map(existing.map(m => [`${m.matchNumber}-${m.teamNumber}`, m]));
  for (const match of imported) {
    merged.set(`${match.matchNumber}-${match.teamNumber}`, match);
  }
  return [...merged.values()].sort((a, b) => a.matchNumber - b.matchNumber || a.teamNumber - b.teamNumber);
}

export function tsvToMatches(text) {
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
