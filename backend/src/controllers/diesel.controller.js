import Diesel from '../models/Diesel.model.js';

const POPULATE = [
  { path: 'vehicle', select: 'number type model' },
  { path: 'driver',  select: 'name phone' },
];

// GET /api/diesel  (filters: date, vehicleId, from, to, page, limit)
export const getDiesel = async (req, res) => {
  try {
    const { date, vehicleId, from, to, page = 1, limit = 1000 } = req.query;
    const filter = {};

    if (date)      filter.date    = date;
    if (vehicleId) filter.vehicle = vehicleId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to)   filter.date.$lte = to;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const total = await Diesel.countDocuments(filter);
    const entries = await Diesel.find(filter)
      .populate(POPULATE)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitInt);

    res.json({
      data: entries,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limitInt),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/diesel/:id
export const getDieselEntry = async (req, res) => {
  try {
    const entry = await Diesel.findById(req.params.id).populate(POPULATE);
    if (!entry) return res.status(404).json({ message: 'Diesel entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/diesel
export const createDiesel = async (req, res) => {
  try {
    const { date, vehicle, driver, liters, amount, pumpName, pumpLocation } = req.body;
    if (!vehicle) return res.status(400).json({ message: 'Vehicle is required.' });
    if (!amount && !liters) return res.status(400).json({ message: 'Amount or liters is required.' });

    // If amount not provided, estimate at ₹89/L
    const finalAmount = amount ? parseFloat(amount) : parseFloat(liters) * 89;

    const entry = await Diesel.create({
      date, vehicle, driver: driver || null,
      liters: liters ? parseFloat(liters) : 0,
      amount: finalAmount,
      pumpName, pumpLocation,
    });
    await entry.populate(POPULATE);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/diesel/:id
export const updateDiesel = async (req, res) => {
  try {
    if (req.body.amount) req.body.amount = parseFloat(req.body.amount);
    if (req.body.liters) req.body.liters = parseFloat(req.body.liters);
    if (req.body.driver === '') req.body.driver = null;

    const entry = await Diesel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate(POPULATE);
    if (!entry) return res.status(404).json({ message: 'Diesel entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/diesel/:id
export const deleteDiesel = async (req, res) => {
  try {
    const entry = await Diesel.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Diesel entry not found' });
    res.json({ message: 'Diesel entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
