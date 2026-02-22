function TextField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-[var(--color-muted)]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="p-3 border border-[var(--color-border-mid)] rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)]"
      />
    </div>
  );
}

export default TextField;
