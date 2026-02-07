import { Outlet } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home/index";
import Settings from "./Settings";
import MarketBreadthTable from "./MarketBreadth.jsx";
import MarketHighLowWormChart from "./Worm.jsx";
import Redirect from "./Redirect";
import HoldingsWrapper from "../HoldingsWrapper/index.jsx";
import Scans from "../Scans/index.jsx";

// Configuration for the routes in JSON format
const routesConfig = [
  { path: "/", component: Home, linkText: "Home" },
  { path: "/settings", component: Settings, linkText: "Settings" },
  { path: "/redirect", component: Redirect, linkText: "" }, // Hidden from nav
  { path: "/market-breadth", component: MarketBreadthTable, linkText: "MM" },
  { path: "/worm", component: MarketHighLowWormChart, linkText: "Worm" },
  { path: "/holdings", component: HoldingsWrapper, linkText: "Holdings" },
  { path: "/scans", component: Scans, linkText: "Scans" },
];

const Navbar = () => {
  return (
    <Layout routes={routesConfig}>
      <Outlet />
    </Layout>
  );
};

export default Navbar;