import React from 'react';
import { useSelector } from 'react-redux';
import PaperHoldings from '../PaperHoldings';
import ProdHoldings from '../ProdHoldings';
import { Box, Typography } from '@mui/material';

const HoldingsWrapper = () => {
    const { tradingMode } = useSelector((state) => state.settings);
    console.log(tradingMode, 'tradingMode')

    return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                {tradingMode === 'PROD' ? 'Production Holdings' : 'Paper Holdings'}
            </Typography>
            {tradingMode === 'PROD' ? <ProdHoldings /> : <PaperHoldings />}
        </Box>
    );
};

export default HoldingsWrapper;
