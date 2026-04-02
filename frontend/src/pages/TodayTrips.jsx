import { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Plus, CheckCircle, Clock, Truck, MapPin, Trash2, Calendar, LayoutGrid, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Select, DatePicker, Modal as AntModal } from 'antd';
import dayjs from 'dayjs';

// todayChar is computed dynamically inside the component to always reflect the current date
const getToday = () => dayjs().format('YYYY-MM-DD');
const makeEmptyForm = () => ({ date: getToday(), vehicleId: '', source: '', destination: '', trips: 1, notes: '', soilTypeId: '' });

export default function TodayTrips() {
  const { 
    user, driverTrips, fetchDriverTrips, addDriverTrip, 
    deleteDriverTrip, vehicles, locations, soilTypes,
    contentLoading: loading 
  } = useStore();

  const today = getToday(); // fresh every render/mount
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(() => makeEmptyForm());
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(() => {
    fetchDriverTrips({ date: getToday() });
  }, [fetchDriverTrips]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter ONLY today's trips (using dynamic today)
  const todayTripsList = useMemo(() =>
    driverTrips.filter(t => t.date === today)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  , [driverTrips, today]);

  const todayTotalCount = todayTripsList.reduce((s, t) => s + (t.trips || 1), 0);

  const save = async () => {
    if (!form.vehicleId) return toast.error('Please select vehicle');
    if (!form.source || !form.destination) return toast.error('Please select source and destination');
    setIsSaving(true);
    try {
      await addDriverTrip(form);
      toast.success('Trip recorded successfully');
      setModal(false);
      setForm(makeEmptyForm());
    } catch(err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const del = (id) => {
    AntModal.confirm({
      title: 'Delete Trip Record?',
      content: 'Are you sure you want to delete this trip record? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteDriverTrip(id);
          toast.success('Record deleted');
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">TODAY'S WORK</h1>
          <p className="text-surface-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <button 
          onClick={loadData} 
          disabled={loading}
          className="w-10 h-10 bg-surface-900 rounded-xl flex items-center justify-center border border-surface-800 text-surface-500 active:scale-95 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Action Area */}
      <div className="stat-card border-brand-500/20 bg-brand-500/5 !p-6 shadow-2xl shadow-brand-500/10">
        <div className="flex items-center justify-between mb-6">
           <div>
              <div className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-1">Status</div>
              <div className="flex items-center gap-1.5 text-emerald-500 font-black text-sm uppercase">
                <CheckCircle className="w-4 h-4" /> Logged In
              </div>
           </div>
           <div className="text-right">
              <div className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] mb-1">Today's Trips</div>
              <div className="text-2xl font-black text-white">{todayTotalCount}</div>
           </div>
        </div>
        
        <button 
            onClick={() => setModal(true)}
            className="w-full py-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-brand-500/30 transition-all active:scale-95 uppercase tracking-widest"
        >
            <Plus className="w-7 h-7" />
            LOG NEW TRIP
        </button>
      </div>

      {/* Today's Log List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <LayoutGrid className="w-3.5 h-3.5 text-surface-600" />
          <h2 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">Live Activity Feed</h2>
        </div>

        <div className="space-y-3">
          {todayTripsList.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-2 border-surface-800 bg-transparent flex flex-col items-center opacity-50">
                <Clock className="w-10 h-10 text-surface-700 mb-3" />
                <p className="text-surface-600 text-[10px] font-black uppercase tracking-widest">No trips logged yet today</p>
            </div>
          ) : (
            todayTripsList.map(t => {
              const vehicle = vehicles.find(v => v.id === t.vehicleId);
              const isPending = t.status === 'pending';
              const isVerified = t.status === 'verified';
              const isRejected = t.status === 'rejected';

              return (
                <div key={t.id} className="stat-card group transition-all !p-4 !bg-surface-900 overflow-hidden relative border-surface-800">
                    <div className={`absolute top-0 left-0 w-1 h-full ${isVerified ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                    
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isVerified ? 'bg-emerald-500/10 text-emerald-500' : isRejected ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {t.status}
                            </span>
                        </div>
                        {isPending && (
                            <button onClick={() => del(t.id)} className="text-surface-600 hover:text-red-500 transition-colors p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-center">
                                <Truck className="w-4 h-4 text-surface-500" />
                            </div>
                            <div>
                                <div className="font-mono font-black text-white text-sm tracking-tighter uppercase">{vehicle?.number || 'N/A'}</div>
                                <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest leading-none">{t.trips} </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-white uppercase tracking-tight mb-0.5">
                                <MapPin className="w-3 h-3 text-surface-500" />
                                {t.source || 'MINE'}
                            </div>
                            <div className="text-[10px] font-black text-surface-600 uppercase tracking-tight">TO {t.destination || 'SITE'}</div>
                        </div>
                    </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal for New Trip Entry */}
      <Modal open={modal} onClose={() => setModal(false)} title="LOG DAILY TRIP" size="md">
        <div className="space-y-5 pt-2">
          <div>
            <label className="label">Assigned Vehicle *</label>
            <Select
              className="w-full h-12"
              placeholder="-- CHOOSE FROM FLEET --"
              value={form.vehicleId || undefined}
              onChange={val => setForm({...form, vehicleId: val})}
              options={vehicles.map(v => ({ label: `${v.number} (${v.type})`, value: v.id }))}
              showSearch
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Trips Count</label>
              <input type="number" className="input-field !py-4 font-black text-lg" value={form.trips} min={1} onChange={e => setForm({...form, trips: parseInt(e.target.value) || 1})} />
            </div>
            <div>
                <label className="label">Soil Type</label>
                <Select
                    className="w-full h-12"
                    placeholder="-- TYPE --"
                    value={form.soilTypeId || undefined}
                    onChange={val => setForm({...form, soilTypeId: val})}
                    options={soilTypes.map(s => ({ label: s.name, value: s.id }))}
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Loading Source *</label>
                <Select
                    className="w-full h-12"
                    placeholder="-- FROM --"
                    value={form.source || undefined}
                    onChange={val => setForm({...form, source: val})}
                    options={locations.filter(l => l.type === 'source').map(l => ({ label: l.name, value: l.name }))}
                    showSearch
                />
            </div>
            <div>
                <label className="label">Destination *</label>
                <Select
                    className="w-full h-12"
                    placeholder="-- TO --"
                    value={form.destination || undefined}
                    onChange={val => setForm({...form, destination: val})}
                    options={locations.filter(l => l.type === 'destination').map(l => ({ label: l.name, value: l.name }))}
                    showSearch
                />
            </div>
          </div>

          <div>
            <label className="label">Quick Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional notes..." />
          </div>

          <div className="pt-4 space-y-3">
            <button 
                disabled={isSaving}
                onClick={save}
                className="w-full py-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-brand-500/30 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
            >
                {isSaving ? 'UPLOADING...' : 'CONFIRM ENTRY'}
            </button>
            <button className="w-full py-3 text-surface-500 font-bold text-[10px] uppercase tracking-widest" onClick={() => setModal(false)}>Discard Log</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
