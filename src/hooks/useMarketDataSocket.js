import { useEffect, useState, useRef } from "react";
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
        try {
            const protoUrl = `${import.meta.env.BASE_URL}MarketDataFeedV3.proto`;
            console.log("useMarketDataSocket: Loading proto from", protoUrl);
            protobufRoot = await protobuf.load(protoUrl);
            console.log("useMarketDataSocket: Protobuf loaded successfully");
        } catch (error) {
            console.error("useMarketDataSocket: Failed to load protobuf", error);
            throw error;
        }
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



export function useMarketDataSocket({ wsUrl, request }) {
    const [isConnected, setIsConnected] = useState(false);
    const { token } = useSelector((state) => state.auth); // Upstox Token
    const portfolio = useSelector((state) => state.portfolio);
    const stats = useSelector((state) => state.orders.stats);
    const statsRef = useRef(stats);
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



    useEffect(() => {
        let ws;
        let isMounted = true;
        console.log("useMarketDataSocket: Effect triggered", { wsUrl, request });

        const start = async () => {
            console.log("useMarketDataSocket: Starting connection...");
            await initProtobuf();
            if (!isMounted) {
                console.log("useMarketDataSocket: Component unmounted before initProtobuf finished");
                return;
            }

            console.log("useMarketDataSocket: Connecting to", wsUrl);
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("useMarketDataSocket: Connected");
                if (isMounted) setIsConnected(true);
                const enc = new TextEncoder();
                ws.send(enc.encode(JSON.stringify(request)));
            };

            ws.onclose = () => {
                console.log("useMarketDataSocket: Disconnected");
                if (isMounted) setIsConnected(false);
            };

            ws.onmessage = async (event) => {
                const arrayBuffer = await blobToArrayBuffer(event.data);
                let buffer = new Uint8Array(arrayBuffer);
                let response = decodeProfobuf(buffer);

                if (response.type === 1) {
                    // Emit event for TradingView datafeed
                    socketEventEmitter.emit('market-data', response);



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

        if (wsUrl && request) {
            start();
        } else {
            console.log("useMarketDataSocket: Missing wsUrl or request", { wsUrl, request });
        }

        return () => {
            console.log("useMarketDataSocket: Cleaning up");
            isMounted = false;
            if (ws) ws.close();
        };
    }, [wsUrl, JSON.stringify(request)]);

    return { isConnected };
};
