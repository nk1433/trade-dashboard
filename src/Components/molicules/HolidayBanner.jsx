
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Collapse, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const HolidayBanner = () => {
    const { todayHoliday } = useSelector((state) => state.marketStatus);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (todayHoliday) {
            setOpen(true);
            const timer = setTimeout(() => {
                setOpen(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [todayHoliday]);

    if (!todayHoliday) return null;

    return (
        <Box sx={{ width: '100%', mb: 0 }}>
            <Collapse in={open}>
                <Alert
                    severity="info"
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setOpen(false);
                            }}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                    sx={{
                        mb: 0,
                        borderRadius: 0,
                        '& .MuiAlert-message': { width: '100%', textAlign: 'center' }
                    }}
                >
                    <strong>Market Holiday:</strong> {todayHoliday.description}
                </Alert>
            </Collapse>
        </Box>
    );
};

export default HolidayBanner;
