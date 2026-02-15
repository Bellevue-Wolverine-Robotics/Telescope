function TextArea(props) {
  return (
    <div>
      <label className="font-semibold">{props.label}</label>
      <textarea
      required
      inputMode={props.inputMode}
      type="text"
      className="resize-none peer border border-[#ADB5BD] rounded-md p-3 my-1 w-full"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

export default TextArea;
