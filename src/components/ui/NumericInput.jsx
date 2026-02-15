import TextInput from './TextInput';

function NumericInput(props) {
  return(
    <TextInput
    inputMode="numeric"
    label={props.label}
    value={props.value}
    onChange={(value) => props.onChange(value.replace(/[^0-9]/g, ''))}
    />
  );
}

export default NumericInput;
