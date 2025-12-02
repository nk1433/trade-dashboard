import { useEffect, useState } from "react";

export function useMarketFeedUrl(token) {
    const [wsUrl, setWsUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setWsUrl(null);
            return;
        }
        setLoading(true);
        setError(null);

        const fetchUrl = async () => {
            try {
                const url = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
                const headers = {
                    "Content-type": "application/json",
                    Authorization: "Bearer " + token,
                };
                const response = await fetch(url, {
                    method: "GET",
                    headers: headers,
                });
                if (!response.ok) throw new Error("Network response was not ok");
                const res = await response.json();
                setWsUrl(res.data.authorizedRedirectUri);
            } catch (err) {
                setError(err);
                setWsUrl(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();
    }, [token]);

    return { wsUrl, loading, error };
}
