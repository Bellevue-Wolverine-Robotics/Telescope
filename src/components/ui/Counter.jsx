import { useState, useEffect } from 'react';

function Counter({ label, value, onChange, min = 0, max = 100 }) {
  const [display, setDisplay] = useState(String(value));

  useEffect(() => {
    setDisplay(String(value));
  }, [value]);

  function handleChange(e) {
    const raw = e.target.value;
    setDisplay(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= min && n <= max) onChange(n);
  }

  function handleBlur() {
    const n = parseInt(display, 10);
    const clamped = isNaN(n) ? min : Math.min(Math.max(n, min), max);
    setDisplay(String(clamped));
    onChange(clamped);
  }

  return (
    <div>
      <label>{label}</label>
      <div className="flex w-fit border border-[var(--color-border-mid)] rounded-md">
        <button className="w-12 h-9" onClick={() => onChange(Math.min(value + 1, max))} disabled={value >= max}>+</button>
        <input
          type="number"
          value={display}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          className="w-10 h-9 border-x border-[var(--color-border-div)] text-center bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button className="w-12 h-9" onClick={() => onChange(Math.max(value - 1, min))} disabled={value <= min}>-</button>
      </div>
    </div>
  );
}

export default Counter;
