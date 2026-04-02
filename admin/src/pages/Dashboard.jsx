import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDateShort, getTripProfit, getTripRevenue, getTripCost, getLast7Days } from '../utils/helpers';
import { Truck, Fuel, TrendingUp, Route, ArrowUpRight, ArrowDownRight, Users, Activity, Calendar, BarChart2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import dayjs from 'dayjs';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-3 text-xs">
        <p className="text-surface-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.name?.includes('₹') || p.name?.includes('Profit') || p.name?.includes('Diesel') ? formatCurrency(p.value) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { trips, diesel, drivers, vehicles, soilTypes, driverTrips } = useStore(state => ({
    trips: state.trips,
    diesel: state.diesel,
    drivers: state.drivers,
    vehicles: state.vehicles,
    soilTypes: state.soilTypes,
    driverTrips: state.driverTrips
  }));

  const today       = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const thisMonth   = useMemo(() => dayjs().format('YYYY-MM'), []);
  const thisYear    = useMemo(() => dayjs().format('YYYY'), []);
  const last7       = useMemo(() => getLast7Days(), []);

  // Chart view toggle
  const [chartView, setChartView] = useState('week'); // 'today' | 'week' | 'month' | 'year'

  const todayStats = useMemo(() => {
    const todayTrips = trips.filter(t => t.date === today);
    const todayDiesel = diesel.filter(d => d.date === today);
    const cost = todayDiesel.reduce((s, d) => s + (d.amount || 0), 0);
    const profit = todayTrips.reduce((s, t) => s + getTripProfit(t), 0);
    const revenue = todayTrips.reduce((s, t) => s + getTripRevenue(t), 0);
    const count = todayTrips.reduce((s, t) => s + t.trips, 0);
    return { trips: todayTrips, diesel: todayDiesel, cost, profit, revenue, count };
  }, [trips, diesel, today]);

  const totals = useMemo(() => {
    const profit = trips.reduce((s, t) => s + getTripProfit(t), 0);
    const revenue = trips.reduce((s, t) => s + getTripRevenue(t), 0);
    const dieselCost = diesel.reduce((s, d) => s + (d.amount || 0), 0);
    return { profit, revenue, dieselCost };
  }, [trips, diesel]);

  // Weekly chart (last 7 days)
  const weekChartData = useMemo(() => {
    return last7.map(date => {
      const dayTrips  = trips.filter(t => t.date === date);
      const dayDiesel = diesel.filter(d => d.date === date);
      return {
        date:   formatDateShort(date),
        Trips:  dayTrips.reduce((s, t) => s + t.trips, 0),
        Profit: dayTrips.reduce((s, t) => s + getTripProfit(t), 0),
        Diesel: dayDiesel.reduce((s, d) => s + (d.amount || 0), 0),
      };
    });
  }, [trips, diesel, last7]);

  // Today chart — each trip entry as its own bar (label: vehicle number or entry time)
  const todayChartData = useMemo(() => {
    const todayTrips  = trips.filter(t => t.date === today);
    const todayDiesel = diesel.filter(d => d.date === today);
    // Group by vehicle
    const byVehicle = {};
    todayTrips.forEach(t => {
      const key = t.vehicle?.number || t.vehicleId || 'Unknown';
      if (!byVehicle[key]) byVehicle[key] = { date: key, Trips: 0, Profit: 0, Diesel: 0 };
      byVehicle[key].Trips  += (t.trips || 1);
      byVehicle[key].Profit += getTripProfit(t);
    });
    todayDiesel.forEach(d => {
      const key = d.vehicle?.number || d.vehicleId || 'Other';
      if (!byVehicle[key]) byVehicle[key] = { date: key, Trips: 0, Profit: 0, Diesel: 0 };
      byVehicle[key].Diesel += (d.amount || 0);
    });
    return Object.values(byVehicle);
  }, [trips, diesel, today]);

  // Monthly chart (last 12 months)
  const monthChartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) =>
      dayjs().subtract(11 - i, 'month').format('YYYY-MM')
    );
    return months.map(mon => {
      const mTrips  = trips.filter(t => t.date?.startsWith(mon));
      const mDiesel = diesel.filter(d => d.date?.startsWith(mon));
      return {
        date:   dayjs(mon).format('MMM YY'),
        Trips:  mTrips.reduce((s, t) => s + t.trips, 0),
        Profit: mTrips.reduce((s, t) => s + getTripProfit(t), 0),
        Diesel: mDiesel.reduce((s, d) => s + (d.amount || 0), 0),
      };
    });
  }, [trips, diesel]);

  // Yearly chart (last 5 years)
  const yearChartData = useMemo(() => {
    const years = Array.from({ length: 5 }, (_, i) =>
      String(dayjs().year() - (4 - i))
    );
    return years.map(yr => {
      const yTrips  = trips.filter(t => t.date?.startsWith(yr));
      const yDiesel = diesel.filter(d => d.date?.startsWith(yr));
      return {
        date:   yr,
        Trips:  yTrips.reduce((s, t) => s + t.trips, 0),
        Profit: yTrips.reduce((s, t) => s + getTripProfit(t), 0),
        Diesel: yDiesel.reduce((s, d) => s + (d.amount || 0), 0),
      };
    });
  }, [trips, diesel]);

  // Monthly summary stats
  const monthStats = useMemo(() => {
    const mTrips  = trips.filter(t => t.date?.startsWith(thisMonth));
    const mDiesel = diesel.filter(d => d.date?.startsWith(thisMonth));
    return {
      trips:   mTrips.reduce((s, t) => s + t.trips, 0),
      revenue: mTrips.reduce((s, t) => s + getTripRevenue(t), 0),
      profit:  mTrips.reduce((s, t) => s + getTripProfit(t), 0),
      diesel:  mDiesel.reduce((s, d) => s + (d.amount || 0), 0),
    };
  }, [trips, diesel, thisMonth]);

  // Yearly summary stats
  const yearStats = useMemo(() => {
    const yTrips  = trips.filter(t => t.date?.startsWith(thisYear));
    const yDiesel = diesel.filter(d => d.date?.startsWith(thisYear));
    return {
      trips:   yTrips.reduce((s, t) => s + t.trips, 0),
      revenue: yTrips.reduce((s, t) => s + getTripRevenue(t), 0),
      profit:  yTrips.reduce((s, t) => s + getTripProfit(t), 0),
      diesel:  yDiesel.reduce((s, d) => s + (d.amount || 0), 0),
    };
  }, [trips, diesel, thisYear]);

  const activeChartData = chartView === 'today' ? todayChartData
                        : chartView === 'week'  ? weekChartData
                        : chartView === 'month' ? monthChartData
                        : yearChartData;
  const chartTitle      = chartView === 'today' ? `Today — ${dayjs().format('DD MMM YYYY')}`
                        : chartView === 'week'  ? 'Last 7 Days'
                        : chartView === 'month' ? 'Last 12 Months'
                        : 'Last 5 Years';

  const vehicleActivity = useMemo(() => {
    return vehicles.map(v => {
      const driver = drivers.find(d => d.id === v.assignedDriver);
      const vTrips = trips.filter(t => t.vehicleId === v.id);
      const vDiesel = diesel.filter(d => d.vehicleId === v.id);
      const profit = vTrips.reduce((s, t) => s + getTripProfit(t), 0);
      const dieselCost = vDiesel.reduce((s, d) => s + (d.amount || 0), 0);
      return {
        ...v,
        driverName: driver?.name || 'Unassigned',
        totalTrips: vTrips.reduce((s, t) => s + t.trips, 0),
        profit,
        dieselCost,
      };
    });
  }, [vehicles, drivers, trips, diesel]);

  const soilBreakdown = useMemo(() => {
    const breakdown = {};
    trips.forEach(t => {
      const name = t.soilType?.name || soilTypes.find(s => s.id === t.soilTypeId)?.name || 'Unknown';
      if (!breakdown[name]) breakdown[name] = { name, count: 0, revenue: 0 };
      breakdown[name].count += t.trips;
      breakdown[name].revenue += getTripRevenue(t);
    });
    return Object.values(breakdown).sort((a, b) => b.count - a.count);
  }, [trips, soilTypes]);

  const pendingCount = useMemo(() => driverTrips.filter(dt => dt.status === 'pending').length, [driverTrips]);

  return (
    <div className="space-y-6">
      {/* Verification Alert */}
      {driverTrips.some(dt => dt.status === 'pending') && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-center justify-between shadow-glow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-tight">Pending Verifications</div>
              <div className="text-xs text-surface-400">{pendingCount} trips submitted by drivers are waiting for your review.</div>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/verify-trips'} 
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all active:scale-95"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Monthly & Yearly Summary Strips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label={`${dayjs().format('MMMM')} Trips`}   value={monthStats.trips}              sub={`Revenue ${formatCurrency(monthStats.revenue)}`}  color="blue" />
        <StatCard icon={TrendingUp} label={`${dayjs().format('MMMM')} Profit`} value={formatCurrency(monthStats.profit - monthStats.diesel)} sub={`Diesel -${formatCurrency(monthStats.diesel)}`} color="emerald" />
        <StatCard icon={Calendar} label={`${dayjs().format('YYYY')} Trips`}    value={yearStats.trips}               sub={`Revenue ${formatCurrency(yearStats.revenue)}`}   color="brand" />
        <StatCard icon={TrendingUp} label={`${dayjs().format('YYYY')} Profit`} value={formatCurrency(yearStats.profit - yearStats.diesel)}  sub={`Diesel -${formatCurrency(yearStats.diesel)}`}  color="amber" />
      </div>

      {/* Charts Row - with view switcher */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="section-title flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-400" /> Performance Overview
          </h3>
          <div className="flex gap-1.5 bg-surface-900 p-1 rounded-xl border border-surface-800">
            {[['today','Today'],['week','Weekly'],['month','Monthly'],['year','Yearly']].map(([key,label]) => (
              <button key={key} onClick={() => setChartView(key)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                  ${chartView === key ? 'bg-brand-500 text-white shadow-lg' : 'text-surface-500 hover:text-surface-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-3">Trips — {chartTitle}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Trips" fill="#f97316" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-3">Profit vs Diesel — {chartTitle}</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activeChartData}>
                <defs>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDiesel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="url(#gProfit)" strokeWidth={2} />
                <Area type="monotone" dataKey="Diesel" stroke="#f59e0b" fill="url(#gDiesel)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* Vehicle Activity + Soil Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-400" /> Vehicle Activity
          </h3>
          <div className="space-y-3">
            {vehicleActivity.map(v => (
              <div key={v.id} className="flex items-center gap-4 p-3 bg-surface-800/50 rounded-lg border border-surface-700/30 whitespace-nowrap overflow-x-auto no-scrollbar">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${v.type === 'hitachi' ? 'bg-amber-500/20' : 'bg-brand-500/20'}`}>
                  <Truck className={`w-4 h-4 ${v.type === 'hitachi' ? 'text-amber-400' : 'text-brand-400'}`} />
                </div>
                <div className="flex-1 min-w-0 flex-shrink-0">
                  <div className="font-mono text-sm text-white">{v.number}</div>
                  <div className="text-xs text-surface-500">{v.driverName} · {v.type === 'hitachi' ? 'Hitachi' : 'Truck'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-emerald-400">{formatCurrency(v.profit)}</div>
                  <div className="text-xs text-surface-500">{v.totalTrips} trips</div>
                </div>
                <div className="text-right hidden sm:block flex-shrink-0">
                  <div className="text-sm font-medium text-amber-400">{formatCurrency(v.dieselCost)}</div>
                  <div className="text-xs text-surface-500">diesel</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Soil Breakdown</h3>
          <div className="space-y-4">
            {soilBreakdown.map(s => (
              <div key={s.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-surface-300">{s.name}</span>
                  <span className="text-surface-400">{s.count} trips</span>
                </div>
                <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${s.count ? (s.count / Math.max(...soilBreakdown.map(x => x.count))) * 100 : 0}%`,
                      backgroundColor: s.id === 's1' ? '#78716c' : s.id === 's2' ? '#eab308' : '#f59e0b'
                    }}
                  />
                </div>
                <div className="text-xs text-surface-500 mt-0.5">{formatCurrency(s.revenue)} revenue</div>
              </div>
            ))}

            <div className="pt-3 border-t border-surface-700 space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Total Revenue</span>
                <span className="text-white font-medium">{formatCurrency(totals.revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Total Diesel</span>
                <span className="text-amber-400 font-medium">{formatCurrency(totals.dieselCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Recent Trips</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Soil</th>
                <th>Trips</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {trips.slice(-8).reverse().map(t => {
                const driver = drivers.find(d => d.id === t.driverId);
                const vehicle = vehicles.find(v => v.id === t.vehicleId);
                const soil = soilTypes.find(s => s.id === t.soilTypeId);
                return (
                  <tr key={t.id}>
                    <td className="font-mono text-xs">{formatDateShort(t.date)}</td>
                    <td>{driver?.name || '-'}</td>
                    <td className="font-mono text-xs">{vehicle?.number || '-'}</td>
                    <td>
                      <span className="badge badge-mixed">
                        {t.soilType?.name || soilTypes.find(s => s.id === t.soilTypeId)?.name || 'Soil'}
                      </span>
                    </td>
                    <td className="font-medium">{t.trips}</td>
                    <td className="text-blue-400">{formatCurrency(getTripRevenue(t))}</td>
                    <td className="text-emerald-400 font-medium">{formatCurrency(getTripProfit(t))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    brand:   'text-brand-400 bg-brand-500/10 border-brand-500/20',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg sm:text-xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{value}</div>
        <div className="text-[10px] sm:text-xs text-surface-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
        <div className="text-[9px] sm:text-xs text-surface-600 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{sub}</div>
      </div>
    </div>
  );
}
