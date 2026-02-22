import { useSearchParams } from 'react-router-dom';

const PHASES = ['Match', 'Pit'];

function PhaseToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const phase = searchParams.get('phase') ?? 'Match';

  return (
    <div className="flex rounded-lg border border-[#212529] overflow-hidden mx-2 mt-2">
      {PHASES.map((p, i) => (
        <button
          key={p}
          onClick={() => setSearchParams({ phase: p }, { replace: true })}
          className={`flex-1 py-2 text-sm font-medium ${i > 0 ? 'border-l border-[#212529]' : ''} ${phase === p ? 'bg-[#212529] text-white' : 'bg-white text-[#212529]'}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export default PhaseToggle;
