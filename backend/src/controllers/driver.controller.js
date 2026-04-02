import Driver from '../models/Driver.model.js';
import Vehicle from '../models/Vehicle.model.js';
import Trip from '../models/Trip.model.js';

// GET /api/drivers (with optional search and pagination)
export const getDrivers = async (req, res) => {
  try {
    const { search, page = 1, limit = 1000 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { license: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const total = await Driver.countDocuments(filter);
    const drivers = await Driver.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);

    res.json({
      data: drivers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limitInt),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/drivers/:id
export const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const assignedVehicle = await Vehicle.findOne({ assignedDriver: driver._id });
    const trips = await Trip.find({ driver: driver._id });
    const totalTrips = trips.reduce((s, t) => s + t.trips, 0);

    res.json({ ...driver.toObject(), assignedVehicle, totalTrips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/drivers
export const createDriver = async (req, res) => {
  try {
    const { name, phone, license, licenseExpiry, status } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required.' });

    const driver = await Driver.create({ name, phone, license, licenseExpiry, status });
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/drivers/:id
export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/drivers/:id
export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
