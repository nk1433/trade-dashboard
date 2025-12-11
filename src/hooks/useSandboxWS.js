import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { generateMockFeed } from "../utils/mockFeedGenerator";
import { updateWatchlistWithMetrics } from "./useUpstoxWS";
import {
    setOrderMetrics, setBearishMB, setBullishMB,
    setBullishSLTB, setBearishSLTB,
    setBullishAnts,
    setDollarBo,
    setBearishDollarBo,
} from "../Store/upstoxs";
import socketEventEmitter from "../utils/socketEventEmitter";
import niftymidsmall400float from "../index/niftymidsmall400-float.json";
import niftylargeCaps from '../index/niftylargecap.json';

export const useSandboxWS = ({ request }) => {
    const dispatch = useDispatch();
    const portfolio = useSelector((state) => state.portfolio);
    const stats = useSelector((state) => state.orders.stats);
    const statsRef = useRef(stats);

    // Combine scripts to create a map (Limit to top 10 for Sandbox)
    const scripts = [...niftymidsmall400float, ...niftylargeCaps].slice(0, 10);
    const scriptMap = scripts.reduce((acc, script) => {
        acc[script.instrument_key] = script;
        return acc;
    }, {});

    // Store current simulated prices
    const currentPricesRef = useRef({});

    // Keep statsRef updated
    useEffect(() => {
        statsRef.current = stats;
    }, [stats]);

    useEffect(() => {
        if (!request) return; // Disable if request is null

        console.log("useSandboxWS: Starting Sandbox Feed...");

        // Initialize prices if empty or if stats are now available
        if (Object.keys(currentPricesRef.current).length === 0 || (stats && Object.keys(stats).length > 0 && Object.keys(currentPricesRef.current).every(k => currentPricesRef.current[k] === 100))) {
            scripts.forEach(script => {
                const instrumentKey = script.instrument_key;
                let initialPrice = 100;

                // Priority 1: Use lastPrice from stats (Previous Day Close / LTP)
                if (stats && stats[instrumentKey] && stats[instrumentKey].lastPrice) {
                    initialPrice = stats[instrumentKey].lastPrice;
                }
                // Priority 2: Use last_price from JSON
                else if (script.last_price) {
                    initialPrice = script.last_price;
                }

                currentPricesRef.current[instrumentKey] = initialPrice;
            });
        }

        const intervalId = setInterval(async () => {
            // Generate Mock Data
            const response = generateMockFeed(currentPricesRef.current, scriptMap);

            // Emit event for TradingView datafeed (if it listens to this event)
            socketEventEmitter.emit('market-data', response);

            // Calculate Metrics
            const {
                metrics, bullishMB, bearishMB,
                bullishSLTB, bearishSLTB, bullishAnts,
                dollar, bearishDollar,
            } = await updateWatchlistWithMetrics(response, scriptMap, portfolio, statsRef.current);

            // Dispatch to Redux
            dispatch(setOrderMetrics(metrics));
            dispatch(setBullishMB(bullishMB));
            dispatch(setBearishMB(bearishMB));
            dispatch(setBullishSLTB(bullishSLTB));
            dispatch(setBearishSLTB(bearishSLTB));
            dispatch(setBullishAnts(bullishAnts));
            dispatch(setDollarBo(dollar));
            dispatch(setBearishDollarBo(bearishDollar));

        }, 1000); // 1 second interval

        return () => {
            console.log("useSandboxWS: Stopping Sandbox Feed...");
            clearInterval(intervalId);
        };
    }, [stats]); // Re-run when stats change (to initialize prices)

    return { isConnected: true };
};
