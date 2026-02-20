import { useRef, useState } from 'react';
import Layout from '../components/layout/Layout';
import Export from '../components/ui/Export';
import Import from '../components/ui/Import';

const COLUMNS = [
  { key: 'scouterName',   label: 'Scouter'      },
  { key: 'matchNumber',   label: 'Match'         },
  { key: 'teamNumber',    label: 'Team'          },
  { key: 'robotPosition', label: 'Position'      },
  { key: 'autoPoints',    label: 'Auto Pts'      },
  { key: 'fuelMissedAuto',label: 'Missed Auto'   },
  { key: 'autoClimb',     label: 'Auto Climb'    },
  { key: 'cycles',        label: 'Cycles'        },
  { key: 'numberDepot',   label: 'Depot'         },
  { key: 'intakeType',    label: 'Intake'        },
  { key: 'endgameClimb',  label: 'Climb'         },
  { key: 'superChargedRP',label: 'Super RP'      },
  { key: 'chargedRP',     label: 'Charged RP'    },
  { key: 'climbRP',       label: 'Climb RP'      },
  { key: 'minorFouls',    label: 'Minor Fouls'   },
  { key: 'majorFouls',    label: 'Major Fouls'   },
  { key: 'yellowCard',    label: 'Yellow Card'   },
  { key: 'brokeDown',     label: 'Broke Down'    },
  { key: 'playstyle',     label: 'Playstyle'     },
  { key: 'redScore',      label: 'Red'           },
  { key: 'blueScore',     label: 'Blue'          },
  { key: 'win',           label: 'Result'        },
  { key: 'observations',  label: 'Notes'         },
];

const BOOLEAN_KEYS = new Set([
  'autoClimb', 'superChargedRP', 'chargedRP', 'climbRP', 'yellowCard', 'brokeDown',
]);

const NUMBER_KEYS = new Set([
  'matchNumber', 'teamNumber', 'fuelMissedAuto', 'autoPoints', 'cycles',
  'numberDepot', 'minorFouls', 'majorFouls', 'redScore', 'blueScore',
]);

function Cell({ column, value }) {
  if (column === 'win') {
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded font-semibold text-white ${value ? 'bg-green-500' : 'bg-red-400'}`}>
        {value ? 'W' : 'L'}
      </span>
    );
  }
  if (BOOLEAN_KEYS.has(column)) {
    return <span className={value ? 'text-green-600' : 'text-gray-300'}>{value ? '✓' : '✕'}</span>;
  }
  if (column === 'observations') {
    return <span className="block max-w-40 truncate" title={value}>{value ?? '–'}</span>;
  }
  return value ?? '–';
}

function parseMatches() {
  try {
    const raw = localStorage.getItem('matches');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function matchesToTSV(matches) {
  const headers = COLUMNS.map(c => c.key);
  const rows = matches.map(match =>
    headers.map(key => {
      const val = match[key];
      if (key === 'win') return val ? 'Y' : 'N';
      if (BOOLEAN_KEYS.has(key)) return val ? 'Yes' : 'No';
      return val ?? '';
    }).join('\t')
  );
  return [headers.join('\t'), ...rows].join('\n');
}

function tsvToMatches(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const obj = {};
    headers.forEach((header, i) => {
      const val = values[i] ?? '';
      if (header === 'win') obj[header] = val === 'Y';
      else if (BOOLEAN_KEYS.has(header)) obj[header] = val === 'Yes';
      else if (NUMBER_KEYS.has(header)) obj[header] = Number(val);
      else obj[header] = val;
    });
    return obj;
  });
}

function Records() {
  const [showQRImport, setShowQRImport] = useState(false);
  const [showQRExport, setShowQRExport] = useState(false);
  const [matches, setMatches] = useState(() => parseMatches());
  const tsvInputRef = useRef(null);

  const hasData = Array.isArray(matches) && matches.length > 0;

  function exportTSV() {
    if (!hasData) return;
    const tsv = matchesToTSV(matches);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scouting_data.tsv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleTSVFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = tsvToMatches(event.target.result);
      localStorage.setItem('matches', JSON.stringify(parsed));
      setMatches(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <Layout header="Records" tab={0}>
      {!(showQRImport || showQRExport) && (
        <div className="flex flex-col h-full">
          <div className="grid grid-cols-2 gap-2 p-2">
            <button
              onClick={() => setShowQRImport(true)}
              className="p-3 bg-[#212529] text-white border rounded-lg flex justify-center"
            >
              Import QR
            </button>
            <button
              onClick={() => setShowQRExport(true)}
              className="p-3 bg-[#212529] text-white border rounded-lg flex justify-center"
            >
              Export QR
            </button>
            <button
              onClick={() => tsvInputRef.current.click()}
              className="p-3 border border-[#212529] rounded-lg flex justify-center"
            >
              Import TSV
            </button>
            <button
              onClick={exportTSV}
              className="p-3 border border-[#212529] rounded-lg flex justify-center"
            >
              Export TSV
            </button>
          </div>
          <input
            ref={tsvInputRef}
            type="file"
            accept=".tsv"
            className="hidden"
            onChange={handleTSVFile}
          />

          {hasData ? (
            <div className="flex-1 overflow-auto">
              <table className="text-xs border-collapse w-max min-w-full">
                <thead>
                  <tr>
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        className="sticky top-0 px-3 py-2 text-left font-semibold whitespace-nowrap bg-[#212529] text-white border-b border-[#495057]"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                      {COLUMNS.map(col => (
                        <td
                          key={col.key}
                          className="px-3 py-2 whitespace-nowrap border-b border-[#E9ECEF]"
                        >
                          <Cell column={col.key} value={match[col.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex justify-center items-center text-sm text-gray-400">
              No records found.
            </div>
          )}
        </div>
      )}
      {showQRImport && <Import close={() => { setShowQRImport(false); setMatches(parseMatches()); }} />}
      {showQRExport && <Export close={() => setShowQRExport(false)} value={localStorage.getItem('matches')} />}
    </Layout>
  );
}

export default Records;
