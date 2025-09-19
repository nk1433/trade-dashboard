import { useEffect, useRef, memo } from 'react';
import { useSelector } from 'react-redux';

function TVChart() {
  const container = useRef(null);
  const scriptRef = useRef(null);
  const { bullishBurst } = useSelector(state => state.orders);

  useEffect(() => {
    // On first mount only: insert script, keep DOM stable
    if (container.current && !scriptRef.current) {
      const watchlist = Object.values(bullishBurst).map(({symbol}) => `BSE:${symbol}`);
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = `
    {
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": true,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": false,
      "hotlist": false,
      "interval": "D",
      "locale": "en",
      "save_image": true,
      "style": "1",
      "symbol": "BSE:TCS",
      "theme": "light",
      "timezone": "Etc/UTC",
      "backgroundColor": "#ffffff",
      "gridColor": "rgba(46, 46, 46, 0.06)",
      "watchlist": ${JSON.stringify(watchlist)},
      "withdateranges": false,
      "compareSymbols": [],
      "studies": [],
      "width": 1200,
      "height": 610
    }`;
      container.current.appendChild(script);
      scriptRef.current = script;
    }
    // Cleanup only on unmount (not on every update)
    return () => {
      if (container.current && scriptRef.current) {
        container.current.innerHTML = '';
        scriptRef.current = null;
      }
    };
  }, []); // <-- only run once

  return <div className="tradingview-widget-container" ref={container}></div>;
}

export default memo(TVChart);
