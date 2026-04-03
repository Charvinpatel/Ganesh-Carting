import { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { RefreshCw, Filter, Truck, MapPin, ThumbsUp, ThumbsDown, Link as LinkIcon, AlertCircle, LayoutGrid, Clock, Search, Calendar, User } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

export default function VerifyTrips() {
  const driverTrips = useStore(state => state.driverTrips);
  const trips = useStore(state => state.trips);
  const fetchDriverTrips = useStore(state => state.fetchDriverTrips);
  const fetchTrips = useStore(state => state.fetchTrips);
  const verifyDriverTrip = useStore(state => state.verifyDriverTrip);
  const drivers = useStore(state => state.drivers);
  const fetchDrivers = useStore(state => state.fetchDrivers);
  const vehicles = useStore(state => state.vehicles);
  const fetchVehicles = useStore(state => state.fetchVehicles);
  const soilTypes = useStore(state => state.soilTypes);
  const fetchSoilTypes = useStore(state => state.fetchSoilTypes);
  const locations = useStore(state => state.locations);
  const fetchLocations = useStore(state => state.fetchLocations);
  const contentLoading = useStore(state => state.contentLoading);
  
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ 
    vehicleId: '',
    soilTypeId: '',
    destination: '',
    driverId: '',
  });
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [matchingTripId, setMatchingTripId] = useState('');
  const [note, setNote] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { 
        vehicleId: filter.vehicleId,
        soilTypeId: filter.soilTypeId,
        destination: filter.destination,
        driverId: filter.driverId,
      };
      
      
      const promises = [
        fetchDriverTrips(filters),
        drivers.length === 0 ? fetchDrivers({ limit: 500 }) : Promise.resolve(),
        vehicles.length === 0 ? fetchVehicles({ limit: 500 }) : Promise.resolve(),
        soilTypes.length === 0 ? fetchSoilTypes() : Promise.resolve(),
        locations.length === 0 ? fetchLocations({ limit: 1000 }) : Promise.resolve(),
      ];
      
      if (trips.length === 0) {
        promises.push(fetchTrips({ limit: 1000 }));
      }

      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  }, [filter, fetchDriverTrips, fetchTrips, fetchDrivers, fetchVehicles, fetchSoilTypes, fetchLocations, drivers.length, vehicles.length, soilTypes.length, locations.length, trips.length]);

  useEffect(() => {
    // Only load data if filter is stable to avoid multiple quick calls
    const timeout = setTimeout(() => {
      loadData();
    }, 100);
    return () => clearTimeout(timeout);
  }, [loadData]);

  // Group trips by date locally for the "My Trips" look
  const groupedTrips = useMemo(() => {
    const groups = {};
    driverTrips.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.fromEntries(Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])));
  }, [driverTrips]);

  const stats = useMemo(() => ({
    rounds: driverTrips.reduce((s, t) => s + (t.trips || 0), 0)
  }), [driverTrips]);

  const potentialMatches = useMemo(() => {
    if (!selectedTrip) return [];
    return trips.filter(t => 
      t.date === selectedTrip.date && 
      t.driverId === selectedTrip.driverId &&
      t.vehicleId === selectedTrip.vehicleId
    );
  }, [selectedTrip, trips]);

  const handleVerify = async (id, status) => {
    await verifyDriverTrip(id, { 
      status, 
      systemTripId: matchingTripId || undefined,
      notes: note 
    });
    setSelectedTrip(null);
    setMatchingTripId('');
    setNote('');
  };

  const openVerifyModal = (trip) => {
    setSelectedTrip(trip);
    const matches = trips.filter(t => 
      t.date === trip.date && 
      t.driverId === trip.driverId &&
      t.vehicleId === trip.vehicleId
    );
    if (matches.length === 1) setMatchingTripId(matches[0].id);
    else setMatchingTripId('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-brand-400 uppercase tracking-tighter">DRIVER SUBMISSIONS</h1>
          <p className="text-surface-500 text-[10px] font-bold uppercase tracking-widest mt-1">Verify and match daily rounds</p>
        </div>
        <button 
          onClick={loadData} 
          disabled={loading}
          className="w-10 h-10 bg-surface-900 border border-surface-800 rounded-xl flex items-center justify-center transition-all active:scale-90"
        >
          <RefreshCw className={`w-5 h-5 text-surface-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Summary - Matching My Trips Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="stat-card !p-5 !bg-brand-500/5 border-brand-500/20">
            <div className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1">Total Trips Counter</div>
            <div className="text-3xl font-black text-white">{stats.rounds} </div>
         </div>
      </div>

      {/* Primary Filters - Styled to match Driver Panel */}
      <div className="card p-4 border-surface-800 bg-surface-900/50 space-y-4">
          <div className="flex items-center gap-2 mb-1">
              <Search className="w-3.5 h-3.5 text-surface-500" />
              <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Filter Records</span>
              <button 
                className="ml-auto text-[10px] uppercase font-bold text-brand-400 hover:text-brand-300 transition-colors"
                onClick={() => setFilter({ vehicleId: '', soilTypeId: '', destination: '', driverId: '' })}
              >
                Reset Filters
              </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest ml-1">Driver</label>
                <Select
                  className="w-full h-11"
                  placeholder="DRIVER"
                  value={filter.driverId || undefined}
                  onChange={val => setFilter({...filter, driverId: val || ''})}
                  options={drivers.map(d => ({ label: d.name, value: d.id }))}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest ml-1">Vehicle</label>
                <Select
                  className="w-full h-11"
                  placeholder="FLEET"
                  value={filter.vehicleId || undefined}
                  onChange={val => {
                    setFilter({...filter, vehicleId: val || ''});
                  }}
                  options={vehicles.map(v => ({ label: v.number, value: v.id }))}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  filterSort={(optionA, optionB) => (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest ml-1">Soil Type</label>
                <Select
                  className="w-full h-11"
                  placeholder="MATERIAL"
                  value={filter.soilTypeId || undefined}
                  onChange={val => setFilter({...filter, soilTypeId: val || ''})}
                  options={soilTypes.map(s => ({ label: s.name, value: s.id }))}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  filterSort={(optionA, optionB) => (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest ml-1">Site</label>
                <Select
                  className="w-full h-11"
                  placeholder="SITE"
                  value={filter.destination || undefined}
                  onChange={val => setFilter({...filter, destination: val || ''})}
                  options={locations.filter(l => l.type === 'destination').map(l => ({ label: l.name, value: l.name }))}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  filterSort={(optionA, optionB) => (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())}
                />
              </div>
          </div>
      </div>

      {/* List - Grouped by Date */}
      <div className="relative mt-6 min-h-[400px]">
        {(loading || contentLoading) && (
          <div className="absolute inset-0 z-10 bg-surface-950/40 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Updating...</span>
              </div>
          </div>
        )}

        <div className={`space-y-8 transition-opacity duration-300 ${(loading || contentLoading) ? 'opacity-30' : 'opacity-100'}`}>

        {Object.keys(groupedTrips).length === 0 ? (
          <div className="card p-12 text-center border-dashed border-2 border-surface-800 bg-transparent flex flex-col items-center">
            <Clock className="w-12 h-12 text-surface-700 mb-4" />
            <p className="text-surface-500 text-xs font-black uppercase tracking-widest">No submissions found</p>
          </div>
        ) : (
          Object.entries(groupedTrips).map(([date, dailyTrips]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-surface-600" />
                  <h2 className="text-xs font-black text-surface-400 uppercase tracking-[0.2em]">{dayjs(date).format('DD MMM YYYY')}</h2>
                </div>
                <div className="h-[1px] flex-1 mx-4 bg-surface-800/50"></div>
              </div>

              <div className="space-y-2">
                {dailyTrips.map(t => {
                  const driver = drivers.find(d => d.id === t.driverId);
                  const vehicle = vehicles.find(v => v.id === t.vehicleId);
                  
                  // Debug row IDs if needed
                  // Compare using strings to avoid type mismatch
                  if (filter.vehicleId && String(t.vehicleId) !== String(filter.vehicleId)) {
                     // The backend SHOULD have filtered this, so if this triggers, there's a sync issue

                     return null; // Don't show if it doesn't match filter (fallback)
                  }

                  if (filter.soilTypeId && String(t.soilTypeId) !== String(filter.soilTypeId)) {
                     return null;
                  }
                  
                  if (filter.driverId && String(t.driverId) !== String(filter.driverId)) {
                     return null;
                  }

                  if (filter.destination && !t.destination?.toLowerCase().includes(filter.destination.toLowerCase())) {
                     return null;
                  }

                  const soil = soilTypes.find(s => s.id === t.soilTypeId);
                  const isVerified = t.status === 'verified';
                  const isRejected = t.status === 'rejected';
                  const isPending = !isVerified && !isRejected;

                  return (
                    <div key={t.id} className="stat-card !p-4 !bg-surface-900 border-surface-800 relative overflow-hidden group">
                      <div className={`absolute top-0 left-0 w-1 h-full ${isVerified ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-500'}`} />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isVerified ? 'bg-emerald-500/10 text-emerald-500' : isRejected ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {t.status}
                            </span>
                            <span className="text-[10px] font-mono text-surface-600 font-bold">{dayjs(t.createdAt).format('hh:mm A')}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-surface-400" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-white uppercase truncate">{driver?.name || 'Unknown Driver'}</div>
                                <div className="text-[10px] font-mono text-surface-500 uppercase">{vehicle?.number || 'N/A'}</div>
                              </div>
                            </div>
                            
                            <div>
                                <div className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-0.5">Material / Quantity</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white uppercase">{soil?.name || 'Generic'}</span>
                                    <span className="text-xs font-black text-brand-400 italic">{t.trips} TRIPS</span>
                                </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-surface-800/60 flex items-center gap-2 text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                            <MapPin className="w-3.5 h-3.5 text-brand-500" />
                            <span className="text-white">{t.source || 'MINE'}</span>
                            <span className="text-surface-600 font-black">&rarr;</span>
                            <span className="text-white">{t.destination || 'SITE'}</span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {isPending ? (
                            <button 
                              onClick={() => openVerifyModal(t)}
                              className="w-full md:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-500/20"
                            >
                              Verify Round
                            </button>
                          ) : (
                            <div className={`px-4 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isVerified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                              {isVerified ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                              {t.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      <Modal open={!!selectedTrip} onClose={() => setSelectedTrip(null)} title="VERIFY SUBMISSION" size="lg">
        {selectedTrip && (
          <div className="space-y-6 pt-2">
            <div className="bg-surface-900 p-4 rounded-xl border border-surface-800">
              <div className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4">Submission Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[9px] text-surface-500 uppercase font-black mb-1">Driver</div>
                  <div className="text-sm font-bold text-white">{drivers.find(d => d.id === selectedTrip.driverId)?.name}</div>
                  <div className="text-[10px] font-mono text-surface-400">{vehicles.find(v => v.id === selectedTrip.vehicleId)?.number}</div>
                </div>
                <div>
                  <div className="text-[9px] text-surface-500 uppercase font-black mb-1">Material</div>
                  <div className="text-sm font-bold text-white">{soilTypes.find(s => s.id === selectedTrip.soilTypeId)?.name}</div>
                  <div className="text-sm font-black text-brand-400">{selectedTrip.trips} TRIPS</div>
                </div>
                <div>
                  <div className="text-[9px] text-surface-500 uppercase font-black mb-1">Destination</div>
                  <div className="text-[10px] text-white font-bold tracking-tight uppercase leading-relaxed">{selectedTrip.destination}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-brand-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Link to System Trip</span>
                </div>
                <span className="text-[9px] text-surface-500 font-bold uppercase">{potentialMatches.length} Found</span>
              </div>

              {potentialMatches.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {potentialMatches.map(m => (
                    <label key={m.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${matchingTripId === m.id ? 'bg-brand-500/10 border-brand-500/30' : 'bg-surface-950 border-surface-800 hover:border-brand-500/50'}`}>
                      <input type="radio" name="matchingTrip" checked={matchingTripId === m.id} onChange={() => setMatchingTripId(m.id)} className="w-4 h-4 accent-brand-500" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-bold text-white uppercase">{m.trips} Trips by Admin</span>
                          <span className="text-[9px] font-mono text-surface-500 uppercase tracking-widest">#{m.id.slice(-4)}</span>
                        </div>
                        <div className="text-[10px] text-brand-400 font-bold uppercase mt-0.5">{m.destination}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-500">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-[10px] font-black uppercase leading-relaxed">No matching system trips found. You can still verify without a link.</p>
                </div>
              )}
            </div>

            <div>
              <label className="label !text-[10px] !font-black uppercase tracking-widest">Admin Verification Note</label>
              <textarea className="input-field" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Enter details..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => handleVerify(selectedTrip.id, 'verified')} className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                <ThumbsUp className="w-4 h-4" /> Verify Submisson
              </button>
              <button onClick={() => handleVerify(selectedTrip.id, 'rejected')} className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
