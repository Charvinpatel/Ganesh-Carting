import Location from '../models/Location.model.js';

export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 1000, type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const total = await Location.countDocuments(filter);
    const locations = await Location.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitInt);

    res.json({
      data: locations,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limitInt),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const loc = await Location.create(req.body);
    res.status(201).json(loc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
