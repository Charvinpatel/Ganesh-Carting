import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Edit2, Trash2, Phone, CreditCard, Activity, Search, Users } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Select, DatePicker, Modal as AntModal } from 'antd';
import dayjs from 'dayjs';

const empty = { name: '', phone: '', license: '', licenseExpiry: '', status: 'active' };

export default function Drivers() {
  const drivers = useStore(state => state.drivers);
  const driversMeta = useStore(state => state.driversMeta);
  const fetchDrivers = useStore(state => state.fetchDrivers);
  const addDriver = useStore(state => state.addDriver);
  const updateDriver = useStore(state => state.updateDriver);
  const deleteDriver = useStore(state => state.deleteDriver);
  const vehicles = useStore(state => state.vehicles);
  const loading = useStore(state => state.contentLoading);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12
  });

  const loadData = useCallback(() => {
    fetchDrivers(filters);
  }, [filters, fetchDrivers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const open = (d = null) => {
    setEditing(d);
    setForm(d ? { ...d } : { ...empty });
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.phone) return toast.error('Name and Phone are required');
    try {
      editing ? await updateDriver(editing.id, form) : await addDriver(form);
      setModal(false);
      loadData();
      toast.success(editing ? 'Driver updated' : 'Driver added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const del = (id) => {
    AntModal.confirm({
      title: 'Delete Driver Profile?',
      content: 'Are you sure you want to delete this driver? All associated records will remain but the driver profile will be removed.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteDriver(id);
          loadData();
          toast.success('Driver deleted');
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
          <h1 className="page-title text-brand-500">DRIVERS</h1>
          <p className="text-surface-500 text-sm mt-1">{driversMeta.total} registered drivers</p>
        </div>
        <button className="btn-primary px-6" onClick={() => open()}>
          <Plus className="w-5 h-5" /> Add Driver
        </button>
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {drivers.map(d => {
          const assignedVehicle = vehicles.find(v => v.assignedDriver === d.id);
          const expiringSoon = d.licenseExpiry && new Date(d.licenseExpiry) < new Date(Date.now() + 90*24*60*60*1000);
          return (
            <div key={d.id} className="stat-card group !p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 font-black text-lg">
                    {d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white text-base leading-tight uppercase">{d.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${d.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {d.status}
                        </span>
                        {d.user && (
                        <span className="badge badge-blue">
                            <Activity className="w-2.5 h-2.5" /> Linked
                        </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-surface-400 hover:text-brand-500 transition-colors" onClick={() => open(d)}><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-surface-400 hover:text-red-500 transition-colors" onClick={() => del(d.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-surface-400">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-surface-500" />
                  </div>
                  <span className="font-semibold tracking-wider">{d.phone}</span>
                </div>
                {d.license && (
                  <div className="flex items-center gap-3 text-sm text-surface-400">
                    <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5 text-surface-500" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-widest">{d.license}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-surface-800/60 flex flex-col gap-2">
                 <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-bold">
                    <span className="text-surface-500">Vehicle</span>
                    <span className="text-brand-400 font-mono">{assignedVehicle?.number || 'Unassigned'}</span>
                 </div>
                 {d.licenseExpiry && (
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                        <span className="text-surface-500">License Exp</span>
                        <span className={expiringSoon ? 'text-red-500 animate-pulse' : 'text-surface-300'}>
                            {formatDate(d.licenseExpiry)}
                        </span>
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
      
      {drivers.length === 0 && !loading && (
          <div className="py-20 text-center card bg-surface-900/40 border-dashed border-2 border-surface-800">
            <Users className="w-12 h-12 text-surface-700 mx-auto mb-4" />
            <p className="text-surface-500 font-medium uppercase tracking-widest text-xs">No drivers found matching your search</p>
          </div>
      )}

      {loading && drivers.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-surface-500 text-xs uppercase tracking-widest font-bold">Searching drivers...</p>
        </div>
      )}

      <Pagination 
          page={filters.page} 
          totalPages={driversMeta.totalPages} 
          total={driversMeta.total} 
          onPageChange={p => setFilters({ ...filters, page: p })}
          limit={filters.limit}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Update Driver Profile' : 'Register New Driver'} size="md">
        <div className="space-y-5 px-1">
          <div>
            <label className="label">Full Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="label">Contact Number *</label>
            <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="10-digit mobile" maxLength={10} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="label">DL Number</label>
                <input className="input-field font-mono uppercase tracking-widest" value={form.license} onChange={e => setForm({...form, license: e.target.value})} placeholder="GJ05..." />
            </div>
            <div>
                <label className="label">DL Expiry</label>
                <DatePicker 
                  className="w-full"
                  value={form.licenseExpiry ? dayjs(form.licenseExpiry) : null}
                  onChange={(date) => setForm({...form, licenseExpiry: date ? date.format('YYYY-MM-DD') : ''})}
                />
            </div>
          </div>
          <div>
            <label className="label">Operational Status</label>
            <Select
              className="w-full"
              value={form.status}
              onChange={val => setForm({...form, status: val})}
              options={[
                { label: 'Active & Available', value: 'active' },
                { label: 'Inactive / Off Duty', value: 'inactive' },
                { label: 'On Approved Leave', value: 'on-leave' },
              ]}
            />
          </div>
          <div className="flex gap-3 pt-6">
            <button className="btn-primary flex-1 py-4 text-base shadow-2xl" onClick={save}>
              {editing ? 'Update Details' : 'Confirm Registration'}
            </button>
            <button className="btn-secondary px-8" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
