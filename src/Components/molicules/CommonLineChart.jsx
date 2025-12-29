import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const CommonLineChart = ({ series, xAxis, height = 400, margin, grid, loading = false, loadingText = "Loading Data...", children, ...rest }) => {

    if (loading) {
        return (
            <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">{loadingText}</Typography>
            </Box>
        );
    }

    return (
        <LineChart
            height={height}
            margin={margin}
            grid={grid || { horizontal: true }}
            series={series}
            xAxis={xAxis}
            yAxis={rest.yAxis}
            slotProps={{
                legend: {
                    hidden: false,
                    direction: 'row',
                    position: { vertical: 'top', horizontal: 'right' },
                    padding: 0,
                    labelStyle: {
                        fontWeight: 600,
                        fontSize: 12
                    }
                },
            }}
            sx={{
                '.MuiAreaElement-root': {
                    fillOpacity: 0.3 // Increased opacity for better overlap visibility
                },
                ...rest.sx
            }}
        >
            {children}
        </LineChart>
    );
};

CommonLineChart.propTypes = {
    series: PropTypes.array.isRequired,
    xAxis: PropTypes.array.isRequired,
    height: PropTypes.number,
    margin: PropTypes.object,
    grid: PropTypes.object,
    loading: PropTypes.bool,
    loadingText: PropTypes.string,
};

export default CommonLineChart;
