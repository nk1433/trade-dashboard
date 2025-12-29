import React from 'react';
import { Box } from '@mui/material';
import moment from 'moment';
import PropTypes from 'prop-types';
import CommonLineChart from './CommonLineChart';
import BreadthDifference from './BreadthDifference';

const mapping = {
    fourPercentage: ['up4Percent', 'down4Percent'],
    eightPercentage: ['up8Pct5d', 'down8Pct5d'],
    twentyPercentage: ['up20Pct5d', 'down20Pct5d'],
};

const CombinedMarketBreadthChart = ({ data, field }) => {
    // Default to fourPercentage if field is missing or invalid
    const [upKey, downKey] = mapping[field] || mapping.fourPercentage;

    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Dates for X-Axis
    const dates = sortedData.map(item => moment(item.date).format('DD/MM/YY'));

    const upSeriesData = sortedData.map(item => item[upKey]);
    const downSeriesData = sortedData.map(item => Math.abs(item[downKey] || 0));

    return (
        <Box sx={{ width: '100%', height: 500, bgcolor: 'white', p: 2 }}>
            <CommonLineChart
                height={450}
                series={[
                    {
                        label: "Up",
                        data: upSeriesData,
                        curve: "monotoneX",
                        area: false, // Custom fill handles this
                        showMark: false,
                        width: 2,
                        color: '#000000',
                    },
                    {
                        label: "Down",
                        data: downSeriesData,
                        curve: "monotoneX",
                        area: false, // Custom fill handles this
                        showMark: false,
                        width: 2,
                        color: '#9e9e9e',
                    }
                ]}
                xAxis={[{
                    data: dates,
                    label: "Date",
                    scaleType: "point",
                    tickLabelStyle: {
                        angle: -45,
                        textAnchor: 'end',
                        fontSize: 10,
                        fontFamily: 'Roboto Mono'
                    }
                }]}
            >
                <BreadthDifference
                    data={sortedData}
                    upKey={upKey}
                    downKey={downKey}
                    dates={dates}
                />
            </CommonLineChart>
        </Box>
    );
};

CombinedMarketBreadthChart.propTypes = {
    data: PropTypes.array,
    field: PropTypes.string,
};

export default CombinedMarketBreadthChart;
