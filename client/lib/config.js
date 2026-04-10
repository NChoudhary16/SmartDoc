/** Backend origin (no trailing slash). Override with NEXT_PUBLIC_API_ORIGIN in .env.local */
export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:5000'
).replace(/\/$/, '');

export const API_URL = `${API_ORIGIN}/api`;
