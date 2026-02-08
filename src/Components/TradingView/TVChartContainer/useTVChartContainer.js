import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { widget } from "../../../charting_library";
import Datafeed from "../datafeed/datafeed_custom";
import { useWatchlistFilter } from "../../../hooks/useWatchlistFilter";
import { fetchMarketBreadth } from '../../../Store/marketBreadth';
import { createBreadthStudy } from '../studies/breadthStudy';
import { createMomentumBurstStudy } from '../studies/momentumBurstStudy';
import { createTI65Study } from '../studies/ti65Study';
import { BACKEND_URL } from '../../../utils/config';
import universe from '../../../index/universe.json';

const AVAILABLE_COLUMNS = [
    { id: 'flag', label: 'Flag', minWidth: 50 },  // New Flag Column
    { id: 'scriptName', label: 'Script', minWidth: 100 },
    { id: 'ltp', label: 'LTP', minWidth: 70 },
    { id: 'changePercentage', label: 'Chg%', minWidth: 60 },
    { id: 'priceChange', label: 'Chg', minWidth: 70 },
    { id: 'barClosingStrength', label: 'Str%', minWidth: 60 },
    { id: 'relativeVolumePercentage', label: 'RVol%', minWidth: 60 },
    { id: 'gapPercentage', label: 'Gap%', minWidth: 60 },
    { id: 'currentMinuteVolume', label: 'VolROC%', minWidth: 70 },
    { id: 'sl', label: 'SL', minWidth: 60 },
    { id: 'maxShareToBuy', label: 'Shares', minWidth: 60 },
    { id: 'lossInMoney', label: 'Loss', minWidth: 60 },
    { id: 'avgValueVolume21d', label: 'AvgVol', minWidth: 80 },
    { id: 'placeOrder', label: 'Order', minWidth: 80 },
];

