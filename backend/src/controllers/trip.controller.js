import Trip from '../models/Trip.model.js';

const POPULATE = [
  { path: 'driver',   select: 'name phone' },
  { path: 'vehicle',  select: 'number type model' },
  { path: 'soilType', select: 'name buyPrice sellPrice color' },
  { path: 'vendor',   select: 'name' },
];

// GET /api/trips  (with optional query filters: date, vehicleId, driverId, soilTypeId, vendorId, from, to, page, limit)
export const getTrips = async (req, res) => {
  try {
    const { date, vehicleId, driverId, soilTypeId, vendorId, from, to, page = 1, limit = 1000 } = req.query;
    const filter = {};

    // Exact date filter: match the entire day using $gte/$lt range
    if (date) {
      filter.date = { $gte: date, $lte: date };
    } else if (from || to) {
      // Date range filter (from/to are YYYY-MM-DD strings)
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to)   filter.date.$lte = to;
    }
    // Additional filters
    if (vehicleId) filter.vehicle = vehicleId;
    if (driverId)  filter.driver  = driverId;
    if (soilTypeId) filter.soilType = soilTypeId;
    if (vendorId)   filter.vendor   = vendorId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Get totals for the entire filtered set (for summary cards)
    const allMatching = await Trip.find(filter);
    const totals = allMatching.reduce((acc, t) => {
      acc.revenue += (t.sellPrice * t.trips);
      acc.profit += ((t.sellPrice - t.buyPrice) * t.trips);
      acc.trips += t.trips;
      return acc;
    }, { revenue: 0, profit: 0, trips: 0 });

    const total = await Trip.countDocuments(filter);
    const trips = await Trip.find(filter)
      .populate(POPULATE)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitInt);

    res.json({
      data: trips,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limitInt),
      summary: totals
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/trips/:id
export const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate(POPULATE);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/trips
export const createTrip = async (req, res) => {
  try {
    const { date, driver, vehicle, soilType, vendor, source, destination, trips, buyPrice, sellPrice, notes } = req.body;

    if (!driver || !vehicle || !soilType)
      return res.status(400).json({ message: 'Driver, vehicle and soil type are required.' });

    const trip = await Trip.create({ date, driver, vehicle, soilType, vendor, source, destination, trips, buyPrice, sellPrice, notes });
    await trip.populate(POPULATE);
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/trips/:id
export const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate(POPULATE);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/trips/:id
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
