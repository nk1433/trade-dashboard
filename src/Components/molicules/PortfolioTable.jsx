import { useSelector } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { calculateMetrics } from "../../utils/calculateMetrics";
import positions from "../../config/position.json";

const getBackgroundColor = (tradeManagement) => {
  return {
    "SL < E": "orangered",
    "SL > E": "limegreen",
    "SL = E": "orange",
  }[tradeManagement];
};

const PortfolioTable = () => {
  const { portfolioSize, exitPercentage } = useSelector((state) => state.portfolio);

  let {
    updatedData,
    totalRisk,
    totalRiskPercentage,
    totalAllocatedAmount,
    totalAllocatedPercentage,
  } = calculateMetrics(positions.filter(({ type }) => type !== "closed"), portfolioSize, exitPercentage);
  updatedData.sort((a, b) => b.risk - a.risk);

  return (
    <div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Exit Price</TableCell>
              <TableCell>2/3/6/9 Exit Points</TableCell>
              <TableCell>Risk-to-Reward</TableCell>
              <TableCell>Position Size Allocated</TableCell>
              <TableCell>Risk (INR)</TableCell>
              <TableCell>Trade Management</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {updatedData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.symbol}</TableCell>
                <TableCell>{row.entry.toFixed(2)}</TableCell>
                <TableCell>{row.exit.toFixed(2)}</TableCell>
                <TableCell>
                  {row.exitPoints.join(" / ")} {/* Render exit points as "3% / 6% / 9%" */}
                </TableCell>
                <TableCell>{row.riskToReward}</TableCell>
                <TableCell>{row.positionSizeAllocated}</TableCell>
                <TableCell>{row.risk}</TableCell>
                <TableCell
                  style={{
                    fontWeight: "bold",
                    color: getBackgroundColor(row.tradeManagement), // Adjust text color for better readability
                  }}
                >{row.tradeManagement}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div style={{ marginTop: "20px" }}>
        <Typography>Total Risk Percentage: <span style={{
          fontWeight: "bold",
        }}>{totalRiskPercentage}</span></Typography>
        <Typography>Total Risk: {totalRisk}</Typography>
        <Typography>Total Allocated Percentage: {totalAllocatedPercentage}</Typography>
        <Typography>Total Allocated Amount: {totalAllocatedAmount}</Typography>
      </div>
    </div>
  );
};

export default PortfolioTable;
