import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, getTripProfit, getTripRevenue } from '../utils/helpers';
import { BarChart3, Download, Filter, FileText } from 'lucide-react';
import { Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

export default function Reports() {
  const trips = useStore(state => state.trips);
  const diesel = useStore(state => state.diesel);
  const drivers = useStore(state => state.drivers);
  const vehicles = useStore(state => state.vehicles);
  const soilTypes = useStore(state => state.soilTypes);
  const fetchTrips = useStore(state => state.fetchTrips);
  const fetchDiesel = useStore(state => state.fetchDiesel);
  const fetchDrivers = useStore(state => state.fetchDrivers);
  const fetchVehicles = useStore(state => state.fetchVehicles);
  const fetchSoilTypes = useStore(state => state.fetchSoilTypes);
  const contentLoading = useStore(state => state.contentLoading);

  useEffect(() => {
    if (drivers.length === 0) fetchDrivers({ limit: 1000 });
    if (vehicles.length === 0) fetchVehicles({ limit: 1000 });
    if (soilTypes.length === 0) fetchSoilTypes();
  }, [drivers.length, vehicles.length, soilTypes.length, fetchDrivers, fetchVehicles, fetchSoilTypes]);
  const [reportType, setReportType] = useState('daily');
  const [filter, setFilter] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate:   dayjs().format('YYYY-MM-DD'),
    vehicleId: '',
    driverId: '',
    soilTypeId: '',
  });

  const setPreset = (key) => {
    const today = dayjs();
    const presets = {
      today:     { startDate: today.format('YYYY-MM-DD'),                    endDate: today.format('YYYY-MM-DD') },
      yesterday: { startDate: today.subtract(1,'day').format('YYYY-MM-DD'),  endDate: today.subtract(1,'day').format('YYYY-MM-DD') },
      week:      { startDate: today.startOf('week').format('YYYY-MM-DD'),    endDate: today.format('YYYY-MM-DD') },
      month:     { startDate: today.startOf('month').format('YYYY-MM-DD'),   endDate: today.format('YYYY-MM-DD') },
      year:      { startDate: today.startOf('year').format('YYYY-MM-DD'),    endDate: today.format('YYYY-MM-DD') },
    };
    if (presets[key]) setFilter(f => ({ ...f, ...presets[key] }));
  };

  // Fetch data whenever filters change
  useEffect(() => {
    const filters = {
      from: filter.startDate,
      to: filter.endDate,
      vehicleId: filter.vehicleId,
      driverId: filter.driverId,
      soilTypeId: filter.soilTypeId,
    };
    fetchTrips(filters);
    fetchDiesel({ from: filter.startDate, to: filter.endDate, vehicleId: filter.vehicleId });
  }, [filter, fetchTrips, fetchDiesel]);

  const totalRevenue = trips.reduce((s, t) => s + getTripRevenue(t), 0);
  const totalProfit = trips.reduce((s, t) => s + getTripProfit(t), 0);
  const totalDiesel = diesel.reduce((s, d) => s + (d.amount || 0), 0);
  const totalTrips = trips.reduce((s, t) => s + t.trips, 0);

  // Daily report data
  const dailyData = useMemo(() => {
    const days = {};
    trips.forEach(t => {
      if (!days[t.date]) days[t.date] = { date: t.date, trips: 0, revenue: 0, profit: 0, diesel: 0 };
      days[t.date].trips += t.trips;
      days[t.date].revenue += getTripRevenue(t);
      days[t.date].profit += getTripProfit(t);
    });
    diesel.forEach(d => {
      if (!days[d.date]) days[d.date] = { date: d.date, trips: 0, revenue: 0, profit: 0, diesel: 0 };
      days[d.date].diesel += (d.amount || 0);
    });
    return Object.values(days).sort((a, b) => b.date.localeCompare(a.date));
  }, [trips, diesel]);

  // Vehicle report
  const vehicleData = useMemo(() => vehicles.map(v => {
    const vTrips = trips.filter(t => t.vehicleId === v.id);
    const vDiesel = diesel.filter(d => d.vehicleId === v.id);
    const driver = drivers.find(d => d.id === v.assignedDriver);
    return {
      ...v,
      driverName: driver?.name || '-',
      trips: vTrips.reduce((s, t) => s + t.trips, 0),
      revenue: vTrips.reduce((s, t) => s + getTripRevenue(t), 0),
      profit: vTrips.reduce((s, t) => s + getTripProfit(t), 0),
      diesel: vDiesel.reduce((s, d) => s + (d.amount || 0), 0),
    };
  }).filter(v => v.trips > 0), [trips, diesel, vehicles]);

  // Driver report
  const driverData = useMemo(() => drivers.map(d => {
    const dTrips = trips.filter(t => t.driverId === d.id);
    return {
      ...d,
      trips: dTrips.reduce((s, t) => s + t.trips, 0),
      revenue: dTrips.reduce((s, t) => s + getTripRevenue(t), 0),
      profit: dTrips.reduce((s, t) => s + getTripProfit(t), 0),
    };
  }).filter(d => d.trips > 0), [trips, drivers]);

  const exportCSV = () => {
    let csv = 'Date,Driver,Vehicle,Soil Type,Source,Destination,Trips,Buy Price,Sell Price,Revenue,Profit\n';
    trips.forEach(t => {
      const driver = drivers.find(d => d.id === t.driverId);
      const vehicle = vehicles.find(v => v.id === t.vehicleId);
      const soilName = t.soilType?.name || soilTypes.find(s => s.id === t.soilTypeId)?.name || 'Unknown';
      csv += `${t.date},${driver?.name || t.driver?.name || ''},${vehicle?.number || t.vehicle?.number || ''},${soilName},${t.source},${t.destination},${t.trips},${t.buyPrice},${t.sellPrice},${getTripRevenue(t)},${getTripProfit(t)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `trips_report_${filter.startDate}_${filter.endDate}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">REPORTS</h1>
          <p className="text-surface-500 text-sm mt-1">Analyze your business performance</p>
        </div>
        <button className="btn-secondary" onClick={exportCSV}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center"><div className="text-xs text-surface-500">Total Trips</div><div className="text-xl font-bold text-white">{totalTrips}</div></div>
        <div className="card p-3 text-center"><div className="text-xs text-surface-500">Revenue</div><div className="text-xl font-bold text-blue-400">{formatCurrency(totalRevenue)}</div></div>
        <div className="card p-3 text-center"><div className="text-xs text-surface-500">Diesel</div><div className="text-xl font-bold text-amber-400">{formatCurrency(totalDiesel)}</div></div>
        <div className="card p-3 text-center"><div className="text-xs text-surface-500">Net Profit</div><div className="text-xl font-bold text-emerald-400">{formatCurrency(totalProfit - totalDiesel)}</div></div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-surface-500" />
          <span className="text-sm text-surface-400 font-medium mr-1">Quick Range:</span>
          {[
            { key: 'today',     label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'week',      label: 'This Week' },
            { key: 'month',     label: 'This Month' },
            { key: 'year',      label: 'This Year' },
          ].map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all
                bg-surface-900 text-surface-400 border-surface-800 hover:border-brand-500/50 hover:text-brand-400">
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">From Date</label>
            <DatePicker 
              className="w-full"
              value={filter.startDate ? dayjs(filter.startDate) : null}
              onChange={(date) => setFilter({...filter, startDate: date ? date.format('YYYY-MM-DD') : ''})}
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <DatePicker 
              className="w-full"
              value={filter.endDate ? dayjs(filter.endDate) : null}
              onChange={(date) => setFilter({...filter, endDate: date ? date.format('YYYY-MM-DD') : ''})}
            />
          </div>
          <div>
            <label className="label">Vehicle</label>
            <Select
              className="w-full"
              placeholder="All"
              value={filter.vehicleId || undefined}
              onChange={val => setFilter({...filter, vehicleId: val || ''})}
              options={vehicles.map(v => ({ label: v.number, value: v.id }))}
              allowClear
              showSearch
            />
          </div>
          <div>
            <label className="label">Driver</label>
            <Select
              className="w-full"
              placeholder="All"
              value={filter.driverId || undefined}
              onChange={val => setFilter({...filter, driverId: val || ''})}
              options={drivers.map(d => ({ label: d.name, value: d.id }))}
              allowClear
              showSearch
            />
          </div>
          <div>
            <label className="label">Soil</label>
            <Select
              className="w-full"
              placeholder="All"
              value={filter.soilTypeId || undefined}
              onChange={val => setFilter({...filter, soilTypeId: val || ''})}
              options={soilTypes.map(s => ({ label: s.name, value: s.id }))}
              allowClear
              showSearch
            />
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'daily', label: 'Daily Report' },
          { key: 'vehicle', label: 'Vehicle-wise' },
          { key: 'driver', label: 'Driver-wise' },
          { key: 'trips', label: 'All Trips' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setReportType(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${reportType === tab.key ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
            <FileText className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="relative min-h-[400px]">
        {contentLoading && (
          <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {reportType === 'daily' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Trips</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Profit</th>
                  <th className="text-right">Diesel</th>
                  <th className="text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map(d => (
                  <tr key={d.date}>
                    <td className="font-mono text-xs">{formatDate(d.date)}</td>
                    <td className="text-right font-bold">{d.trips}</td>
                    <td className="text-right text-blue-400">{formatCurrency(d.revenue)}</td>
                    <td className="text-right text-emerald-400">{formatCurrency(d.profit)}</td>
                    <td className="text-right text-amber-400">{formatCurrency(d.diesel)}</td>
                    <td className={`text-right font-semibold ${(d.profit - d.diesel) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(d.profit - d.diesel)}
                    </td>
                  </tr>
                ))}
                {dailyData.length === 0 && !contentLoading && <tr><td colSpan={6} className="text-center py-8 text-surface-500">No data for selected period</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'vehicle' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Vehicle</th><th>Driver</th><th className="text-right">Trips</th><th className="text-right">Revenue</th><th className="text-right">Soil Profit</th><th className="text-right">Diesel</th><th className="text-right">Net Profit</th></tr>
              </thead>
              <tbody>
                {vehicleData.map(v => (
                  <tr key={v.id}>
                    <td className="font-mono font-bold">{v.number}</td>
                    <td>{v.driverName}</td>
                    <td className="text-right">{v.trips}</td>
                    <td className="text-right text-blue-400">{formatCurrency(v.revenue)}</td>
                    <td className="text-right text-emerald-400">{formatCurrency(v.profit)}</td>
                    <td className="text-right text-amber-400">{formatCurrency(v.diesel)}</td>
                    <td className={`text-right font-bold ${(v.profit-v.diesel) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(v.profit-v.diesel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'driver' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Driver</th><th>Phone</th><th className="text-right">Trips</th><th className="text-right">Revenue</th><th className="text-right">Profit</th></tr>
              </thead>
              <tbody>
                {driverData.map(d => (
                  <tr key={d.id}>
                    <td className="font-semibold">{d.name}</td>
                    <td className="font-mono text-xs">{d.phone}</td>
                    <td className="text-right">{d.trips}</td>
                    <td className="text-right text-blue-400">{formatCurrency(d.revenue)}</td>
                    <td className="text-right text-emerald-400">{formatCurrency(d.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'trips' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Driver</th><th>Vehicle</th><th>Soil</th><th>Source → Dest</th><th className="text-right">Trips</th><th className="text-right">Revenue</th><th className="text-right">Profit</th></tr>
              </thead>
              <tbody>
                {trips.map(t => {
                  const driver = drivers.find(d => d.id === t.driverId);
                  const vehicle = vehicles.find(v => v.id === t.vehicleId);
                  const soil = soilTypes.find(s => s.id === t.soilTypeId);
                  return (
                    <tr key={t.id}>
                      <td className="font-mono text-xs">{formatDate(t.date)}</td>
                      <td>{driver?.name || t.driver?.name || '-'}</td>
                      <td className="font-mono text-xs">{vehicle?.number || t.vehicle?.number || '-'}</td>
                      <td><span className="badge badge-mixed">{t.soilType?.name || soilTypes.find(s => s.id === t.soilTypeId)?.name || '-'}</span></td>
                      <td className="text-xs text-surface-400">{t.source} → {t.destination}</td>
                      <td className="text-right font-bold">{t.trips}</td>
                      <td className="text-right text-blue-400">{formatCurrency(getTripRevenue(t))}</td>
                      <td className="text-right text-emerald-400">{formatCurrency(getTripProfit(t))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
