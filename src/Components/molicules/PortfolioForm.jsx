import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextField, Button, Box, Typography } from '@mui/material';
import { updateExitPercentage, updateRiskPercentage, fetchPortfolioSize } from '../../Store/portfolio';

const PortfolioForm = () => {
  const dispatch = useDispatch();
  const { portfolioSize, exitPercentage, riskPercentage, loading, error } = useSelector(state => state.portfolio);

  useEffect(() => {
    dispatch(fetchPortfolioSize());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // portfolioSize is from API, no manual update here
    dispatch(updateExitPercentage(Number(exitPercentage)));
    dispatch(updateRiskPercentage(Number(riskPercentage)));
    alert('Portfolio settings updated!');
  };

  return (
    <div className="geist-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
        Update Portfolio Settings
      </Typography>

      {loading && <Typography>Loading portfolio size...</Typography>}
      {error && <Typography color="error">{error}</Typography>}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Portfolio Size (from API)"
          type="number"
          value={portfolioSize}
          disabled
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
        />
        <TextField
          label="Exit Percentage"
          type="number"
          value={exitPercentage}
          onChange={(e) => dispatch(updateExitPercentage(Number(e.target.value)))}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
        />
        <TextField
          label="Risk Percentage"
          type="number"
          value={riskPercentage}
          onChange={(e) => dispatch(updateRiskPercentage(Number(e.target.value)))}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
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
    </div>
  );
};

export default PortfolioForm;
