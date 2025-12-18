import React from 'react';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from '@mui/material';

const slimLabelSx = {
  '& .MuiFormControlLabel-label': {
    fontSize: 13, // Smaller font
    padding: 0,   // No extra label padding
  },
  m: 0,           // Remove margins around the entire label
  py: 0.3,        // Minimal vertical padding
};

const slimRadioSx = {
  p: 0.2,         // Minimal radio padding
  mr: 1,          // Slight right margin for radio
};

const WatchlistFilterForm = ({ selectedIndex, handleSelectionChange, counts }) => {
  const filterGroups = [
    {
      label: 'Bullish',
      items: [
        { value: 'all', label: 'All', count: counts.all },
        { value: 'bullishMB', label: 'MB', count: counts.bullishMB },
        { value: 'bullishSLTB', label: 'SLTB', count: counts.bullishSLTB },
        { value: 'bullishAnts', label: 'Ants', count: counts.bullishAnts },
        { value: 'dollar', label: '$ Dollar', count: counts.dollar },
      ]
    },
    {
      label: 'Bearish',
      items: [
        { value: 'bearishMB', label: 'MB', count: counts.bearishMB },
        { value: 'bearishSLTB', label: 'SLTB', count: counts.bearishSLTB },
        { value: 'bearishDollar', label: '$ Dollar', count: counts.bearishDollar },
      ]
    },
    {
      label: 'Portfolio',
      items: [
        { value: 'holdings', label: 'Holdings', count: counts.holdings },
      ]
    }
  ];

  return (
    <div style={{ marginBottom: '2rem' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 2
      }}>
        {filterGroups.map((group) => (
          <Box key={group.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{
              color: 'var(--text-secondary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minWidth: '60px'
            }}>
              {group.label}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {group.items.map((item) => {
                const isActive = selectedIndex === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => handleSelectionChange({ target: { value: item.value } })}
                    style={{
                      appearance: 'none',
                      background: isActive ? 'black' : 'transparent',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      border: isActive ? '1px solid black' : '1px solid transparent',
                      borderRadius: '9999px',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {item.label}
                    <span style={{
                      fontSize: '0.75rem',
                      opacity: isActive ? 0.8 : 0.6,
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                      padding: '0 4px',
                      borderRadius: '4px',
                      minWidth: '16px',
                      textAlign: 'center'
                    }}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </div>
  );
};

export default WatchlistFilterForm;
