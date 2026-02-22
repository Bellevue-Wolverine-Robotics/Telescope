function Counter(props) {
  return (
    <div>
      <label>{props.label}</label>
      <div className="flex w-fit border border-[var(--color-border-mid)] rounded-md">
        <button className="w-12 h-9" onClick={() => props.onChange(props.value + 1)}>+</button>
        <span className="flex justify-center items-center w-10 h-9 border-x border-[var(--color-border-div)]">{props.value}</span>
        <button className="w-12 h-9" onClick={() => props.onChange(Math.max(props.value - 1, 0))}>-</button>
      </div>
    </div>
  );
}

export default Counter;
