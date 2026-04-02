import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, getTripProfit, getTripRevenue, getTripCost, getLast30Days, formatDateShort } from '../utils/helpers';
import { TrendingUp, TrendingDown, DollarSign, Fuel, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-3 text-xs">
        <p className="text-surface-400 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="mb-0.5">{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Finance() {
  const { trips, diesel, soilTypes, vehicles, drivers, fetchTrips, fetchDiesel, contentLoading } = useStore();
  const [period, setPeriod] = useState('30');

  const days = period === '7' ? 7 : period === '30' ? 30 : 90;
  
  // Fetch data whenever period changes
  useEffect(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    
    fetchTrips({ from: startStr });
    fetchDiesel({ from: startStr });
  }, [days, fetchTrips, fetchDiesel]);

  const totalRevenue = trips.reduce((s, t) => s + getTripRevenue(t), 0);
  const totalCost = trips.reduce((s, t) => s + getTripCost(t), 0);
  const totalProfit = trips.reduce((s, t) => s + getTripProfit(t), 0);
  const totalDiesel = diesel.reduce((s, d) => s + (d.amount || 0), 0);
  const netProfit = totalProfit - totalDiesel;
  const margin = totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Chart data - last 'days' or 14 days min
  const chartDays = Math.max(days, 14);
  const chartDates = useMemo(() => {
    return Array.from({ length: chartDays }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (chartDays - 1 - i));
        return d.toISOString().split('T')[0];
    });
  }, [chartDays]);

  const chartData = useMemo(() => {
    return chartDates.map(date => {
        const dayTrips = trips.filter(t => t.date === date);
        const dayDiesel = diesel.filter(d => d.date === date);
        const revenue = dayTrips.reduce((s, t) => s + getTripRevenue(t), 0);
        const cost = dayTrips.reduce((s, t) => s + getTripCost(t), 0);
        const dieselCost = dayDiesel.reduce((s, d) => s + (d.amount || 0), 0);
        return {
          date: formatDateShort(date),
          Revenue: revenue,
          'Soil Cost': cost,
          'Diesel': dieselCost,
          'Net Profit': revenue - cost - dieselCost,
        };
    });
  }, [trips, diesel, chartDates]);

  // Soil type breakdown
  const soilBreakdown = useMemo(() => soilTypes.map(st => {
    const stTrips = trips.filter(t => t.soilTypeId === st.id);
    return {
      name: st.name,
      trips: stTrips.reduce((s, t) => s + t.trips, 0),
      revenue: stTrips.reduce((s, t) => s + getTripRevenue(t), 0),
      profit: stTrips.reduce((s, t) => s + getTripProfit(t), 0),
    };
  }), [trips, soilTypes]);

  // Vehicle breakdown
  const vehicleBreakdown = useMemo(() => vehicles.map(v => {
    const vTrips = trips.filter(t => t.vehicleId === v.id);
    const vDiesel = diesel.filter(d => d.vehicleId === v.id);
    const driver = drivers.find(d => d.id === v.assignedDriver);
    return {
      ...v,
      driverName: driver?.name || 'N/A',
      revenue: vTrips.reduce((s, t) => s + getTripRevenue(t), 0),
      profit: vTrips.reduce((s, t) => s + getTripProfit(t), 0),
      diesel: vDiesel.reduce((s, d) => s + (d.amount || 0), 0),
      trips: vTrips.reduce((s, t) => s + t.trips, 0),
    };
  }), [trips, diesel, vehicles, drivers]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">FINANCE</h1>
          <p className="text-surface-500 text-sm mt-1">Financial overview & profit analysis</p>
        </div>
        <div className="flex gap-2">
          {['7','30','90'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-surface-500">Total Revenue</div>
            <div className="text-xl font-bold text-blue-400">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-xs text-surface-500">Soil Cost</div>
            <div className="text-xl font-bold text-red-400">{formatCurrency(totalCost)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-surface-500">Diesel Cost</div>
            <div className="text-xl font-bold text-amber-400">{formatCurrency(totalDiesel)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-surface-500">Net Profit</div>
            <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</div>
            <div className="text-xs text-surface-500">Margin: {margin}%</div>
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Profit & Loss Summary</h3>
        <div className="space-y-3">
          <PLRow label="Gross Revenue (Selling Price × Trips)" value={totalRevenue} color="text-blue-400" />
          <PLRow label="(-) Soil Purchase Cost" value={-totalCost} color="text-red-400" negative />
          <div className="border-t border-surface-700 pt-2">
            <PLRow label="Gross Profit" value={totalProfit} color="text-emerald-400" bold />
          </div>
          <PLRow label="(-) Diesel Expenses" value={-totalDiesel} color="text-amber-400" negative />
          <div className="border-t border-surface-700 pt-2">
            <PLRow label="Net Profit" value={netProfit} color={netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} bold big />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="section-title mb-4">Revenue vs Costs (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[2,2,0,0]} />
              <Bar dataKey="Soil Cost" fill="#ef4444" radius={[2,2,0,0]} />
              <Bar dataKey="Diesel" fill="#f59e0b" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Net Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="netProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Net Profit" stroke="#10b981" fill="url(#netProfit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4">
        {contentLoading && (
          <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="card p-5">
          <h3 className="section-title mb-4">Soil Type Breakdown</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Soil</th>
                  <th className="text-right">Trips</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {soilBreakdown.map(s => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td className="text-right">{s.trips}</td>
                    <td className="text-right text-blue-400">{formatCurrency(s.revenue)}</td>
                    <td className="text-right text-emerald-400">{formatCurrency(s.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Vehicle-wise P&L</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Diesel</th>
                  <th className="text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {vehicleBreakdown.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div className="font-mono text-xs font-bold">{v.number}</div>
                      <div className="text-xs text-surface-500">{v.driverName}</div>
                    </td>
                    <td className="text-right text-blue-400">{formatCurrency(v.revenue)}</td>
                    <td className="text-right text-amber-400">{formatCurrency(v.diesel)}</td>
                    <td className={`text-right font-semibold ${(v.profit - v.diesel) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(v.profit - v.diesel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PLRow({ label, value, color, negative, bold, big }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${bold ? 'text-surface-200' : 'text-surface-400'}`}>{label}</span>
      <span className={`font-mono ${big ? 'text-lg' : 'text-sm'} ${color}`}>
        {negative && value < 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
