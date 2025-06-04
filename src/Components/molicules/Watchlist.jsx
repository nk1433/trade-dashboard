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

const columnsConfig = [
  { name: "Script", value: (row) => row.scriptName },
  { name: "LTP", value: (row) => row.ltp },
  { name: "SL", value: (row) => row.sl },
  { name: "R-vol % / 21 D", value: (row) => `${row.relativeVolumePercentage} %` },
  { name: "Gap %", value: (row) => row.gapPercentage },
  {
    name: "Allocations",
    value: (row) => (
      <Box flexDirection='column' display='flex' gap={1}>
        {Object.entries(row.allocations || {}).map(([key, value]) => (
          <span key={key}>
            {value.canAllocate && (
              <span key={key}>
                {key}% Shares: {value.sharesToBuy} Risk: ₹{value.potentialLoss}{" "}
              </span>
            )}
          </span>
        ))}
      </Box>
    ),
  },
  {
    name: "Actions",
    value: (row) => (
      <Button onClick={() => { dispatch(placeSLMOrder(row)); }}>
        Place Order
      </Button>
    ),
  },
  { name: "Strong Start", value: (row) => (row.strongStart ? "Yes" : "No") },
];

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
              {columnsConfig.map((column) => (
                <TableCell key={column.name}>{column.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {orderMetrics.map((row, index) => (
              <TableRow key={index}>
                {columnsConfig.map((column, colIndex) => (
                  <TableCell key={`${index}-${colIndex}`}>
                    {column.value(row)}
                  </TableCell>
                ))}
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
  const initialScripts = localStorage.getItem('script') ? JSON.parse(localStorage.getItem('script')) : [];

  return (
    <AllocationTable scripts={initialScripts} />
  );
};

export default App;