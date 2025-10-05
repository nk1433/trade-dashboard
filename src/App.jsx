import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Navbar from './Components/molicules/Navbar';
import { useUpstoxWS } from './hooks/useUpstoxWS';
import { fetchPortfolioSize } from './Store/portfolio'; // adjust import path as necessary

const App = () => {
  const dispatch = useDispatch();

  useUpstoxWS();

  useEffect(() => {
    dispatch(fetchPortfolioSize());
  }, [dispatch]);

  return (
    <Navbar />
  );
};

export default App;
