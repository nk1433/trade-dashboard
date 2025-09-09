import { useState, useMemo } from "react";
import { TextField, Button, Typography, Box, Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { calculateAllocationIntent } from "../../utils/calculateMetrics";
import { useSelector } from "react-redux";

const columns = [
  { field: "sharesToBuy", headerName: "Shares To Buy", width: 130 },
  { field: "maxShareToBuy", headerName: "Max Shares To Buy", width: 150 },
  { field: "maxAllocationWithRisk", headerName: "Max Allocation (Risk)", width: 180 },
  { field: "maxAllocationPercentage", headerName: "Max Allocation %", width: 130 },
  { field: "intentInvestment", headerName: "Intent Investment", width: 150 },
  { field: "investmentAmount", headerName: "Investment Amount", width: 150 },
  { field: "actualAllocationPercentage", headerName: "Actual Allocation %", width: 170 },
  { field: "riskAmount", headerName: "Risk Amount", width: 130 },
  { field: "lossPerShare", headerName: "Loss Per Share", width: 130 },
  { field: "riskRewardRatio", headerName: "Risk Reward Ratio", width: 150 },
  { field: "lossInMoney", headerName: "Loss in Money", width: 130 },
  { field: "rewardPerShare", headerName: "Reward Per Share", width: 130 },
];

const AllocationIntentForm = () => {
  const { portfolioSize, riskPercentage: riskPer } = useSelector((state) => state.portfolio);

  const [portfolioPercentage, setPortfolioPercentage] = useState(15);
  const [pfSize, setPfSize] = useState(portfolioSize);
  const [entryPrice, setEntryPrice] = useState(0);
  const [exitPrice, setExitPrice] = useState(0);
  const [riskPercentage, setRiskPercentage] = useState(riskPer);
  const [results, setResults] = useState(null);

  const handleSubmit = () => {
    const insights = calculateAllocationIntent(
      portfolioPercentage,
      pfSize,
      entryPrice,
      exitPrice,
      riskPercentage
    );
    setResults(insights);
  };

  // Convert results object to single-row array for DataGrid (excluding allocationSuggestions)
  const mainRows = useMemo(() => {
    if (!results || results.error) return [];
    return [
      {
        id: 1,
        sharesToBuy: results.sharesToBuy,
        maxShareToBuy: results.maxShareToBuy,
        maxAllocationWithRisk: results.maxAllocationWithRisk.toFixed(2),
        maxAllocationPercentage: results.maxAllocationPercentage + "%",
        intentInvestment: results.intentInvestment.toFixed(2),
        investmentAmount: results.investmentAmount.toFixed(2),
        actualAllocationPercentage: results.actualAllocationPercentage.toFixed(2) + "%",
        riskAmount: results.riskAmount.toFixed(2),
        lossPerShare: results.lossPerShare.toFixed(2),
        riskRewardRatio: results.riskRewardRatio.toFixed(2),
        lossInMoney: results.lossInMoney.toFixed(2),
        rewardPerShare: results.rewardPerShare.toFixed(2),
      },
    ];
  }, [results]);


  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
        Allocation Intent Calculator
      </Typography>

      <Box sx={{ maxWidth: 600, margin: "auto", mb: 4 }}>
        <TextField
          label="Portfolio Percentage"
          type="number"
          value={portfolioPercentage}
          onChange={(e) => setPortfolioPercentage(Number(e.target.value))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Portfolio Size"
          type="number"
          value={pfSize}
          onChange={(e) => setPfSize(Number(e.target.value))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Entry Price"
          type="number"
          value={entryPrice}
          onChange={(e) => setEntryPrice(Number(e.target.value))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Exit Price"
          type="number"
          value={exitPrice}
          onChange={(e) => setExitPrice(Number(e.target.value))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Risk Percentage"
          type="number"
          value={riskPercentage}
          onChange={(e) => setRiskPercentage(Number(e.target.value))}
          fullWidth
          margin="normal"
        />

        <Button variant="contained" color="primary" fullWidth onClick={handleSubmit} sx={{ mt: 2 }}>
          Calculate
        </Button>
      </Box>

      {results && results.error && (
        <Typography color="error" sx={{ textAlign: "center" }}>{results.error}</Typography>
      )}

      {results && !results.error && (
        <>
          <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
            Allocation Summary
          </Typography>
          <Paper sx={{ height: 150, maxWidth: 1100, margin: "auto", mb: 4 }}>
            <DataGrid
              rows={mainRows}
              columns={columns}
              hideFooter
              disableColumnMenu
              getRowId={(row) => row.id}
            />
          </Paper>

          {/* <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
            Allocation Suggestions
          </Typography> */}
          {/* <Paper sx={{ height: 220, maxWidth: 600, margin: "auto" }}>
            <DataGrid
              rows={suggestionRows}
              columns={allocationSuggestionColumns}
              hideFooter
              disableColumnMenu
              getRowId={(row) => row.id}
            />
          </Paper> */}
        </>
      )}
    </>
  );
};

export default AllocationIntentForm;
