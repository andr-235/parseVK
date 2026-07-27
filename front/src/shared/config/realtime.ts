/**
 * Feature flags for realtime event-driven contour.
 * Environment variables take precedence; defaults are development-friendly.
 */

export const REALTIME_ENABLED = import.meta.env.VITE_REALTIME_ENABLED === undefined
  ? true
  : import.meta.env.VITE_REALTIME_ENABLED === 'true' || import.meta.env.VITE_REALTIME_ENABLED === '1';
