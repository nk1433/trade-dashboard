import { useEffect, useState, useRef } from "react";
import { Buffer } from "buffer";
import protobuf from "protobufjs";
import { useDispatch } from "react-redux";
import { updateWatchlistWithMetrics } from "./useUpstoxWS";
import niftymidsmall400float from "../index/niftymidsmall400-float.json";
import niftylargeCaps from '../index/niftylargecap.json';
import { useSelector } from "react-redux";
import {
    setOrderMetrics, setBearishMB, setBullishMB,
    setBullishSLTB, setBearishSLTB,
    setBullishAnts,
    setDollarBo,
    setBearishDollarBo,
} from "../Store/upstoxs";
import socketEventEmitter from "../utils/socketEventEmitter";

let protobufRoot = null;
const initProtobuf = async () => {
    if (!protobufRoot) {
        protobufRoot = await protobuf.load("/MarketDataFeedV3.proto");
    }
};

const blobToArrayBuffer = async (blob) => {
    if ("arrayBuffer" in blob) return await blob.arrayBuffer();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject();
        reader.readAsArrayBuffer(blob);
    });
};

const decodeProfobuf = (buffer) => {
    if (!protobufRoot) return null;
    const FeedResponse = protobufRoot.lookupType(
        "com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse"
    );
    return FeedResponse.decode(buffer);
};

import axios from "axios";
import { BACKEND_URL } from "../utils/config";
import { evaluateScan } from "../utils/scanEngine";

export function useMarketDataSocket({ wsUrl, request }) {
    const [isConnected, setIsConnected] = useState(false);
    const [scanCriteria, setScanCriteria] = useState([]);
    const portfolio = useSelector((state) => state.portfolio);
    const { token } = useSelector((state) => state.auth); // Upstox Token
    const appToken = localStorage.getItem('token'); // App Token
    const stats = useSelector((state) => state.orders.stats);
    const statsRef = useRef(stats);
    const scanCriteriaRef = useRef([]);
    const dispatch = useDispatch();
    const scripts = [...niftymidsmall400float, ...niftylargeCaps];
    const scriptMap = scripts.reduce((acc, script) => {
        acc[script.instrument_key] = script;

        return acc;
    }, {});

    // Keep statsRef updated
    useEffect(() => {
        statsRef.current = stats;
    }, [stats]);

    // Fetch scan criteria
    useEffect(() => {
        const fetchCriteria = async () => {
            if (!appToken) return;
            try {
                const response = await axios.get(`${BACKEND_URL}/scans/criteria`, {
                    headers: { Authorization: `Bearer ${appToken}` }
                });
                if (response.data.success) {
                    setScanCriteria(response.data.data);
                    scanCriteriaRef.current = response.data.data;
                }
            } catch (error) {
                console.error("Error fetching scan criteria:", error);
            }
        };
        fetchCriteria();
    }, [appToken]);

    useEffect(() => {
        let ws;
        const start = async () => {
            await initProtobuf();
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setIsConnected(true);
                ws.send(Buffer.from(JSON.stringify(request)));
            };

            ws.onclose = () => {
                setIsConnected(false);
            };

            ws.onmessage = async (event) => {
                const arrayBuffer = await blobToArrayBuffer(event.data);
                let buffer = Buffer.from(arrayBuffer);
                let response = decodeProfobuf(buffer);

                if (response.type === 1) {
                    // Emit event for TradingView datafeed
                    socketEventEmitter.emit('market-data', response);

                    // Evaluate Dynamic Scans
                    if (response.feeds) {
                        Object.entries(response.feeds).forEach(([symbol, feed]) => {
                            const ohlc = feed?.fullFeed?.marketFF?.marketOHLC?.ohlc?.find(x => x.interval === "1d");
                            if (ohlc) {
                                scanCriteriaRef.current.forEach(criteria => {
                                    if (evaluateScan(criteria.criteria, ohlc)) {
                                        console.log(`[SCAN HIT] ${criteria.name} triggered for ${symbol}`, ohlc);
                                        // Potential TODO: Dispatch action to update UI with scan hits
                                    }
                                });
                            }
                        });
                    }

                    const {
                        metrics, bullishMB, bearishMB,
                        bullishSLTB, bearishSLTB, bullishAnts,
                        dollar, bearishDollar,
                    } = await updateWatchlistWithMetrics(response, scriptMap, portfolio, statsRef.current);

                    dispatch(setOrderMetrics(metrics));
                    dispatch(setBullishMB(bullishMB));
                    dispatch(setBearishMB(bearishMB));
                    dispatch(setBullishSLTB(bullishSLTB));
                    dispatch(setBearishSLTB(bearishSLTB));
                    dispatch(setBullishAnts(bullishAnts));
                    dispatch(setDollarBo(dollar));
                    dispatch(setBearishDollarBo(bearishDollar));
                }
            };

            ws.onerror = () => {
                setIsConnected(false);
            };
        };

        if (wsUrl && request) start();

        return () => {
            if (ws) ws.close();
        };
    }, [wsUrl, JSON.stringify(request)]);

    return { isConnected };
};
