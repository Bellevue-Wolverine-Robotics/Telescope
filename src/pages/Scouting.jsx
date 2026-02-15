import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

function Scouting() {
  return (
    <Layout header="Scouting" tab={1}>
      <div className="flex flex-col justify-center items-center h-full p-5">
        <Link to="/scouting/match" className="p-3 w-full bg-[#212529] text-white border rounded-lg m-2 flex justify-center">
          Qualification Match
        </Link>
        <Link to="/scouting/pit" className="p-3 w-full border border-[#212529] rounded-lg m-2 flex justify-center">
          Pit Interview
        </Link>
      </div>
    </Layout>
  );
}

export default Scouting;
