import React, { useEffect, useRef, useState } from "react";
import { widget } from "../../charting_library";
import Datafeed from "./datafeed/datafeed_custom";
import { useWatchlistFilter } from "../../hooks/useWatchlistFilter";
import WatchlistFilterForm from "../molicules/WatchlistFilterForm";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material';

const TVChartContainer = () => {
  const chartContainerRef = useRef();
  const tvWidgetRef = useRef(null);
  const { selectedIndex, handleSelectionChange, scriptsToShow, counts } = useWatchlistFilter();
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  // Convert filtered scripts object into array for stock list
  const dynamicStockList = Object.values(scriptsToShow);

  useEffect(() => {
    const widgetOptions = {
      symbol: "NSE_EQ|INE002A01018|RELIANCE", // Initial symbol with name
      datafeed: Datafeed,
      container: chartContainerRef.current,
      library_path: "/charting_library/",
      interval: "1D",
      locale: "en",
      timezone: "Asia/Kolkata",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_symbol_search",
        "symbol_search_hot_key",
      ],
      enabled_features: ["watchlist_sections"],
      charts_storage_url: "https://saveload.tradingview.com",
      charts_storage_api_version: "1.1",
      client_id: "tradingview.com",
      user_id: "public_user_id",
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
      supports_marks: false,
      supports_timescale_marks: false,
      theme: "light",
      overrides: {
        "paneProperties.background": "#ffffff",
        "paneProperties.vertGridProperties.color": "rgba(46, 46, 46, 0.06)",
        "paneProperties.horzGridProperties.color": "rgba(46, 46, 46, 0.06)",
        "mainSeriesProperties.candleStyle.upColor": "#ffffff",
        "mainSeriesProperties.candleStyle.downColor": "#000000",
        "mainSeriesProperties.candleStyle.borderUpColor": "#000000",
        "mainSeriesProperties.candleStyle.borderDownColor": "#000000",
        "mainSeriesProperties.candleStyle.wickUpColor": "#000000",
        "mainSeriesProperties.candleStyle.wickDownColor": "#000000",
        "mainSeriesProperties.statusViewStyle.showInterval": true,
        "mainSeriesProperties.statusViewStyle.symbolTextSource": "ticker",
      },
    };

    const tvWidget = new widget(widgetOptions);
    tvWidgetRef.current = tvWidget;

    return () => {
      tvWidget.remove();
      tvWidgetRef.current = null;
    };
  }, []);

  const handleStockClick = (symbol, instrumentKey) => {
    setSelectedSymbol(symbol);
    if (tvWidgetRef.current) {
      // Construct composite symbol: InstrumentKey|TradingSymbol
      // Example: NSE_EQ|INE002A01018|RELIANCE
      const compositeSymbol = `${instrumentKey}|${symbol}`;

      tvWidgetRef.current.onChartReady(() => {
        tvWidgetRef.current.activeChart().setSymbol(compositeSymbol);
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', width: '100%' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid var(--border-color)' }}>
        <WatchlistFilterForm
          selectedIndex={selectedIndex}
          handleSelectionChange={handleSelectionChange}
          counts={counts}
        />
      </Box>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chart Area */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <div ref={chartContainerRef} style={{ height: '100%', width: '100%' }} />
        </Box>

        {/* Side Panel */}
        <Box sx={{
          width: 280,
          borderLeft: '1px solid var(--border-color)',
          bgcolor: 'var(--bg-secondary)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid var(--border-color)' }}>
            <Typography variant="subtitle1" fontWeight={600}>Watchlist</Typography>
            <Typography variant="caption" color="text.secondary">
              {dynamicStockList.length} Symbols
            </Typography>
          </Box>
          <List disablePadding>
            {dynamicStockList.map((stock, index) => (
              <React.Fragment key={stock.instrumentKey || index}>
                <ListItemButton
                  selected={selectedSymbol === stock.symbol}
                  onClick={() => handleStockClick(stock.symbol, stock.instrumentKey)}
                  sx={{
                    '&.Mui-selected': { bgcolor: 'rgba(0,0,0,0.05)' },
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                  }}
                >
                  <ListItemText
                    primary={stock.symbol}
                    secondary={
                      <Typography variant="caption" component="span">
                        LTP: {stock.ltp || '-'} | Vol: {stock.relativeVolumePercentage ? `${stock.relativeVolumePercentage}%` : '-'}
                      </Typography>
                    }
                  />
                </ListItemButton>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  );
};

export default TVChartContainer;
