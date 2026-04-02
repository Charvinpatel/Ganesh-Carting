import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { History, Calendar, Truck, MapPin, LayoutGrid, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { DatePicker, Button, Radio } from 'antd';
import dayjs from 'dayjs';

export default function TripsHistory() {
  const driverTrips = useStore(state => state.driverTrips);
  const vehicles = useStore(state => state.vehicles);
  const fetchDriverTrips = useStore(state => state.fetchDriverTrips);
  const contentLoading = useStore(state => state.contentLoading);
  
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  const [filterType, setFilterType] = useState('today'); // 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState(today);

  const activeFilterDate = useMemo(() => {
    if (filterType === 'today') return today;
    if (filterType === 'yesterday') return yesterday;
    return customDate;
  }, [filterType, customDate, today, yesterday]);

  // Fetch data whenever the filter date changes
  useEffect(() => {
    fetchDriverTrips({ date: activeFilterDate });
  }, [activeFilterDate, fetchDriverTrips]);

  const filteredTrips = useMemo(() => {
    return driverTrips
      .filter(t => t.date === activeFilterDate)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [driverTrips, activeFilterDate]);

  const totalTrips = filteredTrips.reduce((s, t) => s + (t.trips || 1), 0);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">TRIP HISTORY</h1>
          <p className="text-surface-500 text-[10px] font-bold uppercase tracking-widest mt-1">Review your past performance</p>
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-glow shadow-blue-500/5">
          <History className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card p-4 space-y-4 border-surface-800 bg-surface-900/50">
        <div className="flex items-center gap-2 mb-2">
            <Search className="w-3.5 h-3.5 text-surface-500" />
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Filter Records</span>
        </div>
        
        <div className="flex flex-col gap-3">
            <Radio.Group 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="flex w-full"
                buttonStyle="solid"
            >
                <Radio.Button value="today" className="flex-1 text-center font-bold">TODAY</Radio.Button>
                <Radio.Button value="yesterday" className="flex-1 text-center font-bold">YESTERDAY</Radio.Button>
                <Radio.Button value="custom" className="flex-1 text-center font-bold font-mono uppercase tracking-tighter flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3 inline pb-0.5" /> DATE
                </Radio.Button>
            </Radio.Group>

            {filterType === 'custom' && (
                <div className="animate-fade-in">
                    <DatePicker 
                        className="w-full h-12 !bg-surface-950 !border-surface-800"
                        value={dayjs(customDate)}
                        onChange={(date) => setCustomDate(date ? date.format('YYYY-MM-DD') : today)}
                        allowClear={false}
                    />
                </div>
            )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-surface-600" />
          <h2 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">
            {filterType === 'today' ? 'Today' : filterType === 'yesterday' ? 'Yesterday' : activeFilterDate} Records
          </h2>
        </div>
        <div className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          {totalTrips} Trips Total
        </div>
      </div>

      {/* Trip List */}
      <div className="space-y-3 min-h-[200px] relative">
        {contentLoading && (
          <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Fetching Records...</div>
            </div>
          </div>
        )}

        {filteredTrips.length === 0 && !contentLoading ? (
          <div className="card p-12 text-center border-dashed border-2 border-surface-800 bg-transparent flex flex-col items-center opacity-50">
            <Search className="w-12 h-12 text-surface-700 mb-4" />
            <p className="text-surface-500 text-xs font-black uppercase tracking-widest leading-relaxed">No records found<br/>for this date</p>
          </div>
        ) : (
          filteredTrips.map(t => {
            const vehicle = vehicles.find(v => v.id === t.vehicleId);
            const isVerified = t.status === 'verified';
            const isRejected = t.status === 'rejected';

            return (
              <div key={t.id} className="stat-card group transition-all !p-4 !bg-surface-900 border-surface-800/60 overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-1 h-full ${isVerified ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-500'}`} />
                  
                  <div className="flex justify-between items-center mb-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isRejected ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isVerified ? 'text-emerald-500' : isRejected ? 'text-red-500' : 'text-amber-500'}`}>
                              {t.status}
                          </span>
                      </div>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                      <div className="space-y-2">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-center">
                                  <Truck className="w-5 h-5 text-surface-500" />
                              </div>
                              <div>
                                  <div className="font-mono font-black text-white text-sm sm:text-base tracking-tighter uppercase">{vehicle?.number || t.vehicle?.number || 'N/A'}</div>
                                  <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{t.trips} ROUND TRIPS</div>
                              </div>
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5 text-[10px] sm:text-[11px] font-black text-white uppercase tracking-tight mb-0.5">
                              <MapPin className="w-3 h-3 text-surface-500" />
                              {t.source || 'MINE'}
                          </div>
                          <div className="text-[11px] sm:text-[12px] font-black text-surface-600 uppercase tracking-tight">TO {t.destination || 'SITE'}</div>
                      </div>
                  </div>
                  
                  {t.notes && (
                    <div className="mt-4 pt-3 border-t border-surface-800 text-[10px] text-surface-400 italic">
                        Note: {t.notes}
                    </div>
                  )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
