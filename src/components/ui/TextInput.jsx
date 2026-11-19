function TextInput(props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="field-label">{props.label}</label>
      <input
        inputMode={props.inputMode}
        type="text"
        className="field-input"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

export default TextInput;
