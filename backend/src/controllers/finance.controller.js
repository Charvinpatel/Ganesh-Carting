import Trip from '../models/Trip.model.js';
import Diesel from '../models/Diesel.model.js';
import SoilType from '../models/SoilType.model.js';
import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';

// GET /api/finance/summary?days=30
export const getFinanceSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const from = startDate.toISOString().split('T')[0];

    const [trips, dieselEntries, soilTypes, vehicles, drivers] = await Promise.all([
      Trip.find({ date: { $gte: from } }).populate('soilType', 'name').populate('vehicle', 'number type').populate('driver', 'name'),
      Diesel.find({ date: { $gte: from } }).populate('vehicle', 'number'),
      SoilType.find(),
      Vehicle.find().populate('assignedDriver', 'name'),
      Driver.find(),
    ]);

    const totalRevenue = trips.reduce((s, t) => s + t.sellPrice * t.trips, 0);
    const totalCost    = trips.reduce((s, t) => s + t.buyPrice  * t.trips, 0);
    const totalProfit  = totalRevenue - totalCost;
    const totalDiesel  = dieselEntries.reduce((s, d) => s + d.amount, 0);
    const netProfit    = totalProfit - totalDiesel;
    const margin       = totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // 14-day chart
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });

    const chartData = last14.map(date => {
      const dayTrips  = trips.filter(t => t.date === date);
      const dayDiesel = dieselEntries.filter(d => d.date === date);
      const revenue   = dayTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0);
      const cost      = dayTrips.reduce((s, t) => s + t.buyPrice  * t.trips, 0);
      const diesel    = dayDiesel.reduce((s, d) => s + d.amount, 0);
      return { date, revenue, soilCost: cost, diesel, netProfit: revenue - cost - diesel };
    });

    // Soil breakdown
    const soilBreakdown = soilTypes.map(st => {
      const stTrips = trips.filter(t => t.soilType?._id.toString() === st._id.toString());
      return {
        _id:     st._id,
        name:    st.name,
        trips:   stTrips.reduce((s, t) => s + t.trips, 0),
        revenue: stTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0),
        profit:  stTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
      };
    });

    // Vehicle breakdown
    const vehicleBreakdown = vehicles.map(v => {
      const vTrips  = trips.filter(t => t.vehicle?._id.toString() === v._id.toString());
      const vDiesel = dieselEntries.filter(d => d.vehicle?._id.toString() === v._id.toString());
      return {
        _id:        v._id,
        number:     v.number,
        type:       v.type,
        driverName: v.assignedDriver?.name || 'N/A',
        trips:      vTrips.reduce((s, t) => s + t.trips, 0),
        revenue:    vTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0),
        profit:     vTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
        diesel:     vDiesel.reduce((s, d) => s + d.amount, 0),
      };
    });

    res.json({
      period: { days, from },
      summary: { totalRevenue, totalCost, totalProfit, totalDiesel, netProfit, margin: parseFloat(margin) },
      chartData,
      soilBreakdown,
      vehicleBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
