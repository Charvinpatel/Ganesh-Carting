import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Truck, Wallet, Activity, CalendarDays, TrendingUp, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function DriverMonthlyDashboard() {
  const { user, driverTrips } = useStore();

  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g., '2026-03'
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthlyTrips = useMemo(() => 
    driverTrips.filter(t => t.date && t.date.startsWith(currentMonthStr))
  , [driverTrips, currentMonthStr]);

  const totalTrips = monthlyTrips.reduce((sum, t) => sum + (t.trips || 1), 0);

  // Calculate unique active days in this month
  const activeDays = new Set(monthlyTrips.map(t => t.date)).size;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">ANALYTICS</h1>
          <p className="text-surface-500 text-[10px] font-bold uppercase tracking-widest mt-1">Monthly Performance</p>
        </div>
        <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20 shadow-glow shadow-brand-500/5">
          <Activity className="w-6 h-6 text-brand-500" />
        </div>
      </div>

      <div className="stat-card border-brand-500/20 bg-brand-500/5 !p-6 overflow-hidden relative">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-500" />
            <h2 className="text-[11px] font-black text-surface-200 uppercase tracking-[0.2em]">
                {currentMonthName} REPORT
            </h2>
          </div>
          <span className="badge badge-green !text-[9px] uppercase tracking-tighter">On Track</span>
        </div>

        <div className="grid grid-cols-1 gap-4 relative z-10">
          <div className="bg-surface-950/50 p-4 rounded-xl border border-surface-800">
            <div className="flex items-center gap-2 mb-2 text-surface-500 uppercase font-black tracking-tighter text-[10px]">
              <Truck className="w-3.5 h-3.5" />
              <span>LOGGED TRIPS</span>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">{totalTrips}</div>
          </div>
        </div>

        <div className="mt-4 bg-surface-950/50 p-4 rounded-xl border border-surface-800 flex justify-between items-center relative z-10">
          <div>
            <div className="text-[9px] font-black uppercase text-surface-600 mb-1 tracking-widest underline decoration-brand-500/30">Active Days</div>
            <div className="text-lg font-black text-white">{activeDays} <span className="text-xs text-surface-500 uppercase">Days</span></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black uppercase text-surface-600 mb-1 tracking-widest underline decoration-brand-500/30">Total Logs</div>
            <div className="text-lg font-black text-emerald-500">{monthlyTrips.length} <span className="text-xs text-surface-500 uppercase">Records</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
            <TrendingUp className="w-4 h-4 text-surface-600" />
            <h2 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">Latest Monthly Movements</h2>
        </div>
        
        {monthlyTrips.length === 0 ? (
          <div className="text-center p-12 text-surface-500 text-[10px] font-black uppercase tracking-widest card bg-surface-900 border-dashed border-2 border-surface-800 opacity-40">
            No activity log for {currentMonthName.split(' ')[0]}
          </div>
        ) : (
          <div className="space-y-3">
            {monthlyTrips.slice(0, 10).map(t => (
            <div key={t.id} className="stat-card !p-4 !bg-surface-900 border-surface-800/60 hover:bg-surface-800 transition-colors">
                <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <div className="text-[10px] text-surface-500 font-mono font-bold tracking-tight uppercase">{formatDate(t.date)}</div>
                    <div className="text-sm text-white font-black uppercase tracking-tight">
                        {t.source || 'N/A'} <span className="text-brand-500 mx-1">→</span> {t.destination || 'N/A'}
                    </div>
                </div>
                <div className="text-right">
                    <span className={`badge !text-[9px] ${
                        t.status === 'verified' ? 'badge-green' :
                        t.status === 'rejected' ? 'badge-red' :
                        'badge-yellow'
                    }`}>
                    {t.status}
                    </span>
                    <div className="text-[11px] text-surface-400 font-black uppercase tracking-tighter mt-1">{t.trips} Trips</div>
                </div>
                </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
