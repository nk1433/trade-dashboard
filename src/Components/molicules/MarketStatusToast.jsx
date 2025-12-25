
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';

const MarketStatusToast = () => {
    const { marketStatus, isLoading, todayHoliday } = useSelector((state) => state.marketStatus);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Show toast ONLY when we explicitly determine market is CLOSED
        // AND we aren't loading 
        // AND it is NOT a holiday (since banner shows for holidays)
        if (!isLoading && marketStatus === 'CLOSED' && !todayHoliday) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [marketStatus, isLoading, todayHoliday]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={5000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={handleClose} severity="warning" sx={{ width: '100%' }} variant="filled">
                Market is currently CLOSED.
            </Alert>
        </Snackbar>
    );
};

export default MarketStatusToast;
