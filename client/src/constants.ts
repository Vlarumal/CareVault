// For Vite (browser) environment
const viteBaseUrl = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined;

// Fallback to local development server
export const apiBaseUrl: string = viteBaseUrl || (import.meta.env.DEV ? 'http://localhost:3001/api' : '');

// Session management constants
export const SESSION_WARNING_DURATION = 300; // 5 minutes in seconds
export const SESSION_CHECK_INTERVAL = 1000; // 1 second
export const SESSION_EXPIRATION_BUFFER = 60; // 1 minute buffer
