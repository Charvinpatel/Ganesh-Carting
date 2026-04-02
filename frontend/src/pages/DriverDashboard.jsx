import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, CheckCircle, Clock, Truck, MapPin, Trash2, Calendar, LayoutGrid, RotateCw } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Select, DatePicker, Modal as AntModal } from 'antd';
import dayjs from 'dayjs';

const getToday = () => dayjs().format('YYYY-MM-DD');
const makeEmptyForm = () => ({ date: getToday(), vehicleId: '', soilTypeId: '', source: '', destination: '', trips: 1, notes: '' });

export default function DriverDashboard() {
  const user = useStore(state => state.user);
  const driverTrips = useStore(state => state.driverTrips);
  const addDriverTrip = useStore(state => state.addDriverTrip);
  const deleteDriverTrip = useStore(state => state.deleteDriverTrip);
  const vehicles = useStore(state => state.vehicles);
  const soilTypes = useStore(state => state.soilTypes);
  const locations = useStore(state => state.locations);
  const contentLoading = useStore(state => state.contentLoading);
  const refreshData = useStore(state => state.refreshData);
  const today = getToday(); // recomputed fresh on every render/mount
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(() => makeEmptyForm());
  const [isSaving, setIsSaving] = useState(false);
  
  // Filter trips for this driver for TODAY only
  const todayTrips = useMemo(() =>
    driverTrips
      .filter(t => t.date === today)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  , [driverTrips, today]);

  const totalTodayTripsCount = todayTrips.reduce((s, t) => s + (t.trips || 1), 0);

  const totalTripsCount = todayTrips.reduce((s, t) => s + (t.trips || 1), 0);

  const save = async () => {
    if (!form.vehicleId) return toast.error('Please select vehicle');
    if (!form.soilTypeId) return toast.error('Please select soil type');
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
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">DRIVER PANEL</h1>
          <p className="text-surface-500 text-[10px] font-bold uppercase tracking-widest mt-1">Hello, {user?.name || 'Partner'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refreshData()} 
            disabled={contentLoading} 
            className={`w-10 h-10 bg-surface-900 border border-surface-800 rounded-xl flex items-center justify-center transition-all active:scale-90 ${contentLoading ? 'opacity-50' : 'hover:bg-surface-800'}`}
          >
            <RotateCw className={`w-5 h-5 text-surface-400 ${contentLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20 shadow-glow shadow-brand-500/5">
            <Truck className="w-6 h-6 text-brand-500" />
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <button 
        onClick={() => setModal(true)}
        className="w-full py-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-brand-500/30 transition-all active:scale-95 uppercase tracking-widest"
      >
        <Plus className="w-7 h-7" />
        LOG NEW TRIP
      </button>

      {/* Today's Context Card */}
      <div className="stat-card border-brand-500/20 bg-brand-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" />
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Today's Overview</span>
          </div>
          <span className="text-[10px] font-black text-white uppercase bg-surface-950/80 px-3 py-1 rounded-lg border border-surface-800">
            {formatDate(today)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-950/50 p-4 rounded-xl border border-surface-800 whitespace-nowrap overflow-hidden">
            <div className="text-surface-500 text-[10px] uppercase font-black tracking-tighter mb-1 truncate">Today's Total Trips</div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalTripsCount}</div>
          </div>
          <div className="bg-surface-950/50 p-4 rounded-xl border border-surface-800 flex flex-col justify-center whitespace-nowrap overflow-hidden">
            <div className="text-surface-500 text-[10px] uppercase font-black tracking-tighter mb-1 truncate">Account Status</div>
            <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs uppercase">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> <span className="truncate">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Trip Log List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5 text-surface-600" />
            <h2 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">Latest Logs</h2>
            </div>
        </div>

        {todayTrips.length === 0 ? (
          <div className="card p-12 text-center border-dashed border-2 border-surface-800 bg-transparent flex flex-col items-center">
            <Clock className="w-12 h-12 text-surface-700 mb-4" />
            <p className="text-surface-500 text-xs font-black uppercase tracking-widest leading-relaxed">No trips logged<br/>for today yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTrips.map(t => {
              const vehicle = vehicles.find(v => v.id === t.vehicleId);
              const isVerified = t.status === 'verified';
              const isRejected = t.status === 'rejected';
              const isPending = !isVerified && !isRejected;

              return (
                <div key={t.id} className="stat-card group transition-all !p-4 !bg-surface-900 overflow-hidden relative">
                    {/* Status Accent Bar */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${isVerified ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                    
                    <div className="flex justify-between items-center mb-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isVerified ? 'text-emerald-500' : isRejected ? 'text-red-500' : 'text-amber-500'}`}>
                                {t.status}
                            </span>
                            <span className="text-[10px] font-mono text-surface-600 font-bold ml-1">{dayjs(t.createdAt).format('hh:mm A')}</span>
                        </div>
                        {isPending && (
                            <button onClick={() => del(t.id)} className="text-surface-600 hover:text-red-500 transition-colors bg-surface-950 p-2 rounded-xl border border-surface-800">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-center">
                                    <Truck className="w-5 h-5 text-surface-500" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-mono font-black text-white text-sm tracking-tighter uppercase truncate">{vehicle?.number || t.vehicle?.number || 'N/A'}</div>
                                    <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{t.trips} ROUND TRIPS</div>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-0.5">Material</div>
                                <div className="text-xs font-black text-white uppercase">{soilTypes.find(s => s.id === t.soilTypeId)?.name || 'Generic Soil'}</div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-surface-800 flex items-center gap-2 text-[11px] font-bold text-surface-400 uppercase tracking-tight">
                            <MapPin className="w-3.5 h-3.5 text-brand-500" />
                            <span className="text-white">{t.source || 'MINE'}</span>
                            <span className="text-surface-600 font-black">&rarr;</span>
                            <span className="text-white">{t.destination || 'SITE'}</span>
                        </div>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for New Trip Entry */}
      <Modal open={modal} onClose={() => setModal(false)} title="LOG DAILY TRIP" size="md">
        <div className="space-y-6 pt-2">
          <div>
            <label className="label">Assigned Vehicle *</label>
            <Select
              className="w-full h-12"
              placeholder="-- CHOOSE FROM FLEET --"
              value={form.vehicleId || undefined}
              onChange={val => setForm({...form, vehicleId: val})}
              options={vehicles.map(v => ({ label: `${v.number} (${v.type})`, value: v.id }))}
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <DatePicker 
                className="w-full h-12"
                value={dayjs(form.date)}
                onChange={(date) => setForm({...form, date: date ? date.format('YYYY-MM-DD') : getToday()})}
                allowClear={false}
              />
            </div>
            <div>
              <label className="label">Soil Type *</label>
              <Select
                className="w-full h-12"
                placeholder="--- SELECT SOIL ---"
                value={form.soilTypeId || undefined}
                onChange={val => setForm({...form, soilTypeId: val})}
                options={soilTypes.map(s => ({ label: s.name, value: s.id }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Trips Count</label>
              <input type="number" className="input-field !py-4 font-black text-lg" value={form.trips} min={1} onChange={e => setForm({...form, trips: parseInt(e.target.value) || 1})} />
            </div>
            <div>
              {/* Optional space or more fields */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="label">Unloading Destination *</label>
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
            <label className="label">Operational Notes (Optional)</label>
            <textarea className="input-field" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. Breakdown, Delay at site, Weather issues..." />
          </div>

          <div className="pt-4 space-y-3">
            <button 
                disabled={isSaving}
                onClick={save}
                className="w-full py-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-brand-500/30 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
            >
                {isSaving ? 'UPLOADING...' : 'SAVE TRIP ENTRY'}
            </button>
            <button className="w-full py-4 text-surface-500 font-bold text-xs uppercase tracking-widest" onClick={() => setModal(false)}>Discard Log</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
