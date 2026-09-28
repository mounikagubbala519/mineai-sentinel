/**
 * API Service Client for MineAI Sentinel Backend
 */
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  return '/api';
};

const PRIMARY_API_URL = getBaseUrl();
const FALLBACK_API_URL = 'http://localhost:8000/api';

async function fetchJson(endpoint, options = {}) {
  const urlsToTry = [PRIMARY_API_URL];
  
  // Only add localhost fallback if we are in local development mode
  if (import.meta.env.DEV && !PRIMARY_API_URL.includes('localhost')) {
    urlsToTry.push(FALLBACK_API_URL);
  }

  let lastError = null;

  for (const baseUrl of urlsToTry) {
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      if (response.ok) {
        return await response.json();
      }
      lastError = new Error(`API error ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
  }

  console.warn(`[MineAI Sentinel API] ${endpoint} request failed:`, lastError?.message);
  throw lastError || new Error(`Failed to fetch ${endpoint}`);
}


export const api = {
  getHealth: () => fetchJson('/health'),
  getDashboardSummary: () => fetchJson('/dashboard/summary'),
  getReserves: () => fetchJson('/reserves'),
  getReservesMap: () => fetchJson('/reserves/map'),
  predictReserve: (data) => fetchJson('/reserves/predict', { method: 'POST', body: JSON.stringify(data) }),
  getProductionHistory: () => fetchJson('/production/history'),
  getProductionForecast: () => fetchJson('/production/forecast'),
  predictForecast: (data) => fetchJson('/production/forecast', { method: 'POST', body: JSON.stringify(data) }),
  predictShortfall: (data) => fetchJson('/shortfall/predict', { method: 'POST', body: JSON.stringify(data) }),
  getEquipment: () => fetchJson('/equipment'),
  getEquipmentRisks: () => fetchJson('/equipment/risks'),
  getEnvironment: () => fetchJson('/environment'),
  getRisks: () => fetchJson('/risks'),
  getRecommendations: () => fetchJson('/recommendations'),
  simulateWhatIf: (data) => fetchJson('/what-if', { method: 'POST', body: JSON.stringify(data) }),
  getModelMetrics: () => fetchJson('/model/metrics'),
  getAlerts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/alerts${query ? `?${query}` : ''}`);
  },
  getActiveAlerts: () => fetchJson('/alerts/active'),
  getAlertHistory: () => fetchJson('/alerts/history'),
  getAlertById: (id) => fetchJson(`/alerts/${id}`),
  acknowledgeAlert: (id) => fetchJson(`/alerts/${id}/acknowledge`, { method: 'POST' }),
  resolveAlert: (id) => fetchJson(`/alerts/${id}/resolve`, { method: 'POST' }),
  getAlertConfig: () => fetchJson('/alerts/config'),
  updateAlertConfig: (data) => fetchJson('/alerts/config', { method: 'POST', body: JSON.stringify(data) }),
};
