
import Navbar from "./Components/molicules/Navbar";
import { useUpstoxWS } from "./hooks/useUpstoxWS";

const App = () => {
  useUpstoxWS();
  
  return (
    <Navbar />
  );
};

export default App;
