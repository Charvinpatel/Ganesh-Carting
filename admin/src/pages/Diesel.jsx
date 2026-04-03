import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Edit2, Trash2, Fuel, Filter, MapPin } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Select, DatePicker, Modal as AntModal } from 'antd';
import dayjs from 'dayjs';

const today = new Date().toISOString().split('T')[0];
const emptyForm = { date: today, vehicleId: '', driverId: '', amount: '', pumpName: '', pumpLocation: '' };

export default function Diesel() {
  const diesel = useStore(state => state.diesel);
  const dieselMeta = useStore(state => state.dieselMeta);
  const fetchDiesel = useStore(state => state.fetchDiesel);
  const addDiesel = useStore(state => state.addDiesel);
  const updateDiesel = useStore(state => state.updateDiesel);
  const deleteDiesel = useStore(state => state.deleteDiesel);
  const drivers = useStore(state => state.drivers);
  const fetchDrivers = useStore(state => state.fetchDrivers);
  const vehicles = useStore(state => state.vehicles);
  const fetchVehicles = useStore(state => state.fetchVehicles);
  const loading = useStore(state => state.loading);

  useEffect(() => {
    if (drivers.length === 0) fetchDrivers({ limit: 1000 });
    if (vehicles.length === 0) fetchVehicles({ limit: 1000 });
  }, [drivers.length, vehicles.length, fetchDrivers, fetchVehicles]);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  
  const [filters, setFilters] = useState({ 
    date: '', 
    vehicleId: '',
    page: 1,
    limit: 10
  });

  const loadData = useCallback(() => {
    fetchDiesel(filters);
  }, [filters, fetchDiesel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const open = (d = null) => {
    setEditing(d);
    setForm(d ? { ...d, vehicleId: d.vehicleId || d.vehicle?._id, driverId: d.driverId || d.driver?._id } : { ...emptyForm });
    setModal(true);
  };

  const handleVehicleChange = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const driverId = vehicle?.assignedDriver || '';
    setForm(f => ({ ...f, vehicleId, driverId }));
  };

  const save = async () => {
    if (!form.vehicleId || !form.amount) return toast.error('Fill vehicle and amount');
    try {
      const amt = parseFloat(form.amount);
      editing ? await updateDiesel(editing.id, { ...form, amount: amt }) : await addDiesel({ ...form, amount: amt });
      setModal(false);
      loadData();
      toast.success(editing ? 'Diesel entry updated' : 'Diesel recorded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const del = (id) => {
    AntModal.confirm({
      title: 'Delete Diesel Entry?',
      content: 'Are you sure you want to delete this diesel purchase record?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteDiesel(id);
          loadData();
          toast.success('Entry deleted');
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  };

  // On the fly summary for the current view
  const totalCost = diesel.reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title text-amber-500">DIESEL LOGS</h1>
          <p className="text-surface-500 text-sm mt-1">{dieselMeta.total} entries recorded</p>
        </div>
        <button className="btn-primary bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" onClick={() => open()}>
          <Plus className="w-5 h-5" /> Log Fuel
        </button>
      </div>

      {/* Stats and Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-amber-500/20 bg-amber-500/5">
            <span className="label !mb-0 text-amber-500">Session Total Spend</span>
            <span className="text-3xl font-black text-amber-500">{formatCurrency(totalCost)}</span>
            <p className="text-[10px] text-surface-500 uppercase font-bold tracking-widest mt-1">Showing {diesel.length} entries</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-surface-300 uppercase tracking-widest">Filter Entries</span>
          <button 
            className="ml-auto text-[10px] uppercase font-bold text-amber-500 hover:text-amber-400 transition-colors"
            onClick={() => setFilters({ date: '', vehicleId: '', page: 1, limit: 10 })}
          >
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="label">Fueling Date</label>
            <DatePicker 
              className="w-full"
              value={filters.date ? dayjs(filters.date) : null}
              onChange={(date) => setFilters({...filters, date: date ? date.format('YYYY-MM-DD') : '', page: 1})}
            />
          </div>
          <div>
            <label className="label">Filter by Vehicle</label>
            <Select
              className="w-full"
              placeholder="All Fleet"
              value={filters.vehicleId || undefined}
              onChange={val => setFilters({...filters, vehicleId: val || '', page: 1})}
              allowClear
              showSearch
              options={vehicles.map(v => ({ label: v.number, value: v.id }))}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr className="whitespace-nowrap">
              <th>Date</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Pump Details</th>
              <th className="text-right">Amount</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {diesel.map(d => (
              <tr key={d.id}>
                <td className="font-mono text-xs text-surface-500 whitespace-nowrap">{formatDate(d.date)}</td>
                <td className="font-mono font-bold text-white uppercase text-sm whitespace-nowrap">{d.vehicle?.number || 'N/A'}</td>
                <td className="font-medium whitespace-nowrap">{d.driver?.name || <span className="text-surface-600 italic font-bold">Self</span>}</td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-surface-200 uppercase text-xs">{d.pumpName || 'Unknown Pump'}</span>
                  </div>
                  {d.pumpLocation && (
                    <div className="flex items-center gap-1 text-[10px] text-surface-500 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="uppercase tracking-tighter">{d.pumpLocation}</span>
                    </div>
                  )}
                </td>
                <td className="text-right font-black text-amber-500 text-lg whitespace-nowrap">{formatCurrency(d.amount)}</td>
                <td className="text-center">
                  <div className="inline-flex gap-2">
                    <button className="text-surface-500 hover:text-brand-500 transition-colors p-2" onClick={() => open(d)}><Edit2 className="w-4 h-4" /></button>
                    <button className="text-surface-500 hover:text-red-500 transition-colors p-2" onClick={() => del(d.id)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {diesel.length === 0 && !loading && (
              <tr><td colSpan={10} className="text-center py-20 text-surface-600 italic font-medium uppercase tracking-widest">No diesel logs for the selected criteria</td></tr>
            )}
          </tbody>
        </table>

        <Pagination 
          page={filters.page} 
          totalPages={dieselMeta.totalPages} 
          total={dieselMeta.total} 
          onPageChange={p => setFilters({ ...filters, page: p })}
          limit={filters.limit}
        />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Update Fuel Log' : 'Record Fuel Purchase'} size="md">
        <div className="space-y-6 px-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="label">Purchase Date *</label>
                <DatePicker 
                  className="w-full h-10"
                  value={form.date ? dayjs(form.date) : null}
                  onChange={(date) => setForm({...form, date: date ? date.format('YYYY-MM-DD') : today})}
                  allowClear={false}
                />
            </div>
            <div>
                <label className="label">Total Amount (₹) *</label>
                <input type="number" className="input-field !text-amber-500 font-bold" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="e.g. 5000" />
            </div>
          </div>
          <div>
            <label className="label">Vehicle *</label>
            <Select
              className="w-full h-10"
              placeholder="-- Choose Asset --"
              value={form.vehicleId || undefined}
              onChange={val => handleVehicleChange(val)}
              options={vehicles.map(v => ({ label: `${v.number} (${v.type})`, value: v.id }))}
              showSearch
            />
          </div>
          <div>
            <label className="label">Driver</label>
            <Select
              className="w-full h-10"
              placeholder="-- Select Driver (Optional) --"
              value={form.driverId || undefined}
              onChange={val => setForm({...form, driverId: val})}
              options={drivers.map(d => ({ label: d.name, value: d.id }))}
              showSearch
              allowClear
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="label">Pump / Station Name</label>
                <input className="input-field" value={form.pumpName} onChange={e => setForm({...form, pumpName: e.target.value})} placeholder="e.g. Reliance, Shell" />
            </div>
            <div>
                <label className="label">Station Location</label>
                <input className="input-field" value={form.pumpLocation} onChange={e => setForm({...form, pumpLocation: e.target.value})} placeholder="e.g. Highway NH8" />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button className="btn-primary bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 flex-1 py-4 text-base" onClick={save}>
              {editing ? 'Confirm Changes' : 'Log Fuel Purchase'}
            </button>
            <button className="btn-secondary px-8" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
