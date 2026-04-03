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
  vendorId: typeof t.vendor === 'object' && t.vendor ? t.vendor._id : t.vendor,
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
  driverId:   t.driver   && typeof t.driver   === 'object' ? t.driver._id   : t.driver,
  vehicleId:  t.vehicle  && typeof t.vehicle  === 'object' ? t.vehicle._id  : t.vehicle,
  soilTypeId: t.soilType && typeof t.soilType === 'object' ? t.soilType._id : t.soilType,
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
  vendors:   [],
  bills:     [],
  driverTrips: [],
  upad:      [],
  locations: [],
  loading:   true,  // app initialization loading
  contentLoading: false, // page content loading
  error:     null,
  tripsSummary: { revenue: 0, profit: 0, trips: 0 },
  hasInitialized: false,

  // Pagination Metadata
  tripsMeta:    { total: 0, page: 1, totalPages: 1 },
  driversMeta:  { total: 0, page: 1, totalPages: 1 },
  vehiclesMeta: { total: 0, page: 1, totalPages: 1 },
  dieselMeta:   { total: 0, page: 1, totalPages: 1 },
  locationsMeta: { total: 0, page: 1, totalPages: 1 },

  // --- Auth 
  checkAuth: async () => {
    const token = localStorage.getItem('tms_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, loading: false });
      return;
    }

    try {
      set({ loading: true, error: null });
      const res = await api.auth.me();
      set({ isAuthenticated: true, user: res.user, loading: false });
      get().init(); // Run background initialization
    } catch (err) {
      // Only logout on authentic 401/403 errors.
      // Other errors (like 502 server waking up) should not clear the token.
      if (err.status === 401 || err.status === 403) {
        clearToken();
        set({ isAuthenticated: false, user: null });
      }
      set({ loading: false });
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
      drivers: [], vehicles: [], soilTypes: [], trips: [], diesel: [], driverTrips: [], upad: [], locations: [], vendors: [], bills: []
    });
  },

  // --- Init Data - Fetch only essential common data to speed up initial load
  init: async () => {
    if (get().hasInitialized) return;
    try {
      const { user } = get();
      const isDriver = user?.role === 'driver';
      const upadFilters = isDriver && user.driverProfile ? { driverId: user.driverProfile } : {};

      // Only fetch essentials like soil types and locations that are used across multiple forms/pages
      const [soils, locs, ups] = await Promise.all([
        api.soilTypes.getAll(),
        api.locations.getAll({ limit: 100 }), // get enough locations for dropdowns
        api.upad.getAll(upadFilters),
      ]);
      
      set({
        soilTypes: soils.map(mapId),
        locations: (locs.data || locs).map(mapId),
        locationsMeta: { total: locs.total || locs.length, page: locs.page || 1, totalPages: locs.totalPages || 1 },
        upad: (ups.data || ups).map(mapId),
        hasInitialized: true
      });
    } catch (err) {
      // Don't set loading: false here as it's already false from checkAuth
    }
  },

  // --- Drivers
  fetchDrivers: async (params) => {
    set({ contentLoading: true });
    try {
      const res = await api.drivers.getAll(params);
      set({ 
        drivers: res.data.map(mapId),
        driversMeta: { total: res.total, page: res.page, totalPages: res.totalPages },
        contentLoading: false
      });
    } catch (error) {
      set({ contentLoading: false });
      toast.error(`Error fetching drivers: ${error.message}`);
    }
  },
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
  fetchVehicles: async (params) => {
    set({ contentLoading: true });
    try {
      const res = await api.vehicles.getAll(params);
      set({ 
        vehicles: res.data.map(mapVehicle),
        vehiclesMeta: { total: res.total, page: res.page, totalPages: res.totalPages },
        contentLoading: false
      });
    } catch (error) {
      set({ contentLoading: false });
      toast.error(`Error fetching vehicles: ${error.message}`);
    }
  },
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
  fetchSoilTypes: async () => {
    try {
      const res = await api.soilTypes.getAll();
      set({ soilTypes: res.map(mapId) });
    } catch (error) {
      toast.error(`Error fetching material types: ${error.message}`);
    }
  },

  // --- Trips
  fetchTrips: async (filters) => {
    const res = await api.trips.getAll(filters);
    set({ 
      trips: res.data.map(mapTrip),
      tripsMeta: { total: res.total, page: res.page, totalPages: res.totalPages },
      tripsSummary: res.summary
    });
  },
  addTrip: async (trip) => {
    try {
      const payload = { ...trip, driver: trip.driverId, vehicle: trip.vehicleId, soilType: trip.soilTypeId, vendor: trip.vendorId };
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
      const payload = { ...data, driver: data.driverId || data.driver, vehicle: data.vehicleId || data.vehicle, soilType: data.soilTypeId || data.soilType, vendor: data.vendorId || data.vendor };
      const res = await api.trips.update(id, payload);
      set(s => ({ trips: s.trips.map(t => t.id === id ? mapTrip(res) : t) }));
      return res;
    } catch (error) {
      toast.error(`Error updating trip: ${error.message}`);
      throw error;
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
  fetchDiesel: async (filters) => {
    const res = await api.diesel.getAll(filters);
    set({ 
      diesel: res.data.map(mapDiesel),
      dieselMeta: { total: res.total, page: res.page, totalPages: res.totalPages }
    });
  },
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
  deleteDiesel: async (id) => {
    try {
      await api.diesel.remove(id);
      set(s => ({ diesel: s.diesel.filter(d => d.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting diesel entry: ${error.message}`);
      throw error;
    }
  },

  // --- Vendors
  addVendor: async (data) => {
    try {
      const res = await api.vendors.create(data);
      set(s => ({ vendors: [mapId(res), ...s.vendors] }));
      return res;
    } catch (error) {
      toast.error(`Error adding vendor: ${error.message}`);
      throw error;
    }
  },
  updateVendor: async (id, data) => {
    try {
      const res = await api.vendors.update(id, data);
      set(s => ({ vendors: s.vendors.map(v => v.id === id ? mapId(res) : v) }));
      return res;
    } catch (error) {
      toast.error(`Error updating vendor: ${error.message}`);
      throw error;
    }
  },
  deleteVendor: async (id) => {
    try {
      await api.vendors.remove(id);
      set(s => ({ vendors: s.vendors.filter(v => v.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting vendor: ${error.message}`);
      throw error;
    }
  },

  // --- Bills
  fetchBills: async () => {
    try {
      const res = await api.bills.getAll();
      set({ bills: res.map(mapId) });
    } catch (error) {
      toast.error(`Error fetching bills: ${error.message}`);
    }
  },
  addBill: async (data) => {
    try {
      const res = await api.bills.create(data);
      set(s => ({ bills: [mapId(res), ...s.bills] }));
      return res;
    } catch (error) {
      toast.error(`Error generating bill: ${error.message}`);
      throw error;
    }
  },
  updateBillStatus: async (id, status) => {
    try {
      const res = await api.bills.updateStatus(id, status);
      set(s => ({ bills: s.bills.map(b => b.id === id ? mapId(res) : b) }));
      return res;
    } catch (error) {
      toast.error(`Error updating bill: ${error.message}`);
      throw error;
    }
  },
  deleteBill: async (id) => {
    try {
      await api.bills.remove(id);
      set(s => ({ bills: s.bills.filter(b => b.id !== id) }));
    } catch (error) {
      toast.error(`Error deleting bill: ${error.message}`);
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
      await get().fetchTrips({ limit: 1000 });
      
      return res;
    } catch (error) {
      toast.error(`Error verifying trip: ${error.message}`);
      throw error;
    }
  },
  fetchDriverTrips: async (filters = {}) => {
    set({ contentLoading: true });
    try {

      const res = await api.driverTrips.getAll(filters);

      // Ensure we create a fresh array reference [...] to guarantee React re-render
      set({ 
        driverTrips: [...res.map(mapDriverTrip)],
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
  fetchLocations: async (params) => {
    const res = await api.locations.getAll(params);
    set({ 
      locations: res.data.map(mapId),
      locationsMeta: { total: res.total, page: res.page, totalPages: res.totalPages }
    });
  },
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
