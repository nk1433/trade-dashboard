import { useSelector } from 'react-redux';
import { useState } from 'react';

export const useWatchlistFilter = () => {
  const {
    orderMetrics,
    bullishBurst,
    bearishBurst,
    bullishSLTB,
    bearishSLTB,
    bullishAnts,
    dollar,
    bearishDollar,
  } = useSelector(state => state.orders);

  const [selectedIndex, setSelectedIndex] = useState('all');

  const handleSelectionChange = (event) => {
    setSelectedIndex(event.target.value);
  };

  const scriptsToShow = (() => {
    switch (selectedIndex) {
      case 'bullishMB': return bullishBurst || {};
      case 'bearishMB': return bearishBurst || {};
      case 'bullishSLTB': return bullishSLTB || {};
      case 'bearishSLTB': return bearishSLTB || {};
      case 'bullishAnts': return bullishAnts || {};
      case 'dollar': return dollar || {};
      case 'bearishDollar': return bearishDollar || {};
      case 'all':
      default: return orderMetrics || {};
    }
  })();

  // Construct counts in the hook
  const counts = {
    all: Object.keys(orderMetrics || {}).length,
    bullishMB: Object.keys(bullishBurst || {}).length,
    bearishMB: Object.keys(bearishBurst || {}).length,
    bullishSLTB: Object.keys(bullishSLTB || {}).length,
    bearishSLTB: Object.keys(bearishSLTB || {}).length,
    bullishAnts: Object.keys(bullishAnts || {}).length,
    dollar: Object.keys(dollar || {}).length,
    bearishDollar: Object.keys(bearishDollar || {}).length,
  };

  return {
    selectedIndex,
    handleSelectionChange,
    scriptsToShow,
    counts,
  };
};
