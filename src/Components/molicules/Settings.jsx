import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tabs, Tab, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PortfolioForm from './PortfolioForm';
import AllocationIntentForm from './AllocationForm';
import { setTradingMode } from '../../Store/settings';

const Settings = () => {
    const [value, setValue] = useState(0);

    const dispatch = useDispatch();
    const tradingMode = useSelector((state) => state.settings?.tradingMode || 'PAPER');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleTradingModeChange = (event) => {
        dispatch(setTradingMode(event.target.value));
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="settings-trading-mode-label">Trading Mode</InputLabel>
                    <Select
                        labelId="settings-trading-mode-label"
                        value={tradingMode}
                        label="Trading Mode"
                        onChange={handleTradingModeChange}
                    >
                        <MenuItem value="PAPER">Paper Trading</MenuItem>
                        <MenuItem value="PROD">Production</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="settings tabs"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'black',
                        },
                        '& .MuiTab-root': {
                            color: 'gray',
                            '&.Mui-selected': {
                                color: 'black',
                            },
                        },
                    }}
                >
                    <Tab label="Configs" />
                    <Tab label="Calculator" />
                </Tabs>
            </Box>
            <div role="tabpanel" hidden={value !== 0}>
                {value === 0 && <PortfolioForm tradingMode={tradingMode} />}
            </div>
            <div role="tabpanel" hidden={value !== 1}>
                {value === 1 && <AllocationIntentForm />}
            </div>
        </Box>
    );
};

export default Settings;
