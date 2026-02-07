export const styles = {
    container: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    topToolbar: {
        p: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        bgcolor: 'transparent'
    },
    modeButton: {
        color: 'text.primary',
        borderColor: 'divider',
        textTransform: 'none',
        borderRadius: 2,
        pl: 2, pr: 1.5,
        minWidth: 130,
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'text.primary',
        }
    },
    menuPaperProps: {
        elevation: 3,
        sx: {
            mt: 1,
            minWidth: 140,
            borderRadius: 2,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
            },
        }
    },
    authStatusPaper: (isWarning) => ({
        mx: 2,
        mb: 1,
        p: 1.5,
        bgcolor: isWarning ? '#fff3e0' : '#e3f2fd',
        border: isWarning ? '1px solid #ffeasb' : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 2,
    }),
    connectButton: {
        textTransform: 'none',
        borderRadius: 4,
        px: 2,
        fontWeight: 600,
        boxShadow: 'none',
    },
    contentArea: {
        flex: 1,
        overflow: 'hidden',
    }
};
