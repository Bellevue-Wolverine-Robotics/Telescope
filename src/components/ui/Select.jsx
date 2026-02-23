function Select(props) {
  return (
    <select
      className="field-input my-1"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    >
      <option value={0}>{props.placeholder}</option>
      {props.options.map((option, index) => <option value={index + 1} key={index}>{option}</option>)}
    </select>
  );
}

export default Select;
