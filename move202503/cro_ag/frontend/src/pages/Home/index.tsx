import { useNavigate } from 'react-router-dom';
const Home = () => {
  // ****
  const router = useNavigate();

  const toRedux = () => router('/toolkit');
  const toQuery = () => router('/query');

  return (
    <>
      <div>home *</div>
      <br />
      <button onClick={toRedux}>**redux-toolkitDemo</button>
      <br />
      <br />
      <button onClick={toQuery}>**react-queryDemo</button>
    </>
  );
};

export default Home;
