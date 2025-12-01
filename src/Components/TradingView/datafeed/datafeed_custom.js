import { onReady } from './onReady';
import { resolveSymbol } from './resolveSymbol';
import { getBars, subscribeBars, unsubscribeBars } from './getBars';
import { searchSymbols } from './searchSymbols';

const Datafeed = {
  onReady,
  resolveSymbol,
  getBars,
  subscribeBars,
  unsubscribeBars,
  searchSymbols,
};

export default Datafeed;
