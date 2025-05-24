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
  portfolioPercentage,
  portfolioSize,
  entryPrice,
  riskPercentageOfPortfolio // This is the risk percentage of the entire portfolio
) => {
  const maxInvestment = (portfolioPercentage / 100) * portfolioSize;
  const sharesToBuy = Math.floor(maxInvestment / entryPrice);
  const investmentAmount = sharesToBuy * entryPrice;

  const stopLossPrice = 377.37; // Using the stop loss price from your example
  const lossPerShare = entryPrice - stopLossPrice;
  const potentialLoss = sharesToBuy * lossPerShare;

  // Calculate risk percentage for this specific allocation relative to the portfolio size
  const riskOfAllocationPortfolio = (potentialLoss / portfolioSize) * 100;

  return {
    percentage: portfolioPercentage,
    sharesToBuy,
    allocation: investmentAmount.toFixed(2),
    stopLossPrice: stopLossPrice.toFixed(2),
    difference: potentialLoss.toFixed(2),
    risk: riskOfAllocationPortfolio.toFixed(4),
  };
};

function AllocationCalculator() {
  const [portfolioSize, setPortfolioSize] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [riskPercentageOfPortfolio, setRiskPercentageOfPortfolio] = useState('');
  const [maxAllocationResult, setMaxAllocationResult] = useState(null);
  const [fixedResults, setFixedResults] = useState([]);

  const handleCalculateFixed = () => {
    const size = parseFloat(portfolioSize);
    const entry = parseFloat(entryPrice);
    const riskOfPortfolio = parseFloat(riskPercentageOfPortfolio);
    const calculatedResults = [];

    if (!isNaN(size) && !isNaN(entry) && !isNaN(riskOfPortfolio)) {
      fixedAllocations.forEach(allocation => {
        const calculationResult = calculateAllocationIntent(allocation, size, entry, riskOfPortfolio);
        calculatedResults.push(calculationResult);
      });
      setFixedResults(calculatedResults);
    } else {
      setFixedResults([{ error: "Please enter valid numbers for Portfolio Size, Entry Price, and Risk Percentage." }]);
    }
    setMaxAllocationResult(null); // Clear max allocation result when recalculating fixed
  };

  const handleCalculateMax = () => {
    const size = parseFloat(portfolioSize);
    const entry = parseFloat(entryPrice);
    const riskOfPortfolio = parseFloat(riskPercentageOfPortfolio);

    if (!isNaN(size) && !isNaN(entry) && !isNaN(riskOfPortfolio)) {
      const maxRiskAmount = (riskOfPortfolio / 100) * size;
      const stopLossPrice = 377.37;
      const lossPerShare = entry - stopLossPrice;

      if (lossPerShare <= 0) {
        setMaxAllocationResult({ error: "Stop loss is greater than or equal to entry price." });
        return;
      }

      const maxSharesToBuy = Math.floor(maxRiskAmount / lossPerShare);
      const maxInvestmentAmount = maxSharesToBuy * entry;
      const maxAllocationPercentage = (maxInvestmentAmount / size) * 100;
      const potentialLoss = maxSharesToBuy * lossPerShare;
      const riskOfAllocationPortfolio = (potentialLoss / size * 100).toFixed(4);

      setMaxAllocationResult({
        percentage: maxAllocationPercentage.toFixed(2),
        sharesToBuy: maxSharesToBuy,
        allocation: maxInvestmentAmount.toFixed(2),
        difference: potentialLoss.toFixed(2),
        risk: riskOfAllocationPortfolio,
        stopLossPrice: stopLossPrice.toFixed(2),
        targetRisk: parseFloat(riskOfPortfolio).toFixed(2),
      });
      setFixedResults([]); // Clear fixed allocation results when calculating max
    } else {
      setMaxAllocationResult({ error: "Please enter valid numbers for Portfolio Size, Entry Price, and Risk Percentage." });
    }
  };

  const fixedAllocations = [10, 25, 40];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      <h2>Allocation Calculator</h2>
      <Box display="flex" flexDirection="column" gap={2} maxWidth={400}>
        <TextField
          label="Portfolio Size"
          type="number"
          value={portfolioSize}
          onChange={(e) => setPortfolioSize(e.target.value)}
        />
        <TextField
          label="Entry Price"
          type="number"
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
        />
        <TextField
          label="Risk Percentage (of Portfolio)"
          type="number"
          value={riskPercentageOfPortfolio}
          onChange={(e) => setRiskPercentageOfPortfolio(e.target.value)}
          InputProps={{ endAdornment: <span>%</span> }}
        />
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={handleCalculateFixed}>
            Calculate Fixed Allocations
          </Button>
          <Button variant="contained" onClick={handleCalculateMax}>
            Find Max Allocation (within {riskPercentageOfPortfolio || 0}%)
          </Button>
        </Box>
      </Box>

      {fixedResults.length > 0 && !fixedResults[0]?.error && (
        <Box mt={3}>
          <h3>Fixed Allocation Results</h3>
          <p>✅ Stop Loss Price: ₹{fixedResults[0]?.stopLossPrice}</p>
          <p>✅ Target Risk per allocation (of Portfolio): {parseFloat(riskPercentageOfPortfolio).toFixed(2) || 0}%</p>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Percentage</TableCell>
                  <TableCell>Shares</TableCell>
                  <TableCell>Allocation</TableCell>
                  <TableCell>Difference</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Can Allocate?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fixedResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.percentage}%</TableCell>
                    <TableCell>{result.sharesToBuy}</TableCell>
                    <TableCell>₹{result.allocation}</TableCell>
                    <TableCell>₹{result.difference}</TableCell>
                    <TableCell>{result.risk}%</TableCell>
                    <TableCell>
                      {parseFloat(result.risk) <= parseFloat(riskPercentageOfPortfolio) ? (
                        <span style={{ color: 'green' }}>✅ Yes</span>
                      ) : (
                        <span style={{ color: 'red' }}>❌ No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {fixedResults[0]?.error && (
        <Box mt={3}>
          <h3>Fixed Allocation Results</h3>
          <p style={{ color: 'red' }}>{fixedResults[0].error}</p>
        </Box>
      )}

      {maxAllocationResult && (
        <Box mt={3}>
          <h3>Maximum Allocation Result (within {parseFloat(riskPercentageOfPortfolio).toFixed(2) || 0}%)</h3>
          <p>✅ Stop Loss Price: ₹{maxAllocationResult.stopLossPrice}</p>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Percentage</TableCell>
                  <TableCell>Shares</TableCell>
                  <TableCell>Allocation</TableCell>
                  <TableCell>Difference</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Can Allocate?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{maxAllocationResult.percentage}%</TableCell>
                  <TableCell>{maxAllocationResult.sharesToBuy}</TableCell>
                  <TableCell>₹{maxAllocationResult.allocation}</TableCell>
                  <TableCell>₹{maxAllocationResult.difference}</TableCell>
                  <TableCell>{maxAllocationResult.risk}%</TableCell>
                  <TableCell>
                    {parseFloat(maxAllocationResult.risk) <= parseFloat(riskPercentageOfPortfolio) ? (
                      <span style={{ color: 'green' }}>✅ Yes</span>
                    ) : (
                      <span style={{ color: 'red' }}>❌ No</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </div>
  );
}

export default AllocationCalculator;