export const useTVChartContainer = () => {
    const chartContainerRef = useRef();
    const tvWidgetRef = useRef(null);
    const {
        selectedIndex,
        handleSelectionChange,
        scriptsToShow,
        counts,
        flaggedStocks, // New
        toggleFlag     // New
    } = useWatchlistFilter();

    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id || 'public_user_id';

    const dispatch = useDispatch();
    const breadthData = useSelector(state => state.marketBreadth.data);

    // Column Customization State
    const [visibleColumns, setVisibleColumns] = useState(['flag', 'scriptName', 'changePercentage', 'priceChange']); // Add 'flag' by default
    const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    const openMenu = Boolean(anchorEl);
    const openSettings = Boolean(settingsAnchorEl);

    // Optimize universe lookup
    const universeMap = useMemo(() => {
        return universe.reduce((acc, script) => {
            acc[script.instrument_key] = script;
            return acc;
        }, {});
    }, []);

    useEffect(() => {
        if (!breadthData || breadthData.length === 0) {
            dispatch(fetchMarketBreadth());
        }
    }, [dispatch, breadthData]);

    useEffect(() => {
        // Wait for breadth data to populate to ensure study works correctly
        if (!breadthData || breadthData.length === 0) return;

        const initWidget = async () => {
            // ... (existing widget init logic omitted for brevity, logic remains same)
            let savedData = null;
            let savedDataMetaInfo = null;
            let initialSymbol = "NSE_EQ|INE002A01018|RELIANCE";

            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // 1. Fetch list of charts
                const listRes = await fetch(`${BACKEND_URL}/api/tv/1.1/charts?client=trade-dashboard&user=${userId}`, { headers });
                const listData = await listRes.json();

                if (listData.status === 'ok' && listData.data && listData.data.length > 0) {
                    const latestChart = listData.data[0];
                    // initialSymbol = latestChart.symbol; // saved_data should handle symbol, but keeping as fallback

                    // 2. Fetch content of the latest chart
                    const contentRes = await fetch(`${BACKEND_URL}/api/tv/1.1/charts?client=trade-dashboard&user=${userId}&chart=${latestChart.id}`, { headers });
                    const contentData = await contentRes.json();

                    if (contentData.status === 'ok' && contentData.data && contentData.data.content) {
                        savedData = JSON.parse(contentData.data.content);
                        savedDataMetaInfo = {
                            uid: latestChart.id,
                            name: latestChart.name,
                            description: latestChart.description || "",
                            timestamp: latestChart.timestamp,
                            resolution: latestChart.resolution,
                            symbol: latestChart.symbol,
                        };
                    }
                }
            } catch (e) {
                console.error("Failed to fetch saved chart data", e);
            }

            const widgetOptions = {
                symbol: initialSymbol || "NSE_EQ|INE002A01018|RELIANCE",
                saved_data: savedData,
                saved_data_meta_info: savedDataMetaInfo,
                datafeed: Datafeed,
                interval: "1D",
                container: chartContainerRef.current,
                library_path: "/charting_library/",
                locale: "en",
                timezone: "Asia/Kolkata",
                fullscreen: true,
                autosize: true,
                auto_save_delay: 5,
                charts_storage_url: `${BACKEND_URL}/api/tv`,
                charts_storage_api_version: "1.1",
                client_id: "trade-dashboard",
                user_id: userId,
                custom_headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                symbol_search_complete: (symbol, searchResultItem) => {
                    return new Promise((resolve) => {
                        const allScripts = universe;
                        const foundScript = allScripts.find(s => s.tradingsymbol === symbol || s.instrument_key === symbol);

                        if (foundScript) {
                            resolve({ symbol: foundScript.instrument_key, name: foundScript.name });
                        } else {
                            resolve({ symbol: symbol, name: symbol });
                        }
                    });
                },
                custom_formatters: {
                    dateFormatter: {
                        format: (date) => {
                            return date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear();
                        }
                    }
                },
                custom_indicators_getter: (PineJS) => {
                    console.log("TVChartContainer: custom_indicators_getter called");
                    return Promise.resolve([
                        createBreadthStudy({
                            field: 'up4Percent',
                            name: 'MarketBreadthUp',
                            description: 'Market Breadth Up 4%',
                            color: '#808080' // Grey
                        }, breadthData),
                        createBreadthStudy({
                            field: 'down4Percent',
                            name: 'MarketBreadthDown',
                            description: 'Market Breadth Down 4%',
                            color: '#FF0000' // Red
                        }, breadthData),
                        createMomentumBurstStudy(PineJS),
                        createTI65Study(PineJS)
                    ]);
                }
            };

            const tvWidget = new widget(widgetOptions);

            tvWidget.onChartReady(() => {
                try {
                    // Get the IWatermarkApi instance
                    const watermarkApi = tvWidget.watermark();

                    if (!watermarkApi) {
                        console.error("TVChartContainer: Watermark API not available.");
                        return;
                    }

                    // Define your custom content provider function
                    const customContentProvider = (data) => {
                        if (!data || !data.symbolInfo) {
                            console.warn("TVChartContainer: Watermark content provider missing symbolInfo", data);
                            return [];
                        }
                        const { symbolInfo } = data;
                        const script = universeMap[symbolInfo.ticker];

                        return [
                            {
                                text: script ? script.tradingsymbol : symbolInfo.name,
                                fontSize: 30,
                                lineHeight: 10,
                                vertOffset: 0
                            },
                            {
                                text: script ? script.industry : '',
                                fontSize: 20,
                                lineHeight: 30,
                                vertOffset: 30
                            },
                            {
                                text: script ? script.sector : '',
                                fontSize: 20,
                                lineHeight: 30,
                                vertOffset: 30
                            }
                        ];
                    };

                    // Set the custom provider
                    watermarkApi.setContentProvider(customContentProvider);
                    watermarkApi.visibility().setValue(true);
                    watermarkApi.color().setValue("rgba(115, 125, 115, 0.5)");

                } catch (error) {
                    console.error("TVChartContainer: Error setting up watermark", error);
                }
            });
            tvWidgetRef.current = tvWidget;
        };

        initWidget();

        return () => {
            if (tvWidgetRef.current) {
                tvWidgetRef.current.remove();
                tvWidgetRef.current = null;
            }
        };
    }, [breadthData, universeMap, userId]);

    // Handlers
    const handleStockClick = useCallback((row) => {
        const symbol = row.symbol;
        const instrumentKey = row.instrumentKey;
        setSelectedSymbol(symbol);
        if (tvWidgetRef.current) {
            // Construct composite symbol: InstrumentKey|TradingSymbol
            const compositeSymbol = `${instrumentKey}|${symbol}`;

            tvWidgetRef.current.onChartReady(() => {
                tvWidgetRef.current.activeChart().setSymbol(compositeSymbol);
            });
        }
    }, []);

    const handleMenuClick = useCallback((event) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback((value) => {
        setAnchorEl(null);
        if (value) {
            handleSelectionChange({ target: { value } });
        }
    }, [handleSelectionChange]);

    const handleSettingsClick = useCallback((event) => {
        setSettingsAnchorEl(event.currentTarget);
    }, []);

    const handleSettingsClose = useCallback(() => {
        setSettingsAnchorEl(null);
    }, []);

    const handleColumnToggle = useCallback((columnId) => {
        setVisibleColumns(prev => {
            if (prev.includes(columnId)) {
                return prev.filter(id => id !== columnId);
            } else {
                return [...prev, columnId];
            }
        });
    }, []);

    const getListName = useCallback((index) => {
        switch (index) {
            case 'bullishMB': return 'Bullish MB';
            case 'bullishSLTB': return 'Bullish SLTB';
            case 'bullishAnts': return 'Bullish Ants';
            case 'dollar': return 'Dollar BO';
            case 'bearishMB': return 'Bearish MB';
            case 'bearishSLTB': return 'Bearish SLTB';
            case 'bearishDollar': return 'Bearish Dollar';

            case 'redList': return 'Red List';
            case 'blueList': return 'Blue List';
            case 'greenList': return 'Green List';
            case 'orangeList': return 'Orange List';
            case 'purpleList': return 'Purple List';

            case 'all': return 'All Symbols';
            default: return 'Watchlist';
        }
    }, []);

    return {
        chartContainerRef,
        visibleColumns,
        anchorEl,
        openMenu,
        handleMenuClick,
        handleMenuClose,
        selectedIndex,
        getListName,
        counts,
        scriptsToShow,
        handleStockClick,
        handleSettingsClick,
        handleSettingsClose,
        openSettings,
        settingsAnchorEl,
        handleColumnToggle,
        AVAILABLE_COLUMNS,
        flaggedStocks, // Exposed
        toggleFlag     // Exposed
    };
};
