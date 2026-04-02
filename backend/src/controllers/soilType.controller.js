import SoilType from '../models/SoilType.model.js';

// GET /api/soil-types
export const getSoilTypes = async (req, res) => {
  try {
    const soilTypes = await SoilType.find({ isDeleted: false }).sort({ createdAt: 1 });
    res.json(soilTypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/soil-types
export const createSoilType = async (req, res) => {
  try {
    const { name, buyPrice, sellPrice, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required.' });
    const soil = await SoilType.create({ name, buyPrice, sellPrice, color });
    res.status(201).json(soil);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/soil-types/:id
export const updateSoilType = async (req, res) => {
  try {
    const soil = await SoilType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!soil) return res.status(404).json({ message: 'Soil type not found' });
    res.json(soil);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/soil-types/:id
export const deleteSoilType = async (req, res) => {
  try {
    const soil = await SoilType.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!soil) return res.status(404).json({ message: 'Soil type not found' });
    res.json({ message: 'Soil type deleted (archived)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
