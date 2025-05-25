import React, { useState } from 'react';
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';

const calculateAllocationIntent = (
  capital,
  allocationSize,
  entryPrice,
  riskedAmountPercentage // Risked amount percentage against the capital
) => {
  const maxInvestment = (allocationSize / 100) * capital;
  const riskAllowed = (riskedAmountPercentage / 100) * capital;
  const stopLossPercentage = riskedAmountPercentage / 10; // Use dynamic risk percentage for stop loss
  const lossPerShare = entryPrice * stopLossPercentage;
  const stopLossPrice = parseFloat((entryPrice - lossPerShare).toFixed(2));
  const rewardPerShare = parseFloat((entryPrice * 0.10).toFixed(2)); // 10% gain
  const riskRewardRatio = lossPerShare > 0 ? (rewardPerShare / lossPerShare).toFixed(2) : 'Infinity';

  let sharesToBuyByRisk = 0;
  let sharesToBuyByInvestment = 0;
  let sharesToBuy = 0;
  let investmentAmount = 0;
  let potentialLoss = 0;
  let allocationPercentage = 0;

  if (lossPerShare > 0) {
    sharesToBuyByRisk = Math.floor(riskAllowed / lossPerShare);
    sharesToBuyByInvestment = Math.floor(maxInvestment / entryPrice);

    sharesToBuy = sharesToBuyByInvestment;

    investmentAmount = sharesToBuy * entryPrice;
    potentialLoss = sharesToBuy * (entryPrice - stopLossPrice);

    allocationPercentage = parseFloat(((investmentAmount / capital) * 100).toFixed(2));
  }

  return {
    percentage: allocationSize,
    sharesToBuy,
    allocation: investmentAmount.toFixed(2),
    allocationPercentOfPortfolio: allocationPercentage,
    sl: stopLossPrice,
    riskAmount: riskAllowed.toFixed(2), // Return the allowed risk amount
    potentialLoss: potentialLoss.toFixed(2), // Keep potentialLoss for internal check
    canAllocate: riskAllowed >= potentialLoss,
    riskRewardRatio: riskRewardRatio, // Add riskRewardRatio to the returned object
  };
};

function AllocationTable({ scripts, accessToken }) {
  const [portfolioSize, setPortfolioSize] = useState('630000');
  const [riskPercentageOfPortfolio, setRiskPercentageOfPortfolio] = useState('0.25');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async () => {
    const size = parseFloat(portfolioSize);
    const riskOfPortfolio = parseFloat(riskPercentageOfPortfolio);

    if (!isNaN(size) && !isNaN(riskOfPortfolio) && scripts && scripts.length > 0) {
      setLoading(true);
      setError(null);
      const results = await Promise.all(
        scripts.map(async (scriptObj) => {
          const key = Object.keys(scriptObj)[0];
          const value = scriptObj[key];
          const scriptname = key.split(':')[1];
          const instrumentKey = value;
          let ltp = null;
          let riskRewardRatio = null;

          try {
            const response = await fetch(
              `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${instrumentKey}&interval=1d`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            const data = await response.json();
            if (data.status === 'success' && data.data[key]) {
              ltp = data.data[key].last_price;
              const allocation = calculateAllocationIntent(size, 10, ltp, riskOfPortfolio); // Calculate for one allocation to get the ratio
              riskRewardRatio = allocation.riskRewardRatio;
            } else {
              console.error(`Failed to fetch LTP for ${scriptname}`, data);
              setError(`Failed to fetch LTP for one or more scripts.`);
            }
          } catch (err) {
            console.error(`Error fetching LTP for ${scriptname}`, err);
            setError(`Error fetching LTP for one or more scripts.`);
          }

          if (ltp !== null) {
            const allocation10 = calculateAllocationIntent(size, 10, ltp, riskOfPortfolio);
            const allocation25 = calculateAllocationIntent(size, 25, ltp, riskOfPortfolio);
            const allocation40 = calculateAllocationIntent(size, 40, ltp, riskOfPortfolio);

            return {
              scriptname,
              ltp: ltp.toFixed(2),
              sl: allocation10.sl,
              allocations: {
                10: allocation10,
                25: allocation25,
                40: allocation40,
              },
              riskRewardRatio: riskRewardRatio, // Store the riskRewardRatio
            };
          } else {
            return {
              scriptname,
              ltp: 'Error',
              sl: 'Error',
              allocations: {},
              riskRewardRatio: 'Error',
            };
          }
        })
      );
      setTableData(results);
      setLoading(false);
    } else {
      setTableData([{ error: "Please enter valid Portfolio Size and Risk Percentage." }]);
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" flexDirection="column" gap={2} maxWidth={400} mb={3}>
        <TextField
          label="Portfolio Size"
          type="number"
          value={portfolioSize}
          onChange={(e) => setPortfolioSize(e.target.value)}
        />
        <TextField
          label="Risk Percentage (of Portfolio)"
          type="number"
          value={riskPercentageOfPortfolio}
          onChange={(e) => setRiskPercentageOfPortfolio(e.target.value)}
          InputProps={{ endAdornment: <span>%</span> }}
        />
        <Button variant="contained" onClick={handleCalculate} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate'}
        </Button>
      </Box>

      {loading && <p>Fetching live data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {tableData.length > 0 && !tableData[0]?.error && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Script</TableCell>
                <TableCell>LTP</TableCell>
                <TableCell>SL</TableCell>
                <TableCell>R/R</TableCell>
                <TableCell>% / ₹</TableCell>
                <TableCell>Allocations</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.scriptname}</TableCell>
                  <TableCell>{row.ltp}</TableCell>
                  <TableCell>{row.sl}</TableCell>
                  <TableCell>{row.riskRewardRatio}</TableCell>
                  <TableCell>{ riskPercentageOfPortfolio } / { portfolioSize * ( riskPercentageOfPortfolio / 100 )}</TableCell>
                  <TableCell>
                    <Box flexDirection="column" display="flex" gap={1}>
                      {Object.entries(row.allocations).map(([key, value]) => (
                        <span key={key}>
                          {key}%: {value.canAllocate ? 'Yes' : 'No'}
                          (Shares: {value.sharesToBuy}, Alloc: {value.allocationPercentOfPortfolio}%, Risk: ₹{value.potentialLoss})
                        </span>
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tableData[0]?.error && !loading && (
        <Box mt={3}>
          <p style={{ color: 'red' }}>{tableData[0].error}</p>
        </Box>
      )}
    </Box>
  );
}

function App() {
  const initialScripts = [{ "NSE_EQ:FSL": "NSE_EQ|INE684F01012" }];
  const accessToken = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

  return (
    <AllocationTable scripts={initialScripts} accessToken={accessToken} />
  );
}

export default App;