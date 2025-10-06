import React from 'react';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';

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
  return (
    <FormControl component="fieldset" sx={{ mb: 2 }}>
      <FormLabel component="legend" sx={{ fontSize: 14, mb: 0.7 }}>Select View</FormLabel>
      <RadioGroup value={selectedIndex} onChange={handleSelectionChange}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mt: 1 }}>
          {/* Bullish side */}
          <Box display="flex" flexDirection="column" gap={0.4}>
            <FormControlLabel
              value="all"
              control={<Radio sx={slimRadioSx} />}
              label={`All - ${counts.all}`}
              sx={slimLabelSx}
            />
            <FormControlLabel
              value="bullishMB"
              control={<Radio sx={slimRadioSx} />}
              label={`Bullish MB - ${counts.bullishMB}`}
              sx={slimLabelSx}
            />
            <FormControlLabel
              value="bullishSLTB"
              control={<Radio sx={slimRadioSx} />}
              label={`Bullish SLTB - ${counts.bullishSLTB}`}
              sx={slimLabelSx}
            />
            <FormControlLabel
              value="bullishAnts"
              control={<Radio sx={slimRadioSx} />}
              label={`Bullish Ants - ${counts.bullishAnts}`}
              sx={slimLabelSx}
            />
            <FormControlLabel
              value="dollar"
              control={<Radio sx={slimRadioSx} />}
              label={`$ dollar - ${counts.dollar}`}
              sx={slimLabelSx}
            />
          </Box>
          {/* Bearish side */}
          <Box display="flex" flexDirection="column" gap={0.4}>
            <FormControlLabel
              value="bearishMB"
              control={<Radio sx={slimRadioSx} />}
              label={`Bearish MB - ${counts.bearishMB}`}
              sx={slimLabelSx}
            />
            <FormControlLabel
              value="bearishSLTB"
              control={<Radio sx={slimRadioSx} />}
              label={`Bearish SLTB - ${counts.bearishSLTB}`}
              sx={slimLabelSx}
            />
            <FormControlLabel
              value="bearishDollar"
              control={<Radio sx={slimRadioSx} />}
              label={`Bearish $ dollar - ${counts.bearishDollar}`}
              sx={slimLabelSx}
            />
          </Box>
        </Box>
      </RadioGroup>
    </FormControl>
  );
};

export default WatchlistFilterForm;
