import Sheet from './Sheet';

// Sheet with a list of options. `options` is [{ label, description, onSelect }].
function BottomSheet({ title, options, onClose }) {
  return (
    <Sheet
      onClose={onClose}
      header={title && <p className="section-label px-1">{title}</p>}
    >
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
    </Sheet>
  );
}

export default BottomSheet;
