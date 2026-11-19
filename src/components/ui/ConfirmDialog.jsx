// Centred confirmation popup. Tapping the dimmed background cancels.
function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <div className="overlay items-center p-6" onPointerDown={onCancel}>
      <div className="dialog" onPointerDown={e => e.stopPropagation()}>
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-[var(--color-muted)]">{message}</p>
        <div className="flex gap-2 pt-2">
          <button onClick={onCancel}  className="flex-1 btn-outline">Cancel</button>
          <button onClick={onConfirm} className="flex-1 btn-primary">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
