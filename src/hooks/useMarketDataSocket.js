import { useEffect, useState } from "react";
import { Buffer } from "buffer";
import protobuf from "protobufjs";
import { useDispatch } from "react-redux";
import { setLiveFeed } from "../Store/upstoxs";

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

export function useMarketDataSocket({ wsUrl, request }) {
    const [isConnected, setIsConnected] = useState(false);
    const [feedData, setFeedData] = useState([]);
    const dispatch = useDispatch();

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
                setFeedData((currentData) => [...currentData, response]);
                dispatch(setLiveFeed(response));
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

    return { isConnected, feedData };
};
