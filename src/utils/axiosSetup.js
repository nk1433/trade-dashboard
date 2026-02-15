import axios from 'axios';
import { logoutUser } from '../Store/authSlice';

export const setupAxiosInterceptors = (store) => {
    // Response interceptor
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // Check if error is 401 Unauthorized
            if (error.response && error.response.status === 401) {
                const { dispatch } = store;

                // Prevent infinite loop if logout api itself fails (though logout usually isn't an API call in this app)
                // Filter out specific URLs if needed, e.g., Upstox APIs might be handled differently
                // For now, global logout on app backend 401
                const isUpstoxApi = error.config.url.includes('upstox.com');

                if (!isUpstoxApi) {
                    console.warn('Session expired (401). Logging out...');
                    dispatch(logoutUser());
                }
            }
            return Promise.reject(error);
        }
    );
};
