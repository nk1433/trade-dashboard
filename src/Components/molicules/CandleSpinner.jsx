
import React from 'react';
import { Box } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const dash = keyframes`
  to {
    stroke-dashoffset: -1000;
  }
`;

const AnimatedPath = styled('path')(({ theme }) => ({
    strokeDasharray: "80 1000",
    strokeDashoffset: 1000,
    animation: `${dash} 12s linear infinite`,
}));

const CandleSpinner = ({ width = 100, height = 100, color = 'black' }) => {
    // Path definition (Candle shape)
    // Length is approx 320 units
    const pathData = `
    M 0 50 
    L 35 50 
    L 35 30 
    L 48 30 
    L 48 10 
    L 52 10 
    L 52 30 
    L 65 30 
    L 65 70 
    L 52 70 
    L 52 90 
    L 48 90 
    L 48 70 
    L 35 70 
    L 35 50 
    L 100 50
  `;

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg
                width={width}
                height={height}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Background track (faint) so the shape is visible */}
                <path
                    d={pathData}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.1"
                />

                {/* Moving "flare" */}
                <AnimatedPath
                    d={pathData}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Box>
    );
};

export default CandleSpinner;
