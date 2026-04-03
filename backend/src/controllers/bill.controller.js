import Bill from '../models/Bill.model.js';
import Trip from '../models/Trip.model.js';
import DriverTrip from '../models/DriverTrip.model.js';

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ isDeleted: { $ne: true } })
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBill = async (req, res) => {
  try {
    const { vendorId, tripIds = [], driverTripIds = [], date, billNumber, notes, vendorName, destination } = req.body;

    // Accept either a vendor reference OR a free-text vendorName
    if (!vendorId && !vendorName) {
      return res.status(400).json({ message: 'Vendor name is required.' });
    }
    if (tripIds.length === 0 && driverTripIds.length === 0) {
      return res.status(400).json({ message: 'At least one trip is required.' });
    }

    // Tally admin trips
    const adminTrips = tripIds.length > 0 ? await Trip.find({ _id: { $in: tripIds } }) : [];
    const adminTripCount  = adminTrips.reduce((sum, t) => sum + (t.trips || 1), 0);
    const totalAmount     = adminTrips.reduce((sum, t) => sum + ((t.sellPrice || 0) * (t.trips || 1)), 0);

    // Tally verified driver trips (count only, no price)
    const driverTripsData = driverTripIds.length > 0 ? await DriverTrip.find({ _id: { $in: driverTripIds } }) : [];
    const driverTripCount = driverTripsData.reduce((sum, dt) => sum + (dt.trips || 1), 0);

    const totalTripsCount = adminTripCount + driverTripCount;

    const billData = {
      vendorName,
      billNumber,
      date,
      trips: tripIds,
      driverTrips: driverTripIds,
      destination,
      totalTripsCount,
      totalAmount,
      notes,
    };
    if (vendorId) {
      billData.vendor = vendorId;
    }

    const bill = await Bill.create(billData);

    res.status(201).json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateBillStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bill = await Bill.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Bill deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
