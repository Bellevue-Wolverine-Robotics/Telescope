import { useSearchParams } from 'react-router-dom';

const PHASES = ['Match', 'Pit'];

function PhaseToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const phase = searchParams.get('phase') ?? 'Match';

  return (
    <div className="segment-control">
      {PHASES.map((p) => (
        <button
          key={p}
          onClick={() => setSearchParams({ phase: p }, { replace: true })}
          className={`segment-btn ${phase === p ? 'active' : ''}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export default PhaseToggle;
