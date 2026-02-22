import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

function Scouting() {
  return (
    <Layout header="Scouting" tab={1}>
      <div className="flex flex-col justify-center items-center h-full p-5">
        <Link to="/scouting/match" className="p-3 w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border rounded-lg m-2 flex justify-center">
          Qualification Match
        </Link>
        <Link to="/scouting/pit" className="p-3 w-full border border-[var(--color-primary)] rounded-lg m-2 flex justify-center">
          Pit Interview
        </Link>
      </div>
    </Layout>
  );
}

export default Scouting;
