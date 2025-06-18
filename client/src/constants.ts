// For Vite (browser) environment
const viteBaseUrl = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined;

// Fallback to local development server
export const apiBaseUrl: string = viteBaseUrl || (import.meta.env.DEV ? 'http://localhost:3001/api' : '');
