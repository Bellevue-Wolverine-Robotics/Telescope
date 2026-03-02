import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

function Scouting() {
  return (
    <Layout header="Scouting" tab={1}>
      <div className="flex flex-col justify-center items-center h-full p-5">
        <Link to="/scouting/match" className="btn-primary w-full m-2">
          Qualification Match
        </Link>
        <Link to="/scouting/pit" className="btn-outline w-full m-2">
          Pit Interview
        </Link>
      </div>
    </Layout>
  );
}

export default Scouting;
