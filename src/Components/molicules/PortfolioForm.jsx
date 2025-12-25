import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextField, Button, Box, Typography, Snackbar, Alert } from '@mui/material';
import { updateExitPercentage, updateRiskPercentage, fetchPortfolioSize, updatePortfolioSize, saveUserSettings, updateMaxAllowedAllocation } from '../../Store/portfolio';
import { setPaperCapital } from '../../Store/paperTradeSlice';
import { commonInputProps } from '../../utils/themeStyles';

const PortfolioForm = ({ tradingMode }) => {
  const dispatch = useDispatch();
  const portfolioState = useSelector(state => state.portfolio);
  const { loading, error } = portfolioState;

  // Select settings based on the passed tradingMode prop
  const activeSettings = tradingMode === 'PROD' ? portfolioState.prod : portfolioState.paper;
  const { portfolioSize, exitPercentage, riskPercentage, maxAllowedAllocation } = activeSettings || {};

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    // Only fetch from API if in PROD mode
    if (tradingMode === 'PROD') {
      dispatch(fetchPortfolioSize());
    }
  }, [dispatch, tradingMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dispatch updates with the current mode
    // Note: portfolioSize is read-only for PROD (from API), but editable for PAPER
    if (tradingMode === 'PAPER') {
      dispatch(updatePortfolioSize({ mode: 'paper', value: Number(portfolioSize) }));
      dispatch(setPaperCapital(Number(portfolioSize)));
    }
    dispatch(updateExitPercentage({ mode: tradingMode === 'PROD' ? 'prod' : 'paper', value: Number(exitPercentage) }));
    dispatch(updateRiskPercentage({ mode: tradingMode === 'PROD' ? 'prod' : 'paper', value: Number(riskPercentage) }));
    dispatch(updateMaxAllowedAllocation({ mode: tradingMode === 'PROD' ? 'prod' : 'paper', value: Number(maxAllowedAllocation) }));
    const updatedSettings = {
      prod: tradingMode === 'PROD' ? { ...portfolioState.prod, exitPercentage, riskPercentage, maxAllowedAllocation } : portfolioState.prod,
      paper: tradingMode === 'PAPER' ? { ...portfolioState.paper, portfolioSize, exitPercentage, riskPercentage, maxAllowedAllocation } : portfolioState.paper
    };
    dispatch(saveUserSettings(updatedSettings));

    setSnackbarMessage(`${tradingMode === 'PROD' ? 'Production' : 'Paper Trading'} settings updated!`);
    setSnackbarOpen(true);
  };

  return (
    <div className="geist-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
        Update Portfolio Settings ({tradingMode === 'PROD' ? 'Production' : 'Paper Trading'})
      </Typography>

      {loading && <Typography>Loading portfolio size...</Typography>}
      {error && <Typography color="error">{error}</Typography>}

      <form onSubmit={handleSubmit}>
        <TextField
          label={tradingMode === 'PROD' ? "Portfolio Size (from API)" : "Paper Capital"}
          type="number"
          value={portfolioSize || ''}
          onChange={(e) => {
            if (tradingMode === 'PAPER') {
              const newVal = Number(e.target.value);
              dispatch(updatePortfolioSize({ mode: 'paper', value: newVal }));
              dispatch(setPaperCapital(newVal));
            }
          }}
          disabled={tradingMode === 'PROD'}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
          helperText={tradingMode === 'PROD' ? "Synced from Upstox" : "Manually set for simulation"}
          {...commonInputProps}
        />
        <TextField
          label="Exit Percentage"
          type="number"
          value={exitPercentage || ''}
          onChange={(e) => dispatch(updateExitPercentage({ mode: tradingMode === 'PROD' ? 'prod' : 'paper', value: Number(e.target.value) }))}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
          {...commonInputProps}
        />
        <TextField
          label="Risk Percentage"
          type="number"
          value={riskPercentage || ''}
          onChange={(e) => dispatch(updateRiskPercentage({ mode: tradingMode === 'PROD' ? 'prod' : 'paper', value: Number(e.target.value) }))}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
          {...commonInputProps}
        />

        <TextField
          label="Max Allowed Allocation %"
          type="number"
          value={maxAllowedAllocation || ''}
          onChange={(e) => dispatch(updateMaxAllowedAllocation({ mode: tradingMode === 'PROD' ? 'prod' : 'paper', value: Number(e.target.value) }))}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
          {...commonInputProps}
        />

        <Button
          type="submit"
          variant="contained"
          disableElevation
          sx={{
            marginTop: 2,
            backgroundColor: 'black',
            color: 'white',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#333'
            }
          }}
          disabled={loading}
        >
          Update Settings
        </Button>
      </form>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%', bgcolor: '#333', color: '#fff', '& .MuiAlert-icon': { color: '#4caf50' } }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PortfolioForm;
