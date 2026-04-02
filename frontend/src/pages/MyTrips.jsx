import { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Clock, Truck, MapPin, Calendar, LayoutGrid, Filter, Search, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

const getToday       = () => dayjs().format('YYYY-MM-DD');
const getCurrentMonth = () => dayjs().format('YYYY-MM');

export default function MyTrips() {
  const { driverTrips, fetchDriverTrips, vehicles, soilTypes, contentLoading: loading } = useStore();
  
  const today          = getToday();        // fresh on each mount
  const currentMonth   = getCurrentMonth();

  const [filterMonth, setFilterMonth] = useState(() => getCurrentMonth());
  const [filterDate,  setFilterDate]  = useState('');

  const loadData = useCallback(() => {
    // If a specific date is selected, we fetch for that date, otherwise for the month
    const dateParam = filterDate || filterMonth;
    fetchDriverTrips({ date: dateParam });
  }, [filterMonth, filterDate, fetchDriverTrips]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group trips by date for the list info
  const groupedTrips = useMemo(() => {
    const groups = {};
    driverTrips.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.fromEntries(Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])));
  }, [driverTrips]);

  const totalCount = driverTrips.reduce((s, t) => s + (t.trips || 1), 0);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">TRIP HISTORY</h1>
          <p className="text-surface-500 text-[10px] font-bold uppercase tracking-widest mt-1">Review your past performance</p>
        </div>
        <div className="w-11 h-11 bg-surface-900 rounded-2xl flex items-center justify-center border border-surface-800">
          <Clock className="w-5 h-5 text-brand-500" />
        </div>
      </div>

      {/* Filters Section */}
      <div className="card !p-4 bg-surface-900 border-surface-800 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-3.5 h-3.5 text-brand-500" />
          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Search History</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1.5 block">By Month</label>
            <DatePicker 
              picker="month"
              className="w-full !bg-surface-950 !border-surface-800 !text-white !h-10"
              value={dayjs(filterMonth)}
              onChange={(date) => {
                setFilterMonth(date ? date.format('YYYY-MM') : getCurrentMonth());
                setFilterDate(''); // Clear date when month changes
              }}
              allowClear={false}
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1.5 block">Specific Day</label>
            <DatePicker 
              className="w-full !bg-surface-950 !border-surface-800 !text-white !h-10"
              value={filterDate ? dayjs(filterDate) : null}
              onChange={(date) => setFilterDate(date ? date.format('YYYY-MM-DD') : '')}
              placeholder="All Days"
            />
          </div>
        </div>
        
        {loading && (
          <div className="flex items-center justify-center gap-2 py-1">
             <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[9px] font-black text-surface-500 uppercase">Updating List...</span>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
         <div className="stat-card !p-4 !bg-brand-500/5 border-brand-500/20">
            <div className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1">Total Trips</div>
            <div className="text-2xl font-black text-white">{totalCount}</div>
         </div>
         <div className="stat-card !p-4 !bg-surface-900 border-surface-800">
            <div className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1">Days Active</div>
            <div className="text-2xl font-black text-white">{Object.keys(groupedTrips).length}</div>
         </div>
      </div>

      {/* History List */}
      <div className="space-y-8 mt-4">
        {Object.keys(groupedTrips).length === 0 ? (
          <div className="card p-12 text-center border-dashed border-2 border-surface-800 bg-transparent flex flex-col items-center opacity-40">
            <Clock className="w-12 h-12 text-surface-700 mb-4" />
            <p className="text-surface-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">No history found<br/>for this period</p>
          </div>
        ) : (
          Object.entries(groupedTrips).map(([date, dailyTrips]) => {
            const dateObj = dayjs(date);
            const dateStr = dateObj.format('DD MMM');
            const dailyTotal = dailyTrips.reduce((s, t) => s + (t.trips || 1), 0);
            
            return (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3 text-surface-600" />
                    <h2 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">{dateStr} {dateObj.year()}</h2>
                  </div>
                  <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">
                    {dailyTotal} 
                  </span>
                </div>
                
                <div className="space-y-2">
                    {dailyTrips.map(t => {
                        const vehicle = vehicles.find(v => v.id === t.vehicleId);
                        const isVerified = t.status === 'verified';
                        const isRejected = t.status === 'rejected';

                        return (
                            <div key={t.id} className="stat-card !p-4 !bg-surface-900 border-surface-800/60 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full ${isVerified ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-500'}`} />
                                
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isVerified ? 'bg-emerald-500/10 text-emerald-500' : isRejected ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {t.status}
                                    </span>
                                    <span className="text-[9px] font-mono text-surface-600 font-bold ml-2 tracking-tighter">
                                        {dayjs(t.createdAt).format('hh:mm A')}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-surface-950 border border-surface-800 flex items-center justify-center">
                                                <Truck className="w-3.5 h-3.5 text-surface-600" />
                                            </div>
                                            <div>
                                                <div className="font-mono font-black text-white text-xs uppercase">{vehicle?.number || 'N/A'}</div>
                                                <div className="text-[9px] font-bold text-brand-400 uppercase tracking-widest">{t.trips} </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] font-bold text-surface-500 uppercase tracking-widest mb-0.5">Material</div>
                                            <div className="text-[10px] font-black text-white uppercase">{soilTypes.find(s => s.id === t.soilTypeId)?.name || 'Generic'}</div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-surface-800/60 flex items-center gap-2 text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                                        <MapPin className="w-3 h-3 text-brand-500" />
                                        <span className="text-white">{t.source || 'MINE'}</span>
                                        <span className="text-surface-600 font-black">&rarr;</span>
                                        <span className="text-white">{t.destination || 'SITE'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
