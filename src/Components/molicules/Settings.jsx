import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import PortfolioForm from './PortfolioForm';
import AllocationIntentForm from './AllocationForm';

const Settings = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
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
                {value === 0 && <PortfolioForm />}
            </div>
            <div role="tabpanel" hidden={value !== 1}>
                {value === 1 && <AllocationIntentForm />}
            </div>
        </Box>
    );
};

export default Settings;
