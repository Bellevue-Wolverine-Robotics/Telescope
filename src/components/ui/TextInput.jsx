function TextInput(props) {
  return (
    <div className="relative">
      <input
      required
      inputMode={props.inputMode}
      type="text"
      className="peer border border-[#ADB5BD] rounded-md p-3 my-1 w-full"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      />
      <label className="absolute p-1 text-[#6C757D] pointer-events-none left-3 top-3 duration-200 transition-all ease-in peer-focus:left-2 peer-focus:-top-2 peer-focus:text-xs peer-focus:bg-white peer-focus:text-black peer-valid:left-2 peer-valid:-top-2 peer-valid:text-xs peer-valid:bg-white peer-valid:text-black">{props.label}</label>
    </div>
  );
}

export default TextInput;
