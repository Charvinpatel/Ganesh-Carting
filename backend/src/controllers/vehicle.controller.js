import Vehicle from '../models/Vehicle.model.js';
import Trip from '../models/Trip.model.js';
import Diesel from '../models/Diesel.model.js';

// GET /api/vehicles (with optional pagination)
export const getVehicles = async (req, res) => {
  try {
    const { search, page = 1, limit = 1000 } = req.query;
    const filter = {};
    if (search) {
      filter.number = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const total = await Vehicle.countDocuments(filter);
    const vehicles = await Vehicle.find(filter)
      .populate('assignedDriver', 'name phone status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);

    res.json({
      data: vehicles,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limitInt),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/vehicles/:id
export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('assignedDriver', 'name phone');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const trips = await Trip.find({ vehicle: vehicle._id });
    const dieselEntries = await Diesel.find({ vehicle: vehicle._id });

    const totalTrips  = trips.reduce((s, t) => s + t.trips, 0);
    const totalProfit = trips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0);
    const totalDiesel = dieselEntries.reduce((s, d) => s + d.amount, 0);

    res.json({ ...vehicle.toObject(), totalTrips, totalProfit, totalDiesel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    const { number, type, assignedDriver, model, capacity, status } = req.body;
    if (!number) return res.status(400).json({ message: 'Vehicle number is required.' });

    const vehicle = await Vehicle.create({ number, type, assignedDriver: assignedDriver || null, model, capacity, status });
    await vehicle.populate('assignedDriver', 'name phone');
    res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Vehicle number already exists.' });
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    if (req.body.assignedDriver === '') req.body.assignedDriver = null;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedDriver', 'name phone');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/vehicles/:id
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
