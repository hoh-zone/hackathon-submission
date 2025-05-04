import { useAllBalance } from '@/hooks';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const Home = () => {
  // ****
  const router = useNavigate();

  const toRedux = () => router('/toolkit');
  const toQuery = () => router('/query');
  const currentAccount = useCurrentAccount();
  // const all = useAllBalance(currentAccount?.address);
  const [balances, setBalances] = useState<Record<string, bigint>>({});
  // useEffect(() => {
  //   if (all.isSuccess) {
  //     setBalances(all.data);
  //   }
  // }, [all, currentAccount?.address]);
  return (
    <>
      <div>home *</div>
      <br />
      <button onClick={toRedux}>**redux-toolkitDemo</button>
      <br />
      <br />
      <button onClick={toQuery}>**react-queryDemo</button>
      <div style={{ background: '#ffffff' }}>
        <h2>My Coin Balances:</h2>
        {Object.entries(balances).map(([coinType, balance]) => (
          <div key={coinType}>
            <strong>{coinType}</strong>: {balance.toString()}
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
