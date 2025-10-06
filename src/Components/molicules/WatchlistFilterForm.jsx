import React from 'react';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';

const WatchlistFilterForm = ({ selectedIndex, handleSelectionChange, counts }) => {
  return (
    <FormControl component="fieldset" sx={{ mb: 2 }}>
      <FormLabel component="legend">Select View</FormLabel>
      <RadioGroup row value={selectedIndex} onChange={handleSelectionChange}>
        <FormControlLabel value="all" control={<Radio />} label={`All - ${counts.all}`} />
        <FormControlLabel value="bullishMB" control={<Radio />} label={`Bullish MB - ${counts.bullishMB}`} />
        <FormControlLabel value="bearishMB" control={<Radio />} label={`Bearish MB - ${counts.bearishMB}`} />
        <FormControlLabel value="bullishSLTB" control={<Radio />} label={`Bullish SLTB - ${counts.bullishSLTB}`} />
        <FormControlLabel value="bearishSLTB" control={<Radio />} label={`Bearish SLTB - ${counts.bearishSLTB}`} />
        <FormControlLabel value="bullishAnts" control={<Radio />} label={`Bullish Ants - ${counts.bullishAnts}`} />
        <FormControlLabel value="dollar" control={<Radio />} label={`$ dollar - ${counts.dollar}`} />
        <FormControlLabel value="bearishDollar" control={<Radio />} label={`Bearish $ dollar - ${counts.bearishDollar}`} />
      </RadioGroup>
    </FormControl>
  );
};

export default WatchlistFilterForm;
