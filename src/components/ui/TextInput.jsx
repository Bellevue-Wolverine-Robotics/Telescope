function TextInput(props) {
  return (
    <div className="relative">
      <input
      required
      inputMode={props.inputMode}
      type="text"
      className="peer border border-[var(--color-border-mid)] rounded-md p-3 my-1 w-full bg-[var(--color-surface)] text-[var(--color-primary)]"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      />
      <label className="absolute p-1 text-[var(--color-muted)] pointer-events-none left-3 top-3 duration-200 transition-all ease-in peer-focus:left-2 peer-focus:-top-2 peer-focus:text-xs peer-focus:bg-[var(--color-surface)] peer-focus:text-[var(--color-primary)] peer-valid:left-2 peer-valid:-top-2 peer-valid:text-xs peer-valid:bg-[var(--color-surface)] peer-valid:text-[var(--color-primary)]">{props.label}</label>
    </div>
  );
}

export default TextInput;
