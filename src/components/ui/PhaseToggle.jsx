import { useSearchParams } from 'react-router-dom';

const PHASES = ['Match', 'Pit'];

function PhaseToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const phase = searchParams.get('phase') ?? 'Match';

  return (
    <div className="tabs" role="tablist">
      {PHASES.map((p) => (
        <button
          key={p}
          role="tab"
          aria-selected={phase === p}
          onClick={() => setSearchParams({ phase: p }, { replace: true })}
          className={`tab ${phase === p ? 'active' : ''}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export default PhaseToggle;
