// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from 'react';

function TVChart() {
  const container = useRef();

  useEffect(
    () => {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
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
          "watchlist": [],
          "withdateranges": false,
          "compareSymbols": [],
          "studies": [],
          "width": 1200,
          "height": 610
        }`;
      container.current.appendChild(script);
    },
    []
  );

  return (
    <div className="tradingview-widget-container" ref={container}>
      <br />
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/symbols/BSE-TCS/?exchange=BSE" rel="noopener nofollow" target="_blank"><span className="blue-text">TCS chart by TradingView</span></a></div>
    </div>
  );
}

export default memo(TVChart);
