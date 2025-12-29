import React, { useEffect, useRef, memo } from 'react';

function TradingViewFinancialsWidget({ symbol = "NSE:RELIANCE" }) {
    const container = useRef();

    useEffect(() => {
        if (!container.current) return;

        // Clear previous widget
        container.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-financials.js";
        script.type = "text/javascript";
        script.async = true;

        // Ensure symbol has an exchange prefix if not provided (defaulting to NSE for Indian context if just symbol)
        // Checks if it already contains ':'
        let formattedSymbol = symbol;
        if (!formattedSymbol.includes(':')) {
            // If it looks like a US symbol (e.g. AAPL) we might default to NASDAQ, but for this app context (mostly Indian) use NSE.
            // However, the user example used NASDAQ:AAPL. 
            // Let's rely on the input or default to NSE if it looks like an Indian script (most of existing app is NSE).
            formattedSymbol = `NSE:${symbol}`;
        }

        script.innerHTML = JSON.stringify({
            "symbol": formattedSymbol,
            "colorTheme": "light",
            "displayMode": "regular",
            "isTransparent": false,
            "locale": "en",
            "width": "100%", // Responsive width
            "height": "100%" // Responsive height
        });

        container.current.appendChild(script);

        return () => {
            if (container.current) {
                container.current.innerHTML = "";
            }
        };
    },
        [symbol]
    );

    return (
        <div className="tradingview-widget-container" ref={container} style={{ height: "400px", width: "100%" }}>
            <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
        </div>
    );
}

export default memo(TradingViewFinancialsWidget);
