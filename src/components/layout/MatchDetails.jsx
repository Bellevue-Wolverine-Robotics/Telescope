import { useState } from 'react';
import NumericInput from '../ui/NumericInput';
import Select from '../ui/Select';

function MatchDetails(props) {
  const [match, setMatch] = useState('');
  const [team, setTeam] = useState('');

  const onSubmit = () => {
    if (match && team) {
      props.onSubmit({match: match, team: team});
    }
  };

  return (
    <>
      <NumericInput inputMode="numeric" label="Match Number" value={match} onChange={setMatch} />
      <NumericInput inputMode="numeric" label="Team Number" value={team} onChange={setTeam} />
      <button onClick={onSubmit} className={`p-3 w-30 ${match && team ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-mid)]'} text-[var(--color-on-primary)] border rounded-lg flex w-full justify-center`}>Start</button>
    </>
  );
}

export default MatchDetails;
