// Centred popup with a title, short instructions, content and a Close button.
// Tapping the dimmed background also closes it.
function Modal({ title, description, onClose, children }) {
  return (
    <div className="overlay items-center p-6" onPointerDown={onClose}>
      <div className="dialog" onPointerDown={e => e.stopPropagation()}>
        <p className="text-lg font-semibold">{title}</p>
        {description && <p className="text-sm text-[var(--color-muted)]">{description}</p>}
        <div className="py-2">{children}</div>
        <button onClick={onClose} className="btn-outline">Close</button>
      </div>
    </div>
  );
}

export default Modal;
