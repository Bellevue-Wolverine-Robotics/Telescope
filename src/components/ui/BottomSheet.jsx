// Panel that slides up from the bottom with a list of options.
// `options` is [{ label, description, onSelect }]. Tapping the dimmed background cancels.
function BottomSheet({ title, options, onClose }) {
  return (
    <div className="overlay items-end" onPointerDown={onClose}>
      <div className="sheet" onPointerDown={e => e.stopPropagation()}>
        {title && <p className="section-label px-1 pb-1">{title}</p>}
        {options.map(o => (
          <button
            key={o.label}
            onClick={() => { onClose(); o.onSelect(); }}
            className="sheet-option"
          >
            <span className="font-medium">{o.label}</span>
            {o.description && <span className="text-sm text-[var(--color-muted)]">{o.description}</span>}
          </button>
        ))}
        <button onClick={onClose} className="btn-outline mt-1">Cancel</button>
      </div>
    </div>
  );
}

export default BottomSheet;
