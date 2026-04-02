import DriverTrip from '../models/DriverTrip.model.js';
import Trip from '../models/Trip.model.js';

const POPULATE = [
  { path: 'driver',   select: 'name phone' },
  { path: 'vehicle',  select: 'number type' },
  { path: 'soilType', select: 'name buyPrice sellPrice color' },
  { path: 'verifiedBy', select: 'name email' },
  { path: 'systemTrip' }
];

// GET /api/driver-trips
export const getDriverTrips = async (req, res) => {
  try {
    const { status, driverId, vehicleId, soilTypeId, destination, date } = req.query;
    console.log('[DEBUG] getDriverTrips Raw Query:', req.query);
    
    const filter = {};
    if (status) filter.status = status;
    if (driverId) filter.driver = driverId;
    if (vehicleId) filter.vehicle = vehicleId;
    if (soilTypeId) filter.soilType = soilTypeId;
    
    if (destination) {
      // Use case-insensitive regex for destination
      filter.destination = { $regex: destination, $options: 'i' };
    }
    
    if (date) {
      if (date.length === 7) { // YYYY-MM format
        filter.date = { $regex: `^${date}` };
      } else {
        filter.date = date;
      }
    }

    // Security: Drivers only see their own trips
    if (req.user.role === 'driver' && req.user.driverProfile) {
      filter.driver = req.user.driverProfile;
    }

    console.log('[DEBUG] getDriverTrips Final MongoDB Filter:', JSON.stringify(filter, null, 2));

    const trips = await DriverTrip.find(filter)
      .populate(POPULATE)
      .sort({ date: -1, createdAt: -1 });
      
    console.log(`[DEBUG] getDriverTrips Returning ${trips.length} results`);
    res.json(trips);
  } catch (err) {
    console.error('[ERROR] getDriverTrips:', err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/driver-trips
export const createDriverTrip = async (req, res) => {
  try {
    const { date, driver, vehicle, soilType, source, destination, trips, notes } = req.body;

    let driverId = driver;
    // If logged in as driver, use their own profile
    if (req.user.role === 'driver' && req.user.driverProfile) {
        driverId = req.user.driverProfile;
    }

    if (!driverId || !vehicle)
      return res.status(400).json({ message: 'Driver and vehicle are required.' });

    const trip = await DriverTrip.create({ 
      date, 
      driver: driverId, 
      vehicle, 
      soilType, 
      source, 
      destination, 
      trips, 
      notes, 
      status: 'pending' 
    });
    
    await trip.populate(POPULATE);
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/driver-trips/:id/verify
export const verifyDriverTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, systemTripId, notes } = req.body; // status: 'verified' or 'rejected'

    const driverTrip = await DriverTrip.findById(id);
    if (!driverTrip) return res.status(404).json({ message: 'Driver trip not found' });

    driverTrip.status = status;
    driverTrip.verifiedBy = req.user._id;
    if (systemTripId) driverTrip.systemTrip = systemTripId;
    if (notes) driverTrip.notes = notes;

    await driverTrip.save();
    await driverTrip.populate(POPULATE);
    res.json(driverTrip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/driver-trips/:id
export const deleteDriverTrip = async (req, res) => {
    try {
        const trip = await DriverTrip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        
        // Only allow drivers to delete their own pending trips, or admin
        if (req.user.role !== 'admin' && (trip.status !== 'pending' || trip.driver.toString() !== req.user.driverProfile?.toString())) {
            return res.status(403).json({ message: 'Not authorized to delete this trip' });
        }

        await DriverTrip.findByIdAndDelete(req.params.id);
        res.json({ message: 'Driver trip deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
