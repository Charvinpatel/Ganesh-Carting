import { create } from 'zustand';
import api, { setToken, clearToken } from '../utils/api';
import toast from 'react-hot-toast';

// --- Mappers block to convert backend _id and populated refs to frontend naming ---
const mapId = (item) => ({ ...item, id: item._id });

const mapVehicle = (v) => ({
  ...v,
  id: v._id,
  assignedDriver: typeof v.assignedDriver === 'object' && v.assignedDriver ? v.assignedDriver._id : v.assignedDriver
});

const mapTrip = (t) => ({
  ...t,
  id: t._id,
  driverId: typeof t.driver === 'object' && t.driver ? t.driver._id : t.driver,
  vehicleId: typeof t.vehicle === 'object' && t.vehicle ? t.vehicle._id : t.vehicle,
  soilTypeId: typeof t.soilType === 'object' && t.soilType ? t.soilType._id : t.soilType,
});

const mapDiesel = (d) => ({
  ...d,
  id: d._id,
  driverId: typeof d.driver === 'object' && d.driver ? d.driver._id : d.driver,
  vehicleId: typeof d.vehicle === 'object' && d.vehicle ? d.vehicle._id : d.vehicle,
});

const mapDriverTrip = (t) => ({
  ...t,
  id: t._id,
  driverId: typeof t.driver === 'object' && t.driver ? t.driver._id : t.driver,
  vehicleId: typeof t.vehicle === 'object' && t.vehicle ? t.vehicle._id : t.vehicle,
  soilTypeId: typeof t.soilType === 'object' && t.soilType ? t.soilType._id : t.soilType,
});


