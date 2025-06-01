import { useDispatch, useSelector } from "react-redux";
import { TextField, Button, Box, Typography } from "@mui/material";
import { updateExitPercentage, updatePortfolioSize, updateRiskPercentage } from "../../Store/portfolio";
import {  } from "react-redux";

const PortfolioForm = () => {
  const dispatch = useDispatch();
  const { portfolioSize, exitPercentage, riskPercentage } = useSelector((state) => state.portfolio);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updatePortfolioSize(Number(portfolioSize)));
    dispatch(updateExitPercentage(Number(exitPercentage)));
    dispatch(updateRiskPercentage(Number(riskPercentage)));
    alert("Portfolio settings updated!");
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        Update Portfolio Settings
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Portfolio Size"
          type="number"
          value={portfolioSize}
          onChange={(e) => dispatch(updatePortfolioSize(Number(e.target.value)))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Exit Percentage"
          type="number"
          value={exitPercentage}
          onChange={(e) => dispatch(updateExitPercentage(Number(e.target.value)))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Risk Percentage"
          type="number"
          value={riskPercentage}
          onChange={(e) => dispatch(updateRiskPercentage(Number(e.target.value)))}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 2 }}>
          Update
        </Button>
      </form>
    </Box>
  );
};

export default PortfolioForm;
