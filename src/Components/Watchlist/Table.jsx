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
import {placeSLMOrder } from '../../Store/upstoxs';
import PropTypes from 'prop-types';

const columnsConfig = [
  { name: "Script", value: (row) => row.scriptName },
  { name: "LTP", value: (row) => row.ltp },
  { name: "SL", value: (row) => row.sl },
  { name: "R-vol % / 21 D", value: (row) => `${row.relativeVolumePercentage} %` },
  { name: "Gap %", value: (row) => `${row.gapPercentage} %` },
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

const WatchList = ({ scripts }) => {

  return (
    <Box>
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
            {scripts.map((script, index) => (
              <TableRow key={index}>
                {columnsConfig.map((column, colIndex) => (
                  <TableCell key={`${index}-${colIndex}`}>
                    {column.value(script)}
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

WatchList.propTypes = {
  scripts: PropTypes.array.isRequired,
};

export default WatchList;