export const useStore = create((set, get) => ({
  // State
  isAuthenticated: false,
  user: null,
  drivers:   [],
  vehicles:  [],
  soilTypes: [],
  trips:     [],
  diesel:    [],
  driverTrips: [],
  upad:      [],
  locations: [],
  loading:   true,  // app initialization loading
  contentLoading: false, // page content loading
  error:     null,
  hasInitialized: false,

  // --- Auth 
  checkAuth: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.auth.me();
      set({ isAuthenticated: true, user: res.user, loading: false });
      get().init(); // Background fetch
    } catch (err) {
      clearToken();
      set({ isAuthenticated: false, user: null, loading: false });
    }
  },
  login: async (email, password) => {
    try {
      const res = await api.auth.login(email, password);
      setToken(res.token);
      set({ isAuthenticated: true, user: res.user, error: null });
      await get().init(); // Fetch details after log in
      return res;
    } catch (err) {
      throw err;
    }
  },
  register: async (data) => {
    try {
      const res = await api.auth.register(data);
      setToken(res.token);
      set({ isAuthenticated: true, user: res.user, error: null });
      await get().init(); // Fetch details after log in
      return res;
    } catch (err) {
      throw err;
    }
  },
  logout: () => {
    clearToken();
    set({ 
      isAuthenticated: false, user: null, 
      drivers: [], vehicles: [], soilTypes: [], trips: [], diesel: [], driverTrips: [], upad: [], locations: []
    });
  },

  init: async () => {
    if (get().hasInitialized) return;
    get().refreshData(); // Don't await here to keep initial frame interactive
    set({ hasInitialized: true });
  },

  refreshData: async () => {
    set({ contentLoading: true, error: null });
    try {
      const { user } = get();
      const isDriver = user?.role === 'driver';
      const upadFilters = isDriver && user.driverProfile ? { driverId: user.driverProfile } : {};
      
      const [drvs, vehs, soils, trps, dies, dt, ups, locs] = await Promise.all([
        api.drivers.getAll({ limit: 50 }), 
        api.vehicles.getAll({ limit: 50 }),
        api.soilTypes.getAll(),
        api.trips.getAll({ limit: 20 }), 
        api.diesel.getAll({ limit: 20 }),
        api.driverTrips.getAll(),
        api.upad.getAll(upadFilters),
        api.locations.getAll({ limit: 50 }),
      ]);
      set({
        drivers: (drvs.data || drvs).map(mapId),
        vehicles: (vehs.data || vehs).map(mapVehicle),
        soilTypes: soils.map(mapId),
        trips: (trps.data || trps).map(mapId),
        diesel: (dies.data || dies).map(mapDiesel),
        driverTrips: (dt || []).map(mapDriverTrip),
        upad: (ups.data || ups).map(mapId),
        locations: (locs.data || locs).map(mapId),
        contentLoading: false
      });
    } catch (err) {
      set({ error: err.message, contentLoading: false });
      throw err;
    }
  },

  // --- Drivers
  addDriver: async (driver) => {
    try {
      const res = await api.drivers.create(driver);
      set(s => ({ drivers: [mapId(res), ...s.drivers] }));
      return res;
    } catch (error) {
      toast.error(`Error adding driver: ${error.message}`);
      throw error;
    }
  },
  updateDriver: async (id, data) => {
    try {
      const res = await api.drivers.update(id, data);
      set(s => ({ drivers: s.drivers.map(d => d.id === id ? mapId(res) : d) }));
      return res;
    } catch (error) {
      toast.error(`Error updating driver: ${error.message}`);
      throw error;
    }
  },
  deleteDriver: async (id) => {
    try {
      await api.drivers.remove(id);
      set(s => ({ drivers: s.drivers.filter(d => d.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting driver: ${error.message}`);
      throw error;
    }
  },

  // --- Vehicles
  addVehicle: async (v) => {
    try {
      const res = await api.vehicles.create(v);
      set(s => ({ vehicles: [mapVehicle(res), ...s.vehicles] }));
      return res;
    } catch (error) {
      toast.error(`Error adding vehicle: ${error.message}`);
      throw error;
    }
  },
  updateVehicle: async (id, data) => {
    try {
      const res = await api.vehicles.update(id, data);
      set(s => ({ vehicles: s.vehicles.map(v => v.id === id ? mapVehicle(res) : v) }));
      return res;
    } catch (error) {
      toast.error(`Error updating vehicle: ${error.message}`);
      throw error;
    }
  },
  deleteVehicle: async (id) => {
    try {
      await api.vehicles.remove(id);
      set(s => ({ vehicles: s.vehicles.filter(v => v.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting vehicle: ${error.message}`);
      throw error;
    }
  },

  // --- Soil Types
  addSoilType: async (data) => {
    try {
      const res = await api.soilTypes.create(data);
      set(s => ({ soilTypes: [mapId(res), ...s.soilTypes] }));
      return res;
    } catch (error) {
      toast.error(`Error adding soil type: ${error.message}`);
      throw error;
    }
  },
  updateSoilType: async (id, data) => {
    try {
      const res = await api.soilTypes.update(id, data);
      set(s => ({ soilTypes: s.soilTypes.map(st => st.id === id ? mapId(res) : st) }));
      return res;
    } catch (error) {
      toast.error(`Error updating soil type: ${error.message}`);
      throw error;
    }
  },
  deleteSoilType: async (id) => {
    try {
      await api.soilTypes.remove(id);
      set(s => ({ soilTypes: s.soilTypes.filter(st => st.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting soil type: ${error.message}`);
      throw error;
    }
  },

  // --- Trips
  addTrip: async (trip) => {
    try {
      const payload = { ...trip, driver: trip.driverId, vehicle: trip.vehicleId, soilType: trip.soilTypeId };
      const res = await api.trips.create(payload);
      set(s => ({ trips: [mapTrip(res), ...s.trips] }));
      return res;
    } catch (error) {
      toast.error(`Error adding trip: ${error.message}`);
      throw error;
    }
  },
  updateTrip: async (id, data) => {
    try {
      const payload = { ...data, driver: data.driverId || data.driver, vehicle: data.vehicleId || data.vehicle, soilType: data.soilTypeId || data.soilType };
      const res = await api.trips.update(id, payload);
      set(s => ({ trips: s.trips.map(t => t.id === id ? mapTrip(res) : t) }));
      return res;
    } catch (error) {
      toast.error(`Error updating trip: ${error.message}`);
      throw error;
    }
  },
  fetchTrips: async (filters = {}) => {
    try {
      set({ contentLoading: true });
      const res = await api.trips.getAll(filters);
      set({ 
        trips: (res.data || res || []).map(mapTrip),
        contentLoading: false 
      });
    } catch (error) {
      set({ contentLoading: false });
      toast.error(`Error fetching trips: ${error.message}`);
    }
  },
  deleteTrip: async (id) => {
    try {
      await api.trips.remove(id);
      set(s => ({ trips: s.trips.filter(t => t.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting trip: ${error.message}`);
      throw error;
    }
  },

  // --- Diesel
  addDiesel: async (entry) => {
    try {
      const payload = { ...entry, driver: entry.driverId, vehicle: entry.vehicleId };
      const res = await api.diesel.create(payload);
      set(s => ({ diesel: [mapDiesel(res), ...s.diesel] }));
      return res;
    } catch (error) {
      toast.error(`Error adding diesel entry: ${error.message}`);
      throw error;
    }
  },
  updateDiesel: async (id, data) => {
    try {
      const payload = { ...data, driver: data.driverId || data.driver, vehicle: data.vehicleId || data.vehicle };
      const res = await api.diesel.update(id, payload);
      set(s => ({ diesel: s.diesel.map(d => d.id === id ? mapDiesel(res) : d) }));
      return res;
    } catch (error) {
      toast.error(`Error updating diesel entry: ${error.message}`);
      throw error;
    }
  },
  fetchDiesel: async (filters = {}) => {
    try {
      set({ contentLoading: true });
      const res = await api.diesel.getAll(filters);
      set({ 
        diesel: (res.data || res || []).map(mapDiesel),
        contentLoading: false 
      });
    } catch (error) {
      set({ contentLoading: false });
      toast.error(`Error fetching diesel: ${error.message}`);
    }
  },
  deleteDiesel: async (id) => {
    try {
      await api.diesel.remove(id);
      set(s => ({ diesel: s.diesel.filter(d => d.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting diesel entry: ${error.message}`);
      throw error;
    }
  },

  // --- Driver Trips
  addDriverTrip: async (trip) => {
    try {
      const payload = { ...trip, driver: trip.driverId, vehicle: trip.vehicleId, soilType: trip.soilTypeId };
      const res = await api.driverTrips.create(payload);
      set(s => ({ driverTrips: [mapDriverTrip(res), ...s.driverTrips] }));
      return res;
    } catch (error) {
      toast.error(`Error adding driver trip: ${error.message}`);
      throw error;
    }
  },
  verifyDriverTrip: async (id, data) => {
    try {
      const res = await api.driverTrips.verify(id, data);
      set(s => ({ driverTrips: s.driverTrips.map(dt => dt.id === id ? mapDriverTrip(res) : dt) }));
      
      // If verified, refresh system trips to reflect the verification
      const updatedTrips = await api.trips.getAll();
      set({ trips: (updatedTrips.data || updatedTrips).map(mapTrip) });
      
      return res;
    } catch (error) {
      toast.error(`Error verifying trip: ${error.message}`);
      throw error;
    }
  },
  fetchDriverTrips: async (filters = {}) => {
    try {
      set({ contentLoading: true });
      const res = await api.driverTrips.getAll(filters);
      set({ 
        driverTrips: (res || []).map(mapDriverTrip),
        contentLoading: false 
      });
    } catch (error) {
      set({ contentLoading: false });
      toast.error(`Error fetching driver trips: ${error.message}`);
    }
  },
  deleteDriverTrip: async (id) => {
    try {
      await api.driverTrips.remove(id);
      set(s => ({ driverTrips: s.driverTrips.filter(dt => dt.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting driver trip: ${error.message}`);
      throw error;
    }
  },

  // --- Upad
  addUpad: async (data) => {
    try {
      const res = await api.upad.create(data);
      set(s => ({ upad: [mapId(res), ...s.upad] }));
      return res;
    } catch (error) {
      toast.error(`Error adding advance: ${error.message}`);
      throw error;
    }
  },
  deleteUpad: async (id) => {
    try {
      await api.upad.remove(id);
      set(s => ({ upad: s.upad.filter(u => u.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting advance: ${error.message}`);
      throw error;
    }
  },

  // --- Locations
  addLocation: async (data) => {
    try {
      const res = await api.locations.create(data);
      set(s => ({ locations: [mapId(res), ...s.locations] }));
      return res;
    } catch (error) {
      toast.error(`Error adding location: ${error.message}`);
      throw error;
    }
  },
  deleteLocation: async (id) => {
    try {
      await api.locations.remove(id);
      set(s => ({ locations: s.locations.filter(l => l.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting location: ${error.message}`);
      throw error;
    }
  },
}));
