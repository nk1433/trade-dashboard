import {
  Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Paper, Box,
} from '@mui/material';
import PropTypes from 'prop-types';
import OrderDetailsPortal from './OrderDetails';

const columnsConfig = {
  dashboard: [
    {
      name: "Script", value: (row) => {
        return (
          <OrderDetailsPortal data={row}>
            {row.scriptName}
          </OrderDetailsPortal>
        );
      }
    },
    { name: "LTP", value: (row) => row.ltp },
    { name: "SL", value: (row) => row.sl },
    { name: "Max Alloc", value: (row) => row.maxAllocationPercentage },
    { name: "R-vol % / 21 D", value: (row) => `${row.relativeVolumePercentage} %` },
    { name: "Gap %", value: (row) => `${row.gapPercentage} %` },
    { name: "Strong Start", value: (row) => (row.strongStart ? "Yes" : "No") },
  ],
  allocationSuggestions: [
    { name: "Size", value: (row) => row.allocPer },
    { name: "Risk", value: (row) => row.riskPercentage },
  ]
};

const WatchList = ({ scripts, type = 'dashboard' }) => {
  const specifications = columnsConfig[type];

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {specifications.map((column) => (
                <TableCell key={column.name}>{column.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {scripts.map((script, index) => (
              <TableRow key={index}>
                {specifications.map((column, colIndex) => (
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
  type: PropTypes.string,
};

export default WatchList;