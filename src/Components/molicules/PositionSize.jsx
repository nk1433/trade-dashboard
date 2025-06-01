import { useState } from 'react';
import { useForm } from "react-hook-form";
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
  riskedAmountPercentage,
) => {
  const maxInvestment = (allocationSize / 100) * capital;
  const riskAllowed = (riskedAmountPercentage / 100) * capital;
  const stopLossPercentage = riskedAmountPercentage / 10;
  const lossPerShare = entryPrice * stopLossPercentage;
  const stopLossPrice = parseFloat((entryPrice - lossPerShare).toFixed(2));
  const rewardPerShare = parseFloat((entryPrice * 0.10).toFixed(2));
  const riskRewardRatio = lossPerShare > 0 ? (rewardPerShare / lossPerShare).toFixed(2) : 'Infinity';
  let sharesToBuyByInvestment = 0;
  let sharesToBuy = 0;
  let investmentAmount = 0;
  let potentialLoss = 0;
  let allocationPercentage = 0;

  if (lossPerShare > 0) {
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
    riskAmount: riskAllowed.toFixed(2),
    potentialLoss: potentialLoss.toFixed(2),
    canAllocate: riskAllowed >= potentialLoss,
    riskRewardRatio: riskRewardRatio,
  };
};

const handleCalculate = async ({ portfolioSize, riskPercentageOfPortfolio }, scripts) => {
  const size = parseFloat(portfolioSize);
  const riskOfPortfolio = parseFloat(riskPercentageOfPortfolio);
  const fromDate = moment().subtract(31, 'day').format('YYYY-MM-DD');
  const toDate = moment().subtract(1, 'day').format('YYYY-MM-DD');

  const results = await Promise.all(
    scripts.map(async (scriptObj) => {
      const { instrument_key: instrumentKey, name: scriptname } = scriptObj;

      let riskRewardRatio = null;
      let strongStart = false;
      let avgVolume = 'N/A';
      let relativeVolumePercentage = 'N/A';
      let gapUpPercentage = 'N/A';
      const accessToken = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

      try {
        const liveResponse = await fetch(
          `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${instrumentKey}&interval=1d`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const liveData = await liveResponse.json();
        const [key, instrumentLiveData] = Object.entries(liveData.data).find(([key, val]) => {
          return val.instrument_token === instrumentKey;
        });
        const {
          live_ohlc: { open: currentDayOpen, low: lowPrice, volume: currentVolume },
          last_price: ltp,
        } = instrumentLiveData;
        const threshold = currentDayOpen * 0.99;
        strongStart = lowPrice >= threshold;
        const allocation = calculateAllocationIntent(size, 10, ltp, riskOfPortfolio);
        riskRewardRatio = allocation.riskRewardRatio;

        const historicalResponse = await fetch(
          `https://api.upstox.com/v3/historical-candle/${instrumentKey}/days/1/${toDate}/${fromDate}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const historicalData = await historicalResponse.json();
        const candles = historicalData.data.candles;
        const totalVolume = candles.reduce((sum, candle) => sum + candle[5], 0);
        avgVolume = (totalVolume / candles.length).toFixed(0);
        relativeVolumePercentage = ((currentVolume / parseFloat(avgVolume)) * 100).toFixed(2);

        let previousDayClose = candles[0][4];
        gapUpPercentage = (((currentDayOpen - previousDayClose) / previousDayClose) * 100).toFixed(2) + '%';

        const allocation10 = calculateAllocationIntent(size, 10, ltp, riskOfPortfolio);
        const allocation25 = calculateAllocationIntent(size, 25, ltp, riskOfPortfolio);
        const allocation40 = calculateAllocationIntent(size, 40, ltp, riskOfPortfolio);

        return {
          scriptname,
          riskRewardRatio,
          strongStart,
          avgVolume,
          relativeVolumePercentage,
          ltp: ltp.toFixed(2),
          gapUpPercentage,
          sl: allocation10.sl,
          allocations: {
            10: allocation10,
            25: allocation25,
            40: allocation40,
          },
        };
      } catch (err) {
        console.error(`Error fetching data for ${scriptname}`, err);
      }
    })
  );
  const sortedResults = [...results].sort((a, b) => {
    return b.relativeVolumePercentage - a.relativeVolumePercentage
  });

  return sortedResults;
};

const AllocationTable = ({ scripts }) => {
  const [portfolioSize, setPortfolioSize] = useState('630000');
  const [riskPercentageOfPortfolio, setRiskPercentageOfPortfolio] = useState('0.25');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data, scripts) => {
    setLoading(true);
    setError(null);
    const sortedResults = await handleCalculate(data, scripts);
    setTableData(sortedResults);
    setLoading(false);
  };

  return (
    <Box>

      <form onSubmit={handleSubmit((formData) => onSubmit(formData, scripts))}>
        <Box display="flex" justifyContent={'space-around'} alignItems={"center"} flexDirection="column" gap={2} mb={2} >
          <TextField
            type="number" defaultValue={portfolioSize}
            onChange={(e) => setPortfolioSize(e.target.value)}
            {...register("portfolioSize", { required: true })}
          />
          <TextField
            defaultValue={riskPercentageOfPortfolio}
            onChange={(e) => setRiskPercentageOfPortfolio(e.target.value)}
            {...register("riskPercentageOfPortfolio", { required: true })}
          />

          {errors.exampleRequired && <span>This field is required</span>}

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate'}
          </Button>
        </Box>
      </form>

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
              <TableCell>R-vol % / 21 D</TableCell>
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
                        {value.canAllocate && (<span key={key}>{key}% Shares: {value.sharesToBuy} Risk: ₹{value.potentialLoss} </span>)}
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
};

const App = () => {
  // TODO: Abstract this to use every where.
  const initialScripts = localStorage.getItem("script") ? JSON.parse(localStorage.getItem("script")) : [];
  const accessToken = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

  return (
    <AllocationTable scripts={initialScripts} accessToken={accessToken} />
  );
};

export default App;