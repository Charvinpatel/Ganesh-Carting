import Trip from '../models/Trip.model.js';
import Diesel from '../models/Diesel.model.js';
import Driver from '../models/Driver.model.js';
import Vehicle from '../models/Vehicle.model.js';
import SoilType from '../models/SoilType.model.js';
import DriverTrip from '../models/DriverTrip.model.js';

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch all data in parallel
    const [allTrips, allDiesel, drivers, vehicles, soilTypes, driverTrips] = await Promise.all([
      Trip.find({ isDeleted: { $ne: true } }).populate('driver', 'name').populate('vehicle', 'number type model').populate('soilType', 'name color'),
      Diesel.find({ isDeleted: { $ne: true } }).populate('vehicle', 'number type').populate('driver', 'name'),
      Driver.find({ isDeleted: { $ne: true } }),
      Vehicle.find({ isDeleted: { $ne: true } }).populate('assignedDriver', 'name'),
      SoilType.find({ isDeleted: { $ne: true } }),
      DriverTrip.find({ isDeleted: { $ne: true } }),
    ]);

    // Today stats
    const todayTrips  = allTrips.filter(t => t.date === today);
    const todayDiesel = allDiesel.filter(d => d.date === today);

    const todayTripCount   = todayTrips.reduce((s, t) => s + t.trips, 0);
    const todayDieselCost  = todayDiesel.reduce((s, d) => s + d.amount, 0);
    const todayRevenue     = todayTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0);
    const todayProfit      = todayTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0);

    // All-time stats
    const totalRevenue = allTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0);
    const totalProfit  = allTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0);
    const totalDiesel  = allDiesel.reduce((s, d) => s + d.amount, 0);
    const netProfit    = totalProfit - totalDiesel;

    // Last 7 days chart data
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const chartData = last7.map(date => {
      const dayTrips  = allTrips.filter(t => t.date === date);
      const dayDiesel = allDiesel.filter(d => d.date === date);
      return {
        date,
        trips:  dayTrips.reduce((s, t) => s + t.trips, 0),
        profit: dayTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
        diesel: dayDiesel.reduce((s, d) => s + d.amount, 0),
      };
    });

    // Vehicle activity
    const vehicleActivity = vehicles.map(v => {
      const vTrips  = allTrips.filter(t => t.vehicle?._id.toString() === v._id.toString());
      const vDiesel = allDiesel.filter(d => d.vehicle?._id.toString() === v._id.toString());
      return {
        _id:        v._id,
        number:     v.number,
        type:       v.type,
        model:      v.model,
        driverName: v.assignedDriver?.name || 'Unassigned',
        totalTrips: vTrips.reduce((s, t) => s + t.trips, 0),
        profit:     vTrips.reduce((s, t) => s + (t.sellPrice - t.buyPrice) * t.trips, 0),
        dieselCost: vDiesel.reduce((s, d) => s + d.amount, 0),
      };
    });

    // Soil breakdown
    const soilBreakdown = soilTypes.map(st => {
      const stTrips = allTrips.filter(t => t.soilType?._id.toString() === st._id.toString());
      return {
        _id:     st._id,
        name:    st.name,
        color:   st.color,
        count:   stTrips.reduce((s, t) => s + t.trips, 0),
        revenue: stTrips.reduce((s, t) => s + t.sellPrice * t.trips, 0),
      };
    });

    // Recent 8 trips
    const recentTrips = allTrips
      .slice()
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 8);

    res.json({
      today: {
        trips: todayTripCount,
        entriesCount: todayTrips.length,
        dieselCost: todayDieselCost,
        dieselFills: todayDiesel.length,
        profit: todayProfit,
        revenue: todayRevenue,
      },
      allTime: {
        revenue: totalRevenue,
        profit: totalProfit,
        diesel: totalDiesel,
        netProfit,
        driversCount: drivers.length,
        vehiclesCount: vehicles.length,
        driverTripsCount: driverTrips.length,
        pendingVerifications: driverTrips.filter(dt => dt.status === 'pending').length,
      },
      chartData,
      vehicleActivity,
      soilBreakdown,
      recentTrips,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
