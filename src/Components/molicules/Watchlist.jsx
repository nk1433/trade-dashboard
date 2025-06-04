import { useEffect, useState } from 'react';
import {
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
import { useDispatch, useSelector } from 'react-redux';
import RefreshIcon from '@mui/icons-material/Refresh';
import { calculateMetricsForScript, placeSLMOrder } from '../../Store/upstoxs';
import PropTypes from 'prop-types';


const AllocationTable = ({ scripts }) => {
  const dispatch = useDispatch();
  const {
    portfolioSize,
    riskPercentage: riskPercentageOfPortfolio
  } = useSelector((state) => state.portfolio);
  const { orderMetrics } = useSelector((state) => state.orders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (data, scripts) => {
    setLoading(true);
    setError(null);
    dispatch(calculateMetricsForScript(scripts, data));
    setLoading(false);
  };

  useEffect(() => {
    onSubmit({ portfolioSize, riskPercentageOfPortfolio }, scripts);
  }, [portfolioSize, riskPercentageOfPortfolio]);

  return (
    <Box>
      {loading && <p>Fetching live data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <Button style={{ color: 'black' }} onClick={() => onSubmit({ portfolioSize, riskPercentageOfPortfolio }, scripts)}>
        Refresh
      <RefreshIcon ml={2} />
      </Button>
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
              <TableCell></TableCell>
              <TableCell>Strong Start</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderMetrics.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.scriptName}</TableCell>
                <TableCell>{row.ltp}</TableCell>
                <TableCell>{row.sl}</TableCell>
                {/* <TableCell>1 / {row.riskRewardRatio}</TableCell> */}
                {/* <TableCell>{ riskPercentageOfPortfolio } / { portfolioSize * ( riskPercentageOfPortfolio / 100 )}</TableCell> */}
                <TableCell>{row.relativeVolumePercentage} %</TableCell>
                {/* <TableCell>{row.avgVolume}</TableCell> */}
                <TableCell>{row.gapPercentage}</TableCell>
                <TableCell>
                  <Box flexDirection='column' display='flex' gap={1}>
                    {Object.entries(row.allocations || []).map(([key, value]) => {
                      return <span key={key}>
                        {value.canAllocate && (<span key={key}>{key}% Shares: {value.sharesToBuy} Risk: ₹{value.potentialLoss} </span>)}
                      </span>
                    })}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button onClick={() => { dispatch(placeSLMOrder(row)) }}>
                    Place Order
                  </Button>
                </TableCell>
                <TableCell>{row.strongStart ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

AllocationTable.propTypes = {
  scripts: PropTypes.array.isRequired,
};



const App = () => {
  // TODO: Abstract this to use every where.
  const initialScripts = localStorage.getItem('script') ? JSON.parse(localStorage.getItem('script')) : [];

  return (
    <AllocationTable scripts={initialScripts} />
  );
};

export default App;