import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Form from '../components/layout/Form';
import MatchDetails from '../components/layout/MatchDetails';
import matchConfiguration from '../assets/match.json';

function ScoutingMatch(props) {
  const [page, setPage] = useState(props.page || 0);

  return (
    <Layout header="Match Scouting" tab={1}>
      <div className="h-full flex flex-col p-5 gap-5">
        {page === 0 && <MatchDetails onSubmit={() => setPage(1)} />}
        {page === 1 && <Form elements={matchConfiguration.elements} />}
      </div>
    </Layout>
  );
}

export default ScoutingMatch;
