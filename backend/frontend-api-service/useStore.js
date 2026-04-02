/**
 * useStore.js  —  API-backed Zustand store
 *
 * Replace  src/store/useStore.js  in the Vite project with this file.
 * Requires  src/utils/api.js  (provided separately).
 *
 * Each slice loads data from the backend on first mount and keeps a
 * local copy for fast UI rendering. All mutations go through the API
 * and update local state on success.
 */
import { create } from 'zustand';
import { drivers as driversApi, vehicles as vehiclesApi, soilTypes as soilTypesApi,
         trips as tripsApi, diesel as dieselApi } from '../utils/api';

export const useStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  drivers:   [],
  vehicles:  [],
  soilTypes: [],
  trips:     [],
  diesel:    [],
  loading:   false,
  error:     null,

  // ── Bootstrap — call once in App.jsx or a top-level useEffect ────────────
  init: async () => {
    set({ loading: true, error: null });
    try {
      const [drivers, vehicles, soilTypes, trips, diesel] = await Promise.all([
        driversApi.getAll(),
        vehiclesApi.getAll(),
        soilTypesApi.getAll(),
        tripsApi.getAll(),
        dieselApi.getAll(),
      ]);
      set({ drivers, vehicles, soilTypes, trips, diesel, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // ── Drivers ───────────────────────────────────────────────────────────────
  addDriver: async (data) => {
    const driver = await driversApi.create(data);
    set(s => ({ drivers: [driver, ...s.drivers] }));
    return driver;
  },
  updateDriver: async (id, data) => {
    const updated = await driversApi.update(id, data);
    set(s => ({ drivers: s.drivers.map(d => d._id === id ? updated : d) }));
    return updated;
  },
  deleteDriver: async (id) => {
    await driversApi.remove(id);
    set(s => ({ drivers: s.drivers.filter(d => d._id !== id) }));
  },

  // ── Vehicles ──────────────────────────────────────────────────────────────
  addVehicle: async (data) => {
    const vehicle = await vehiclesApi.create(data);
    set(s => ({ vehicles: [vehicle, ...s.vehicles] }));
    return vehicle;
  },
  updateVehicle: async (id, data) => {
    const updated = await vehiclesApi.update(id, data);
    set(s => ({ vehicles: s.vehicles.map(v => v._id === id ? updated : v) }));
    return updated;
  },
  deleteVehicle: async (id) => {
    await vehiclesApi.remove(id);
    set(s => ({ vehicles: s.vehicles.filter(v => v._id !== id) }));
  },

  // ── Soil Types ────────────────────────────────────────────────────────────
  updateSoilType: async (id, data) => {
    const updated = await soilTypesApi.update(id, data);
    set(s => ({ soilTypes: s.soilTypes.map(st => st._id === id ? updated : st) }));
    return updated;
  },
  addSoilType: async (data) => {
    const soil = await soilTypesApi.create(data);
    set(s => ({ soilTypes: [...s.soilTypes, soil] }));
    return soil;
  },
  deleteSoilType: async (id) => {
    await soilTypesApi.remove(id);
    set(s => ({ soilTypes: s.soilTypes.filter(st => st._id !== id) }));
  },

  // ── Trips ─────────────────────────────────────────────────────────────────
  addTrip: async (data) => {
    const trip = await tripsApi.create(data);
    set(s => ({ trips: [trip, ...s.trips] }));
    return trip;
  },
  updateTrip: async (id, data) => {
    const updated = await tripsApi.update(id, data);
    set(s => ({ trips: s.trips.map(t => t._id === id ? updated : t) }));
    return updated;
  },
  deleteTrip: async (id) => {
    await tripsApi.remove(id);
    set(s => ({ trips: s.trips.filter(t => t._id !== id) }));
  },

  // ── Diesel ────────────────────────────────────────────────────────────────
  addDiesel: async (data) => {
    const entry = await dieselApi.create(data);
    set(s => ({ diesel: [entry, ...s.diesel] }));
    return entry;
  },
  updateDiesel: async (id, data) => {
    const updated = await dieselApi.update(id, data);
    set(s => ({ diesel: s.diesel.map(d => d._id === id ? updated : d) }));
    return updated;
  },
  deleteDiesel: async (id) => {
    await dieselApi.remove(id);
    set(s => ({ diesel: s.diesel.filter(d => d._id !== id) }));
  },
}));
