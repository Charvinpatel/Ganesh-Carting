import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Edit2, Trash2, Filter, UserCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Select, DatePicker, Modal as AntModal } from 'antd';
import dayjs from 'dayjs';

const today = new Date().toISOString().split('T')[0];
const emptyForm = { 
  date: today, 
  driverId: '', 
  vehicleId: '', 
  soilTypeId: '', 
  source: '', 
  destination: '', 
  trips: 1, 
  notes: '', 
  buyPrice: 0, 
  sellPrice: 0 
};

export default function Trips() {
  const trips = useStore(state => state.trips);
  const tripsMeta = useStore(state => state.tripsMeta);
  const tripsSummary = useStore(state => state.tripsSummary);
  const fetchTrips = useStore(state => state.fetchTrips);
  const addTrip = useStore(state => state.addTrip);
  const updateTrip = useStore(state => state.updateTrip);
  const deleteTrip = useStore(state => state.deleteTrip);
  const drivers = useStore(state => state.drivers);
  const fetchDrivers = useStore(state => state.fetchDrivers);
  const vehicles = useStore(state => state.vehicles);
  const fetchVehicles = useStore(state => state.fetchVehicles);
  const soilTypes = useStore(state => state.soilTypes);
  const locations = useStore(state => state.locations);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  
  // Local filter state
  const [filters, setFilters] = useState({ 
    date: '', 
    vehicleId: '', 
    driverId: '', 
    soilTypeId: '',
    page: 1,
    limit: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(() => {
    fetchTrips(filters);
  }, [filters, fetchTrips]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ensure drivers & vehicles are loaded for filter dropdowns
  useEffect(() => {
    if (drivers.length === 0) fetchDrivers({ limit: 200 });
    if (vehicles.length === 0) fetchVehicles({ limit: 200 });
  }, []);

  const open = (t = null) => {
    setEditing(t);
    if (t) {
      setForm({
        ...t,
        driverId: t.driverId || t.driver?._id,
        vehicleId: t.vehicleId || t.vehicle?._id,
        soilTypeId: t.soilTypeId || t.soilType?._id
      });
    } else {
      setForm({ ...emptyForm });
    }
    setModal(true);
  };

  const handleSoilChange = (soilId) => {
    const soil = soilTypes.find(s => s.id === soilId);
    setForm(f => ({ ...f, soilTypeId: soilId, buyPrice: soil?.buyPrice || 0, sellPrice: soil?.sellPrice || 0 }));
  };

  const save = async () => {
    if (!form.driverId || !form.vehicleId || !form.soilTypeId) return toast.error('Please fill all required fields');
    setIsSubmitting(true);
    try {
      editing ? await updateTrip(editing.id, form) : await addTrip(form);
      setModal(false);
      loadData();
      toast.success(editing ? 'Trip updated' : 'Trip recorded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
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
          await deleteTrip(id);
          loadData();
          toast.success('Trip deleted');
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title text-brand-500">TRIPS</h1>
          <p className="text-surface-500 text-sm mt-1">{tripsMeta.total} records found</p>
        </div>
        <button className="btn-primary" onClick={() => open()}>
          <Plus className="w-5 h-5" /> Add Trip
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="label !mb-0">Total Trips</span>
          <span className="text-3xl font-black text-white">{tripsSummary.trips}</span>
        </div>
        <div className="stat-card">
          <span className="label !mb-0 text-blue-400">Total Revenue</span>
          <span className="text-3xl font-black text-blue-400">{formatCurrency(tripsSummary.revenue)}</span>
        </div>
        <div className="stat-card">
          <span className="label !mb-0 text-emerald-400">Net Profit</span>
          <span className="text-3xl font-black text-emerald-400">{formatCurrency(tripsSummary.profit)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-brand-500" />
          <span className="text-xs font-bold text-surface-300 uppercase tracking-widest">Advanced Filters</span>
          <button 
            className="ml-auto text-[10px] uppercase font-bold text-brand-500 hover:text-brand-400 transition-colors"
            onClick={() => setFilters({ date: '', vehicleId: '', driverId: '', soilTypeId: '', page: 1, limit: 10 })}
          >
            Reset All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Date</label>
            <DatePicker 
              className="w-full"
              value={filters.date ? dayjs(filters.date) : null}
              onChange={(date) => setFilters({...filters, date: date ? date.format('YYYY-MM-DD') : '', page: 1})}
            />
          </div>
          <div>
            <label className="label">Vehicle</label>
            <Select
              className="w-full"
              placeholder="All Vehicles"
              value={filters.vehicleId || undefined}
              onChange={val => setFilters({...filters, vehicleId: val || '', page: 1})}
              allowClear
              showSearch
              options={vehicles.map(v => ({ label: v.number, value: v.id }))}
            />
          </div>
          <div>
            <label className="label">Driver</label>
            <Select
              className="w-full"
              placeholder="All Drivers"
              value={filters.driverId || undefined}
              onChange={val => setFilters({...filters, driverId: val || '', page: 1})}
              allowClear
              showSearch
              options={drivers.map(d => ({ label: d.name, value: d.id }))}
            />
          </div>
          <div>
            <label className="label">Soil Type</label>
            <Select
              className="w-full"
              placeholder="All Soils"
              value={filters.soilTypeId || undefined}
              onChange={val => setFilters({...filters, soilTypeId: val || '', page: 1})}
              allowClear
              showSearch
              options={soilTypes.map(s => ({ label: s.name, value: s.id }))}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Date</th>
              <th className="whitespace-nowrap">Driver / Vehicle</th>
              <th className="whitespace-nowrap">Soil</th>
              <th className="whitespace-nowrap">Route</th>
              <th className="text-right whitespace-nowrap">Trips</th>
              <th className="text-right whitespace-nowrap">Profit</th>
              <th className="text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id}>
                <td className="font-mono text-xs text-surface-400 whitespace-nowrap">{formatDate(t.date)}</td>
                <td className="whitespace-nowrap">
                  <div className="font-bold text-white uppercase">{t.driver?.name || 'N/A'}</div>
                  <div className="text-[10px] font-mono text-surface-500 uppercase tracking-tighter">{t.vehicle?.number || 'N/A'}</div>
                </td>
                <td className="whitespace-nowrap">
                  <span className="badge badge-mixed">{t.soilType?.name || 'N/A'}</span>
                </td>
                <td className="text-[11px] text-surface-400 whitespace-nowrap">
                  <div className="uppercase tracking-tight inline-block">{t.source}</div>
                  <span className="text-surface-600 mx-1">→</span>
                  <div className="text-surface-600 inline-block uppercase tracking-tight">{t.destination}</div>
                </td>
                <td className="text-right font-black text-white text-lg">{t.trips}</td>
                <td className="text-right font-bold text-emerald-400">{formatCurrency((t.sellPrice - t.buyPrice) * t.trips)}</td>
                <td className="text-center">
                  <div className="inline-flex gap-2">
                    <button className="text-surface-500 hover:text-brand-500 transition-colors p-2" onClick={() => open(t)}><Edit2 className="w-4 h-4" /></button>
                    <button className="text-surface-500 hover:text-red-500 transition-colors p-2" onClick={() => del(t.id)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr><td colSpan={10} className="text-center py-20 text-surface-600 italic font-medium uppercase tracking-widest">No trip logs match your filters</td></tr>
            )}
          </tbody>
        </table>

        <Pagination 
          page={filters.page} 
          totalPages={tripsMeta.totalPages} 
          total={tripsMeta.total} 
          onPageChange={p => setFilters({ ...filters, page: p })}
          limit={filters.limit}
        />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Update Trip Log' : 'Record New Trip'} size="lg">
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="label">Trip Date *</label>
                <DatePicker 
                  className="w-full h-10"
                  value={form.date ? dayjs(form.date) : null}
                  onChange={(date) => setForm({...form, date: date ? date.format('YYYY-MM-DD') : today})}
                  allowClear={false}
                />
            </div>
            <div>
                <label className="label">Total Trips *</label>
                <input type="number" className="input-field" value={form.trips} min={1} onChange={e => setForm({...form, trips: parseInt(e.target.value) || 1})} />
            </div>
            <div>
                <label className="label">Driver *</label>
                <Select
                  className="w-full h-10"
                  placeholder="-- Choose Driver --"
                  value={form.driverId || undefined}
                  onChange={val => setForm({...form, driverId: val})}
                  options={drivers.map(d => ({ label: d.name, value: d.id }))}
                  showSearch
                />
            </div>
            <div>
                <label className="label">Vehicle *</label>
                <Select
                  className="w-full h-10"
                  placeholder="-- Choose Vehicle --"
                  value={form.vehicleId || undefined}
                  onChange={val => setForm({...form, vehicleId: val})}
                  options={vehicles.map(v => ({ label: `${v.number} (${v.type})`, value: v.id }))}
                  showSearch
                />
            </div>
            <div className="sm:col-span-2">
                <label className="label">Soil Type *</label>
                <Select
                  className="w-full h-10"
                  placeholder="-- Choose Soil --"
                  value={form.soilTypeId || undefined}
                  onChange={val => handleSoilChange(val)}
                  options={soilTypes.map(s => ({ label: s.name, value: s.id }))}
                  showSearch
                />
            </div>
            <div>
                <label className="label">Buy Cost (Total/Avg)</label>
                <input type="number" className="input-field" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
                <label className="label">Sell Price (Total/Avg)</label>
                <input type="number" className="input-field" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
                <label className="label">Departure Source</label>
                <Select
                  className="w-full h-10"
                  placeholder="-- Source --"
                  value={form.source || undefined}
                  onChange={val => setForm({...form, source: val})}
                  options={locations.filter(l => l.type === 'source').map(l => ({ label: l.name, value: l.name }))}
                  showSearch
                />
            </div>
            <div>
                <label className="label">Arrival Destination</label>
                <Select
                  className="w-full h-10"
                  placeholder="-- Destination --"
                  value={form.destination || undefined}
                  onChange={val => setForm({...form, destination: val})}
                  options={locations.filter(l => l.type === 'destination').map(l => ({ label: l.name, value: l.name }))}
                  showSearch
                />
            </div>
            </div>

            {form.trips > 0 && (
                <div className="bg-brand-500/10 rounded-2xl p-5 border border-brand-500/20">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Calculated Trip Margin</span>
                        <span className={`text-xl font-black ${form.sellPrice > form.buyPrice ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatCurrency((form.sellPrice - form.buyPrice) * form.trips)}
                        </span>
                    </div>
                    <div className="h-1 bg-surface-800 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-brand-500 w-[60%] opacity-50"></div>
                    </div>
                </div>
            )}
            
            <div className="flex gap-3 pt-2">
                <button disabled={isSubmitting} className="btn-primary flex-1 py-4 text-base disabled:opacity-50" onClick={save}>
                    {editing ? (isSubmitting ? 'Updating...' : 'Update Trip Record') : (isSubmitting ? 'Saving...' : 'Log Trip Entry')}
                </button>
                <button className="btn-secondary px-8" onClick={() => setModal(false)}>Cancel</button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
