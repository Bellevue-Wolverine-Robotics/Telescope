// Yes/No question. Stored as true/false.
function Switch({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="field-label">{label}</label>
      <div className="segment-control">
        {[['No', false], ['Yes', true]].map(([text, v]) => (
          <button
            key={text}
            type="button"
            onClick={() => onChange(v)}
            className={`segment-btn h-10 text-base ${value === v ? 'active' : ''}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Switch;
