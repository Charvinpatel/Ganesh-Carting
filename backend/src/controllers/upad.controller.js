import Upad from '../models/Upad.model.js';

export const getAll = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };
    if (req.query.driverId) filter.driver = req.query.driverId;
    if (req.query.date) filter.date = req.query.date;
    const upads = await Upad.find(filter).populate('driver', 'name phone').sort({ date: -1, createdAt: -1 });
    res.json(upads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const upad = await Upad.create(req.body);
    const populated = await upad.populate('driver', 'name phone');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await Upad.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
