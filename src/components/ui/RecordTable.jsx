// Full-screen popup showing records as a scrollable table.
// Tapping the dimmed strip at the top or Close dismisses it.

// Table only: "Mar 14 14:05" in local time. Stored data and CSV keep the full ISO timestamp.
function formatTimestamp(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso ?? '–';
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
}

function Cell({ column, value }) {
  if (column.key === 'timestamp') {
    return <span title={value}>{formatTimestamp(value)}</span>;
  }
  if (column.type === 'boolean') {
    return <span className={value ? 'text-green-600' : 'text-[var(--color-border-mid)]'}>{value ? '✓' : '✕'}</span>;
  }
  if (column.type === 'text') {
    return <span className="block max-w-40 truncate" title={value}>{value ?? '–'}</span>;
  }
  return value ?? '–';
}

function RecordTable({ title, columns, records, onClose }) {
  return (
    <div className="overlay items-end" onPointerDown={onClose}>
      <div className="sheet sheet-full" onPointerDown={e => e.stopPropagation()}>
        <p className="text-lg font-semibold px-1">{title}</p>
        <div className="flex-1 min-h-0 overflow-auto -mx-4">
          <table className="text-xs border-collapse w-max min-w-full">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="table-th">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => (
                <tr key={i} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                  {columns.map(col => (
                    <td key={col.key} className="table-td">
                      <Cell column={col} value={record[col.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={onClose} className="btn-outline">Close</button>
      </div>
    </div>
  );
}

export default RecordTable;
