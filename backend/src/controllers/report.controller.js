import Trip from '../models/Trip.model.js';
import Diesel from '../models/Diesel.model.js';
import Driver from '../models/Driver.model.js';
import Vehicle from '../models/Vehicle.model.js';
import SoilType from '../models/SoilType.model.js';

// GET /api/reports/daily?date=YYYY-MM-DD
export const getDailyReport = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const [trips, dieselEntries] = await Promise.all([
      Trip.find({ date })
        .populate('driver',   'name phone')
        .populate('vehicle',  'number type model')
        .populate('soilType', 'name color buyPrice sellPrice'),
      Diesel.find({ date })
        .populate('vehicle', 'number type')
        .populate('driver',  'name'),
    ]);

    const totalTrips   = trips.reduce((s, t) => s + t.trips, 0);
    const totalRevenue = trips.reduce((s, t) => s + t.sellPrice * t.trips, 0);
    const totalCost    = trips.reduce((s, t) => s + t.buyPrice  * t.trips, 0);
    const grossProfit  = totalRevenue - totalCost;
    const dieselCost   = dieselEntries.reduce((s, d) => s + d.amount, 0);
    const netProfit    = grossProfit - dieselCost;

    res.json({
      date,
      summary: { totalTrips, totalRevenue, totalCost, grossProfit, dieselCost, netProfit },
      trips,
      dieselEntries,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/driver?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getDriverReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = from;
    if (to)   dateFilter.$lte = to;

    const [drivers, trips, dieselEntries] = await Promise.all([
      Driver.find(),
      Trip.find(from || to ? { date: dateFilter } : {})
        .populate('vehicle',  'number type')
        .populate('soilType', 'name'),
      Diesel.find(from || to ? { date: dateFilter } : {}),
    ]);

    const report = drivers.map(driver => {
      const dTrips  = trips.filter(t => t.driver?.toString() === driver._id.toString());
      const dDiesel = dieselEntries.filter(d => d.driver?.toString() === driver._id.toString());
      return {
        _id:        driver._id,
        name:       driver.name,
        phone:      driver.phone,
        status:     driver.status,
        totalTrips: dTrips.reduce((s, t) => s + t.trips, 0),
        revenue:    dTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0),
        profit:     dTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
        diesel:     dDiesel.reduce((s, d) => s + d.amount, 0),
        entries:    dTrips.length,
        trips:      dTrips,
      };
    });

    res.json({ from, to, report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/vehicle?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getVehicleReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = from;
    if (to)   dateFilter.$lte = to;

    const [vehicles, trips, dieselEntries] = await Promise.all([
      Vehicle.find().populate('assignedDriver', 'name'),
      Trip.find(from || to ? { date: dateFilter } : {})
        .populate('driver',   'name')
        .populate('soilType', 'name'),
      Diesel.find(from || to ? { date: dateFilter } : {}),
    ]);

    const report = vehicles.map(v => {
      const vTrips  = trips.filter(t => t.vehicle?.toString() === v._id.toString());
      const vDiesel = dieselEntries.filter(d => d.vehicle?.toString() === v._id.toString());
      return {
        _id:           v._id,
        number:        v.number,
        type:          v.type,
        model:         v.model,
        assignedDriver: v.assignedDriver?.name || 'Unassigned',
        totalTrips:    vTrips.reduce((s, t) => s + t.trips, 0),
        revenue:       vTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0),
        profit:        vTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
        dieselCost:    vDiesel.reduce((s, d) => s + d.amount, 0),
        dieselLiters:  vDiesel.reduce((s, d) => s + (d.liters || 0), 0),
      };
    });

    res.json({ from, to, report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getSummaryReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = from;
    if (to)   dateFilter.$lte = to;

    const query = from || to ? { date: dateFilter } : {};

    const [trips, dieselEntries, soilTypes] = await Promise.all([
      Trip.find(query).populate('soilType', 'name color'),
      Diesel.find(query),
      SoilType.find(), // Get all soil types for the breakdown, including soft-deleted ones
    ]);

    const totalRevenue = trips.reduce((s, t) => s + t.sellPrice * t.trips, 0);
    const totalCost    = trips.reduce((s, t) => s + t.buyPrice  * t.trips, 0);
    const grossProfit  = totalRevenue - totalCost;
    const totalDiesel  = dieselEntries.reduce((s, d) => s + d.amount, 0);
    const netProfit    = grossProfit - totalDiesel;

    const soilBreakdown = soilTypes.map(st => {
      const stTrips = trips.filter(t => t.soilType?._id?.toString() === st._id.toString());
      return {
        name:    st.name,
        color:   st.color,
        trips:   stTrips.reduce((s, t) => s + t.trips, 0),
        revenue: stTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0),
        profit:  stTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
      };
    });

    // Handle trips where soilType is missing (previously hard-deleted)
    const missingSoilTrips = trips.filter(t => !t.soilType);
    if (missingSoilTrips.length > 0) {
      soilBreakdown.push({
        name:    'Unknown (Deleted)',
        color:   '#475569',
        trips:   missingSoilTrips.reduce((s, t) => s + t.trips, 0),
        revenue: missingSoilTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0),
        profit:  missingSoilTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
      });
    }

    res.json({
      from, to,
      totalTripsCount: trips.reduce((s, t) => s + t.trips, 0),
      totalEntries: trips.length,
      totalRevenue, totalCost, grossProfit, totalDiesel, netProfit,
      soilBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
