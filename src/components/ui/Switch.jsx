function Switch() {
  return (
    <label className="relative w-10 h-5">
      <input className="hidden" type="checkbox" />
      <span className="absolute rounded-full bg-[#333] inset-0 w-5 h-5"></span>
    </label>
  );
}

export default Switch;
