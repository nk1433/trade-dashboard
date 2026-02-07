export const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
    },
    mainRow: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
    },
    chartWrapper: {
        flex: 1,
        position: 'relative'
    },
    chartContainer: {
        height: '100%',
        width: '100%'
    },
    sidePanel: {
        width: 380, // Wider for DataGrid
        borderLeft: '1px solid var(--border-color)',
        bgcolor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column'
    },
    sidePanelHeader: {
        p: 0.625, // 5px
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'var(--bg-primary)'
    },
    watchlistDropdown: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        borderRadius: 1,
        p: 0.5,
        '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
    },
    watchlistTitle: {
        mr: 0.5
    },
    popoverContent: {
        p: 2,
        maxHeight: 300,
        overflowY: 'auto'
    },
    subtitle: {
        mb: 1,
        fontWeight: 600
    },
    watchlistTableWrapper: {
        flex: 1,
        overflow: 'hidden'
    }
};
