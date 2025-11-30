const getBackendUrl = () => {
    // Use VITE_DEV_HOST when env is not prod or equals to dev
    if (!import.meta.env.PROD || import.meta.env.MODE === 'dev') {
        return import.meta.env.VITE_DEV_HOST || 'http://localhost:3015';
    }
    // For production, you might want another variable or default
    return import.meta.env.VITE_API_URL || '';
};

export const BACKEND_URL = getBackendUrl();
