const getBackendUrl = () => {
    // Use VITE_DEV_HOST when env is not prod or equals to dev
    const envHosts = {
        DEV: import.meta.env.VITE_DEV_HOST,
        PROD: import.meta.env.VITE_PROD_HOST
    };

    return envHosts[import.meta.env.VITE_ENV || 'DEV'];
};

export const BACKEND_URL = getBackendUrl();
