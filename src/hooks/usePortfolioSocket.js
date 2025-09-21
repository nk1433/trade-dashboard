import { useEffect, useState } from "react";

export function usePortfolioSocket(token) {
    const [porfolioWsUrl, setPorfolioWsUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        setError(null);

        const fetchUrl = async () => {
            try {
                const baseUrl = 'https://api.upstox.com/v2/feed/portfolio-stream-feed/authorize';
                // const updateTypes = 'order,gtt_orders,position,holding';
                const params = new URLSearchParams({
                    // update_types: updateTypes
                });
                const url = `${baseUrl}?${params.toString()}`
                const headers = {
                    "Content-type": "application/json",
                    "Accept": "application/json",
                    Authorization: "Bearer " + token,
                };
                const response = await fetch(url, {
                    method: "GET",
                    headers: headers,
                });
                if (!response.ok) throw new Error("Network response was not ok");
                const res = await response.json();
                setPorfolioWsUrl(res.data.authorizedRedirectUri);
            } catch (err) {
                setError(err);
                setPorfolioWsUrl(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();
    }, [token]);

    return { porfolioWsUrl, loading, error };
}
