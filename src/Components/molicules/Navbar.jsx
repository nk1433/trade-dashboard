import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import PortfolioForm from "./PortfolioForm";
import ClosedPositions from "./ClosedPositions";
import DisplayScript from "./Scripts";
import Watchlist from "../Watchlist/index.jsx";
import AllocationIntentForm from "./AllocationForm";
import PerformanceGraph from "./Performance";
import LiveFeed from "./LiveFeed.jsx";
import MarketBreadthTable from "./MarketBreadth.jsx";
import MarketHighLowWormChart from "./Worm.jsx";
import TVChart from './TV.jsx';
import HeatMap from './HeatMap.jsx';
import ChartWithMarkers from './Visualize.jsx';

// Configuration for the routes in JSON format
const routesConfig = [
  { path: "/pf-config", component: PortfolioForm, linkText: "Configs" },
//   { path: "/table", component: PortfolioTable, linkText: "PF" },
  { path: "/allocation-calculator", component: AllocationIntentForm, linkText: "Calculator" },
  { path: "/closed", component: ClosedPositions, linkText: "Closed" },
  { path: "/performance", component: PerformanceGraph, linkText: "Performance" },
  { path: "/watch-list", component: Watchlist, linkText: "Watchlist" },
  { path: "/search-scripts", component: DisplayScript, linkText: "Scripts" },
  { path: "/live-feed", component: LiveFeed, linkText: "Livefeed" },
  { path: "/market-breadth", component: MarketBreadthTable, linkText: "MM" },
  { path: "/worm", component: MarketHighLowWormChart, linkText: "WORM" },
  { path: "/tv", component: TVChart, linkText: "TV" },
  { path: "/heat-map", component: HeatMap, linkText: "HeatMap" },
  { path: "/visualize", component: ChartWithMarkers, linkText: "Visualize" },
];

const Navbar = () => {
  return (
    <Router>
      <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        {routesConfig.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            style={{ marginRight: "10px", color: 'black' }}
          >
            {route.linkText}
          </Link>
        ))}
      </nav>
     
      <Routes>
        {routesConfig.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        ))}
      </Routes>
    </Router>
  );
};

export default Navbar;