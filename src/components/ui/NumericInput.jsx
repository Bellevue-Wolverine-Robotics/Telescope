import TextInput from './TextInput';

function NumericInput({ label, value, onChange, max = 100000 }) {
  return (
    <TextInput
      inputMode="numeric"
      label={label}
      value={value}
      onChange={(v) => {
        const stripped = v.replace(/[^0-9]/g, '');
        if (stripped === '' || Number(stripped) <= max) onChange(stripped);
      }}
    />
  );
}

export default NumericInput;
