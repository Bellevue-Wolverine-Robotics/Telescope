function TextInput(props) {
  return (
    <div className="relative">
      <input
        required
        inputMode={props.inputMode}
        type="text"
        className="peer field-input my-1"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      <label className="floating-label">{props.label}</label>
    </div>
  );
}

export default TextInput;
