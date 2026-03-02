function TextArea(props) {
  return (
    <div>
      <label className="font-semibold">{props.label}</label>
      <textarea
        required
        inputMode={props.inputMode}
        className="resize-none peer field-input my-1"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

export default TextArea;
