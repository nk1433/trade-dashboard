import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Settings from "./Settings";
import Home from "./Home";
import ClosedPositions from "./ClosedPositions";
import DisplayScript from "./Scripts";
import PerformanceGraph from "./Performance";
import LiveFeed from "./LiveFeed.jsx";
import MarketBreadthTable from "./MarketBreadth.jsx";
import MarketHighLowWormChart from "./Worm.jsx";
import TVChart from './TV.jsx';
import HeatMap from './HeatMap.jsx';
import ChartWithMarkers from './Visualize.jsx';
import PlContributionCalendar from "./Contribution.jsx";
import Layout from "./Layout";

// Configuration for the routes in JSON format
const routesConfig = [
  { path: "/", component: Home, linkText: "Home" },
  { path: "/settings", component: Settings, linkText: "Settings" },
  // { path: "/closed", component: ClosedPositions, linkText: "Closed" },
  // { path: "/performance", component: PerformanceGraph, linkText: "Performance" },
  // { path: "/search-scripts", component: DisplayScript, linkText: "Scripts" },
  // { path: "/live-feed", component: LiveFeed, linkText: "Livefeed" },
  { path: "/market-breadth", component: MarketBreadthTable, linkText: "MM" },
  { path: "/worm", component: MarketHighLowWormChart, linkText: "Worm" },
  // { path: "/tv", component: TVChart, linkText: "TV" },
  // { path: "/heat-map", component: HeatMap, linkText: "HeatMap" },
  // { path: "/visualize", component: ChartWithMarkers, linkText: "Visualize" },
  // { path: "/contribution", component: PlContributionCalendar, linkText: "Contribution" },
];

const Navbar = () => {
  return (
    <Router>
      <Layout routes={routesConfig}>
        <Routes>
          {routesConfig.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}
        </Routes>
      </Layout>
    </Router>
  );
};

export default Navbar;