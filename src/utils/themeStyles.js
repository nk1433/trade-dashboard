export const commonInputProps = {
    slotProps: {
        inputLabel: {
            shrink: true,
            sx: {
                fontSize: '0.85rem',
                '&.Mui-focused': {
                    color: '#000',  // label color
                }
            }
        },
        input: {
            sx: {
                fontSize: '0.9rem',
                '&:focus': {
                    outline: 'none',
                },
                '&:focus-visible': {
                    outline: 'none',
                }
            }
        }
    },
    sx: {
        '& .MuiOutlinedInput-root': {
            // remove blue shadow / outline
            '&.Mui-focused': {
                boxShadow: 'none !important',
                outline: 'none !important',
            },

            // border color when focused
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#000 !important',
            },

            // default border
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ccc',
            }
        }
    }
};

export const commonSelectSx = {
    // remove blue shadow / outline
    '&.Mui-focused': {
        boxShadow: 'none !important',
        outline: 'none !important',
    },
    // border color when focused
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#000 !important',
    },
    // default border
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#ccc',
    }
};

export const commonInputLabelSx = {
    '&.Mui-focused': {
        color: '#000 !important',
    }
};
