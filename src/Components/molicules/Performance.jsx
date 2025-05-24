import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import closedPositions from "../../config/closedPosition.json";
import { useSelector } from "react-redux";
import { reduce, map } from "@laufire/utils/collection";
import { group } from "@laufire/utils/crunch.js";

const PerformanceGraph = () => {
  const portfolioSize = useSelector((state) => state.portfolio.portfolioSize);

  const groupedData = group(closedPositions, (position) => {
    return position["Sell date"].split("-")[1]
  });
  const data = reduce(groupedData, (acc, positions, month) => {
    return [
      ...acc,
      {
        name: month,
        performance: reduce(positions, (acc, position) => {
          return acc + Number(position["Realised P&L"])
        }, 0)
      }
    ]
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" label={{ value: "Date", position: "insideBottom", offset: -5 }} />
        <YAxis
          label={{ value: "Performance (%)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="performance" stroke="#8884d8" dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceGraph;
