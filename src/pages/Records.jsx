import { useState } from 'react';
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

function Cell({ column, value }) {
  if (column === 'win') {
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded font-semibold text-white ${value ? 'bg-green-500' : 'bg-red-400'}`}>
        {value ? 'W' : 'L'}
      </span>
    );
  }
  if (BOOLEAN_KEYS.has(column)) {
    return <span className={value ? 'text-green-600' : 'text-gray-300'}>{ value ? '✓' : '✕' }</span>;
  }
  if (column === 'observations') {
    return <span className="block max-w-40 truncate" title={value}>{value ?? '–'}</span>;
  }
  return value ?? '–';
}

function Records() {
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  let matches = [];
  try {
    const raw = localStorage.getItem('matches');
    if (raw) matches = JSON.parse(raw);
  } catch {
    // not valid JSON
  }

  const hasData = Array.isArray(matches) && matches.length > 0;

  return (
    <Layout header="Records" tab={0}>
      {!(showImport || showExport) && (
        <div className="flex flex-col h-full">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setShowImport(true)}
              className="p-3 flex-1 bg-[#212529] text-white border rounded-lg flex justify-center"
            >
              Import
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="p-3 flex-1 border border-[#212529] rounded-lg flex justify-center"
            >
              Export
            </button>
          </div>

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
      {showImport && <Import close={() => setShowImport(false)} />}
      {showExport && <Export close={() => setShowExport(false)} value={localStorage.getItem('matches')} />}
    </Layout>
  );
}

export default Records;
