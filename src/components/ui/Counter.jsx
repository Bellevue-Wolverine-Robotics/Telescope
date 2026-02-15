function Counter(props) {
  return (
    <div>
      <label>{props.label}</label>
      <div className="flex w-fit border border-[#ADB5BD] rounded-md">
        <button className="w-12 h-9" onClick={() => props.onChange(props.value + 1)}>+</button>
        <span className="flex justify-center items-center w-10 h-9 border-x border-[#DEE2E6]">{props.value}</span>
        <button className="w-12 h-9" onClick={() => props.onChange(Math.max(props.value - 1, 0))}>-</button>
      </div>
    </div>
  );
}

export default Counter;
