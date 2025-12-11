export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3015';

// Flag to toggle between Live Upstox WebSocket and Sandbox Simulated Feed
// Set to false to use the Sandbox Feed (Simulated Data)
// Set to true to use the Live Upstox WebSocket
export const isUpstoxsWs = import.meta.env.VITE_IS_SANDBOX === 'false'; 
