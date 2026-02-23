function Switch({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`switch-track ${value ? 'on' : 'off'}`}
      >
        <span className={`switch-thumb ${value ? 'on' : 'off'}`} />
      </button>
    </div>
  );
}

export default Switch;
