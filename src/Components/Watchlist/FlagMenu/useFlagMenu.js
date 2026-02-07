import { useState, useCallback } from 'react';

// We are going to manage this state locally in the hook for now as per plan
// but since the plan mentioned `useWatchlistFilter`, we will stick to that.
// The `FlagMenu` component itself needs handle functions.

export const useFlagMenu = ({ onFlagChange }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleOpen = useCallback((event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback((event) => {
        if (event) event.stopPropagation();
        setAnchorEl(null);
    }, []);

    const handleSelectFlag = useCallback((color) => {
        if (onFlagChange) {
            onFlagChange(color);
        }
        handleClose();
    }, [onFlagChange, handleClose]);

    return {
        anchorEl,
        open,
        handleOpen,
        handleClose,
        handleSelectFlag
    };
};
