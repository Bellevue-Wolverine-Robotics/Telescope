// Underline tabs for switching between sections (e.g. Match / Pit).
function Tabs({ options, value, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {options.map(o => (
        <button
          key={o}
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={`tab ${value === o ? 'active' : ''}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
