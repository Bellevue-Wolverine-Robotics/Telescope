function Select(props) {
  return(
    <select
    className="border border-[#ADB5BD] rounded-md p-3 my-1 [-webkit-appearance:none]"
    value={props.value}
    onChange={(event) => props.onChange(event.target.value)}
    >
      <option value={0}>{props.placeholder}</option>
      {props.options.map((option, index) => <option value={index + 1} key={index}>{option}</option>)}
    </select>
  );
}

export default Select;
