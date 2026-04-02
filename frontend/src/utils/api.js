/**
 * api.js  —  TransportPro frontend ↔ backend service
 *
 * Each function mirrors the zustand store actions.
 *
 * Usage:
 *   import api from './utils/api';
 *   const drivers = await api.drivers.getAll();
 */

const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://ganesh-carting.onrender.com/api' : 'http://localhost:5000/api');

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken  = () => localStorage.getItem('tms_token');
export const setToken  = (t) => localStorage.setItem('tms_token', t);
export const clearToken = () => localStorage.removeItem('tms_token');

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const get    = (path)         => request('GET',    path);
const post   = (path, body)   => request('POST',   path, body);
const put    = (path, body)   => request('PUT',    path, body);
const del    = (path)         => request('DELETE', path);
const patch  = (path, body)   => request('PATCH',  path, body);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login:          (email, password) => post('/auth/login',    { email, password }),
  register:       (data)            => post('/auth/register', data),
  me:             ()                => get('/auth/me'),
  changePassword: (data)            => patch('/auth/change-password', data),
};

// ── Drivers ───────────────────────────────────────────────────────────────────
export const drivers = {
  getAll:  ()         => get('/drivers'),
  getOne:  (id)       => get(`/drivers/${id}`),
  create:  (data)     => post('/drivers', data),
  update:  (id, data) => put(`/drivers/${id}`, data),
  remove:  (id)       => del(`/drivers/${id}`),
};

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const vehicles = {
  getAll:  ()         => get('/vehicles'),
  getOne:  (id)       => get(`/vehicles/${id}`),
  create:  (data)     => post('/vehicles', data),
  update:  (id, data) => put(`/vehicles/${id}`, data),
  remove:  (id)       => del(`/vehicles/${id}`),
};

// ── Soil Types ────────────────────────────────────────────────────────────────
export const soilTypes = {
  getAll:  ()         => get('/soil-types'),
  create:  (data)     => post('/soil-types', data),
  update:  (id, data) => put(`/soil-types/${id}`, data),
  remove:  (id)       => del(`/soil-types/${id}`),
};

// ── Trips ─────────────────────────────────────────────────────────────────────
// filters: { date, vehicleId, driverId, soilTypeId, from, to }
export const trips = {
  getAll:  (filters = {}) => get('/trips?' + new URLSearchParams(filters)),
  getOne:  (id)           => get(`/trips/${id}`),
  create:  (data)         => post('/trips', data),
  update:  (id, data)     => put(`/trips/${id}`, data),
  remove:  (id)           => del(`/trips/${id}`),
};

// ── Diesel ────────────────────────────────────────────────────────────────────
// filters: { date, vehicleId, from, to }
export const diesel = {
  getAll:  (filters = {}) => get('/diesel?' + new URLSearchParams(filters)),
  getOne:  (id)           => get(`/diesel/${id}`),
  create:  (data)         => post('/diesel', data),
  update:  (id, data)     => put(`/diesel/${id}`, data),
  remove:  (id)           => del(`/diesel/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboard = {
  get: () => get('/dashboard'),
};

// ── Finance ───────────────────────────────────────────────────────────────────
// days: 7 | 30 | 90
export const finance = {
  summary: (days = 30) => get(`/finance/summary?days=${days}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reports = {
  daily:   (date)         => get(`/reports/daily?date=${date}`),
  driver:  (from, to)     => get(`/reports/driver?from=${from}&to=${to}`),
  vehicle: (from, to)     => get(`/reports/vehicle?from=${from}&to=${to}`),
  summary: (from, to)     => get(`/reports/summary?from=${from}&to=${to}`),
};

// ── Driver Trips ──────────────────────────────────────────────────────────────
export const driverTrips = {
  getAll: (filters = {}) => get('/driver-trips?' + new URLSearchParams(filters)),
  create: (data) => post('/driver-trips', data),
  verify: (id, data) => put(`/driver-trips/${id}/verify`, data),
  remove: (id) => del(`/driver-trips/${id}`),
};

// ── Upad ─────────────────────────────────────────────────────────────────────
export const upad = {
  getAll: (filters = {}) => get('/upad?' + new URLSearchParams(filters)),
  create: (data) => post('/upad', data),
  remove: (id) => del(`/upad/${id}`),
};

// ── Locations ────────────────────────────────────────────────────────────────
export const locations = {
  getAll: (filters = {}) => get('/locations?' + new URLSearchParams(filters)),
  create: (data) => post('/locations', data),
  remove: (id) => del(`/locations/${id}`),
};


const api = { auth, drivers, vehicles, soilTypes, trips, diesel, dashboard, finance, reports, driverTrips, upad, locations };
export default api;
