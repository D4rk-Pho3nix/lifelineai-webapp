/**
 * DATA SOURCE CONFIGURATION
 * ─────────────────────────────────────────────
 * Toggle this flag to switch between mock and live data.
 *
 * MOCK MODE  (USE_MOCK_DATA = true):
 *   → All data comes from src/data/mockData.js
 *   → Safe for development and UI testing
 *   → No Supabase connection required
 *
 * LIVE MODE  (USE_MOCK_DATA = false):
 *   → All data comes from Supabase query hooks
 *   → mockData.js is completely bypassed
 *   → DELETE mockData.js after confirming live data works
 * ─────────────────────────────────────────────
 * ⚠️  BEFORE GOING LIVE:
 *   Step 1: Set USE_MOCK_DATA = false
 *   Step 2: Verify all pages load correctly from Supabase
 *   Step 3: DELETE src/data/mockData.js entirely
 *   Step 4: DELETE this config file (dataConfig.js)
 *   Step 5: Remove all mock data imports from page files
 * ─────────────────────────────────────────────
 */

export const USE_MOCK_DATA = false;   // ← CHANGE TO false WHEN SUPABASE IS READY
