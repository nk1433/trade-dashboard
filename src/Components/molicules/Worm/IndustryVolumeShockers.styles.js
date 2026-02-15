export const styles = {
    container: {
        p: 3,
        borderRadius: 0,
        border: '1px solid #eee',
        mt: 4,
        width: '100%',
    },
    header: {
        mb: 3,
        textAlign: 'center'
    },
    title: {
        letterSpacing: 2,
        color: '#9e9e9e',
        fontWeight: 600,
        display: 'block',
        mb: 2
    },
    pillContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: 2
    },
    pill: (isActive, mode, theme) => ({
        px: 3,
        py: 0.5,
        borderRadius: 10,
        cursor: 'pointer',
        bgcolor: isActive ? '#000' : 'transparent',
        color: isActive ? '#fff' : 'text.secondary',
        border: '1px solid',
        borderColor: isActive ? '#000' : 'divider',
        transition: 'all 0.2s',
        '&:hover': {
            borderColor: '#000',
            color: isActive ? '#fff' : '#000'
        }
    }),
    tableContainer: {
        maxHeight: 400
    },
    positiveText: {
        color: 'success.main'
    },
    negativeText: {
        color: 'error.main'
    }
};
