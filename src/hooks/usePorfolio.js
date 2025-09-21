import { useEffect, useState } from "react";

export function usePortfolioDataSocket({ porfolioWsUrl }) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let ws;
        const start = async () => {
            ws = new WebSocket(porfolioWsUrl);

            ws.onopen = () => {
                setIsConnected(true);
            };

            ws.onclose = () => {
                setIsConnected(false);
            };

            ws.onmessage = async (event) => {
                console.log('event from porfolio socket', event)
            };

            ws.onerror = () => {
                setIsConnected(false);
            };
        };

        if (porfolioWsUrl) start();

        return () => {
            if (ws) ws.close();
        };
    }, [porfolioWsUrl]);

    return { isConnected };
};
