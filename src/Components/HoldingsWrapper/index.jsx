import React from 'react';
import { useSelector } from 'react-redux';
import PaperHoldings from '../PaperHoldings';
import ProdHoldings from '../ProdHoldings';
import { Box, Typography } from '@mui/material';

const HoldingsWrapper = () => {
    const { tradingMode } = useSelector((state) => state.settings);
    console.log(tradingMode, 'tradingMode')

    return (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
            {tradingMode === 'PROD' ? <ProdHoldings /> : <PaperHoldings />}
        </Box>
    );
};

export default HoldingsWrapper;
