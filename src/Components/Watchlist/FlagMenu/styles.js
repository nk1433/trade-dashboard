export const styles = {
    iconButton: {
        padding: 0.5,
    },
    menuPaper: {
        mt: 1,
        p: 1,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    colorContainer: {
        display: 'flex',
        gap: 1,
    },
    colorCircle: (color, isSelected) => ({
        width: 20,
        height: 20,
        borderRadius: '50%',
        bgcolor: color,
        cursor: 'pointer',
        border: isSelected ? '2px solid black' : '1px solid transparent', // Highlight selected
        transition: 'transform 0.1s',
        '&:hover': {
            transform: 'scale(1.1)',
            border: '1px solid #ccc',
        }
    }),
    clearButton: {
        ml: 1,
        cursor: 'pointer',
        fontSize: '0.8rem',
        color: 'text.secondary',
        '&:hover': {
            color: 'error.main',
        }
    }
};

export const FLAG_COLORS = {
    red: '#ff5252',
    blue: '#448aff',
    green: '#69f0ae',
    orange: '#ffab40',
    purple: '#e040fb',
};
