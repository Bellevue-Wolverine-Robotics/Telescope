import { useState } from 'react';
import Counter from '../ui/Counter';
import Switch from '../ui/Switch';

function Form(props) {
  const [value, setValue] = useState(0);

  return (
    <div>
      <Counter label="L1 Missed" value={value} onChange={setValue} />
      <Switch />
    </div>
  );
}

export default Form;
