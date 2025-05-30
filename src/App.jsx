import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import PortfolioForm from "./Components/molicules/PortfolioForm";
import PortfolioTable from "./Components/molicules/PortfolioTable";
import AllocationIntentForm from "./Components/molicules/AllocationForm";
import ClosedPositions from "./Components/molicules/ClosedPositions";
import positions from "./config/position.json";
import PortfolioPerformanceChart from "./Components/molicules/Performance";
import PositionSizer from "./Components/molicules/PositionSize";
import DisplayScript from "./Components/molicules/Scripts";

const App = () => {
  return (
    <Router>
      <nav style={{ padding: "10px" }}>
        <Link to="/form" style={{ marginRight: "10px" }}>
          PF Details
        </Link>
        <Link to="/table">PF </Link>
        <Link to="/allocation">Allocation Calculator </Link>
        <Link to="/closed">Closed </Link>
        <Link to="/performance">Performance </Link>
        <Link to="/quick-sizer">Quick Sizer </Link>
        <Link to="/tracker">Scripts </Link>
      </nav>
      <Routes>
        <Route path="/form" element={<PortfolioForm />} />
        <Route path="/table" element={<PortfolioTable />} />
        <Route path="/allocation" element={<AllocationIntentForm />} />
        <Route path="/closed" element={<ClosedPositions />}/>
        <Route path="/performance" element={<PortfolioPerformanceChart />} />
        <Route path="/quick-sizer" element={<PositionSizer />} />
        <Route path="/tracker" element={<DisplayScript />} />
      </Routes>
    </Router>
  );
};

export default App;
