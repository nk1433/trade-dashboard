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
import moment from 'moment';

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
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    // const toDate = `${year}-${month}-${day}`;
    const fromDate = moment().subtract(31, 'day').format('YYYY-MM-DD'); // Set fromDate to yesterday
    const toDate = moment().subtract(1, 'day').format('YYYY-MM-DD'); // Set toDate to today
    // const fromDate = `2025-04-26`; // Set the fromDate to April 26, 2025

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
          let strongStart = false;
          let avgVolume = 'N/A';
          let relativeVolumePercentage = 'N/A';
          let gapUpPercentage = 'N/A';

          try {
            // Fetch live data for current day open price
            const liveResponse = await fetch(
              `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${instrumentKey}&interval=1d`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            const liveData = await liveResponse.json();
            if (liveData.status === 'success' && liveData.data[key]) {
              ltp = liveData.data[key].last_price;
              const currentDayOpen = liveData.data[key].live_ohlc.open;
              const lowPrice = liveData.data[key].live_ohlc.low;
              const currentVolume = liveData.data[key].live_ohlc.volume;
              const threshold = currentDayOpen * 0.99;
              strongStart = lowPrice >= threshold;
              const allocation = calculateAllocationIntent(size, 10, ltp, riskOfPortfolio);
              riskRewardRatio = allocation.riskRewardRatio;

              // Fetch historical data for average volume and previous day close price
              const historicalResponse = await fetch(
                `https://api.upstox.com/v3/historical-candle/${instrumentKey}/days/1/${toDate}/${fromDate}`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );
              const historicalData = await historicalResponse.json();
              if (historicalData.status === 'success' && historicalData.data.candles) {
                const candles = historicalData.data.candles;
                if (candles.length > 0) {
                  const totalVolume = candles.reduce((sum, candle) => sum + candle[5], 0);
                  avgVolume = (totalVolume / candles.length).toFixed(0);
                  if (avgVolume !== '0' && avgVolume !== 0) {
                    relativeVolumePercentage = ((currentVolume / parseFloat(avgVolume)) * 100).toFixed(2);
                  } else {
                    relativeVolumePercentage = 'N/A';
                  }

                  // Calculate Gap Up Percentage
                  let previousDayClose = null;
                  if (candles.length > 0) {
                    previousDayClose = candles[0][4];
                    if (currentDayOpen && previousDayClose) {
                      gapUpPercentage = (((currentDayOpen - previousDayClose) / previousDayClose) * 100).toFixed(2) + '%';
                    } else {
                      gapUpPercentage = 'N/A';
                    }
                  } else {
                    gapUpPercentage = 'N/A';
                  }
                } else {
                  avgVolume = 'N/A';
                }
              } else {
                console.error(`Failed to fetch historical data for ${scriptname}`, historicalData);
              }
            } else {
              console.error(`Failed to fetch LTP for ${scriptname}`, liveData);
              setError(`Failed to fetch data for one or more scripts.`);
            }
          } catch (err) {
            console.error(`Error fetching data for ${scriptname}`, err);
            setError(`Error fetching data for one or more scripts.`);
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
              riskRewardRatio: riskRewardRatio,
              strongStart: strongStart,
              avgVolume: avgVolume,
              relativeVolumePercentage: relativeVolumePercentage,
              gapUpPercentage: gapUpPercentage, // Store Gap Up Percentage
            };
          } else {
            return {
              scriptname,
              ltp: 'Error',
              sl: 'Error',
              allocations: {},
              riskRewardRatio: 'Error',
              strongStart: false,
              avgVolume: 'Error',
              relativeVolumePercentage: 'Error',
              gapUpPercentage: 'Error',
            };
          }
        })
      );
      const sortedResults = [...results].sort((a, b) => {
        return b.relativeVolumePercentage - a.relativeVolumePercentage
      });
      setTableData(sortedResults);
      setLoading(false);
    } else {
      setTableData([{ error: "Please enter valid Portfolio Size and Risk Percentage." }]);
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" flexDirection="column" alignItems={'center'} gap={2} mb={3}>
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Script</TableCell>
              <TableCell>LTP</TableCell>
              <TableCell>SL</TableCell>
              {/* <TableCell>R / R</TableCell> */}
              {/* <TableCell>% / ₹</TableCell> */}
              <TableCell>Re-Vol%/ M</TableCell>
              {/* <TableCell>Avg Volume</TableCell> */}
              <TableCell>Gap %</TableCell>
              <TableCell>Allocations</TableCell>
              <TableCell>Strong Start</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.scriptname}</TableCell>
                <TableCell>{row.ltp}</TableCell>
                <TableCell>{row.sl}</TableCell>
                {/* <TableCell>1 / {row.riskRewardRatio}</TableCell> */}
                {/* <TableCell>{ riskPercentageOfPortfolio } / { portfolioSize * ( riskPercentageOfPortfolio / 100 )}</TableCell> */}
                <TableCell>{row.relativeVolumePercentage} %</TableCell>
                {/* <TableCell>{row.avgVolume}</TableCell> */}
                <TableCell>{row.gapUpPercentage}</TableCell>
                <TableCell>
                  <Box flexDirection="column" display="flex" gap={1}>
                    {Object.entries(row.allocations).map(([key, value]) => {
                      return <>
                        { value.canAllocate && (<span key={key}>{key}% Shares: {value.sharesToBuy} Risk: ₹{value.potentialLoss} </span>) }
                      </>
                    })}
                  </Box>
                </TableCell>
                <TableCell>{row.strongStart ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function App() {
  const initialScripts = [
    { "NSE_EQ:AVALON": "NSE_EQ|INE0LCL01028" },
    { "NSE_EQ:FSL": "NSE_EQ|INE684F01012" },
    { "NSE_EQ:KIRIINDUS": "NSE_EQ|INE415I01015" },
    { "NSE_EQ:AMIORG": "NSE_EQ|INE00FF01025" },
    { "NSE_EQ:MANORAMA": "NSE_EQ|INE00VM01036" },
    { "BSE_EQ:JAYKAY": "BSE_EQ|INE903A01025" },
    { "NSE_EQ:MCX": "NSE_EQ|INE745G01035" },
    { "NSE_EQ:MANAPPURAM": "NSE_EQ|INE522D01027" },
    { "NSE_EQ:WINDMACHIN": "NSE_EQ|INE052A01021" },
    { "NSE_EQ:BANCOINDIA": "NSE_EQ|INE213C01025" },
    { "NSE_EQ:MANINDS": "NSE_EQ|INE993A01026" },
  ];
  const accessToken = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

  return (
    <AllocationTable scripts={initialScripts} accessToken={accessToken} />
  );
}

export default App;