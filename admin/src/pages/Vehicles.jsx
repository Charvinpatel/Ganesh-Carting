import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Edit2, Trash2, Truck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select, Modal as AntModal } from 'antd';

const empty = { number: '', type: 'truck', status: 'active' };

export default function Vehicles() {
  const vehicles = useStore(state => state.vehicles);
  const vehiclesMeta = useStore(state => state.vehiclesMeta);
  const fetchVehicles = useStore(state => state.fetchVehicles);
  const addVehicle = useStore(state => state.addVehicle);
  const updateVehicle = useStore(state => state.updateVehicle);
  const deleteVehicle = useStore(state => state.deleteVehicle);
  const loading = useStore(state => state.contentLoading);
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(() => {
    fetchVehicles(filters);
  }, [filters, fetchVehicles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const open = (v = null) => {
    setEditing(v);
    setForm(v ? { ...v } : { ...empty });
    setModal(true);
  };

  const save = async () => {
    if (!form.number) return toast.error('Vehicle Number is required');
    setIsSubmitting(true);
    try {
      editing ? await updateVehicle(editing.id, form) : await addVehicle(form);
      setModal(false);
      setForm({ ...empty });
      setFilters(f => ({ ...f, search: '', page: 1 }));
      loadData();
      toast.success(editing ? 'Vehicle updated' : 'Vehicle added');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const del = (id) => {
    AntModal.confirm({
      title: 'Remove Vehicle?',
      content: 'Are you sure you want to remove this vehicle from the fleet?',
      okText: 'Yes, Remove',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteVehicle(id);
          loadData();
          toast.success('Vehicle removed');
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
          <h1 className="page-title text-brand-500">FLEET</h1>
          <p className="text-surface-500 text-sm mt-1">{vehiclesMeta.total} assets registered</p>
        </div>
        <button className="btn-primary px-6" onClick={() => open()}>
          <Plus className="w-5 h-5" /> Add Vehicle
        </button>
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vehicles.map(v => {
          const isHitachi = v.type === 'hitachi';
          const isTruck = v.type === 'truck';

          return (
            <div key={v.id} className="stat-card group !p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isHitachi ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                    isTruck ? 'bg-brand-500/10 border-brand-500/20 text-brand-500' :
                    'bg-surface-800 border-surface-700 text-surface-400'
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-mono font-black text-white text-lg tracking-tighter uppercase">{v.number}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${isHitachi ? 'badge-yellow' : isTruck ? 'badge-blue' : 'badge-black'}`}>
                        {v.type}
                        </span>
                        <span className={`badge ${v.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {v.status}
                        </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-surface-400 hover:text-brand-500 transition-colors" onClick={() => open(v)}><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-surface-400 hover:text-red-500 transition-colors" onClick={() => del(v.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-surface-800/60 flex flex-col gap-2">
                 {/* Stats removed as requested */}
                 <div className="text-center py-2 text-[10px] text-surface-600 uppercase tracking-widest font-bold">
                    Vehicle Details Logged
                 </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {vehicles.length === 0 && !loading && (
          <div className="py-20 text-center card bg-surface-900/40 border-dashed border-2 border-surface-800">
            <Truck className="w-12 h-12 text-surface-700 mx-auto mb-4" />
            <p className="text-surface-500 font-medium uppercase tracking-widest text-xs">No vehicles found matching your criteria</p>
          </div>
      )}

      {loading && vehicles.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-surface-500 text-xs uppercase tracking-widest font-bold">Searching fleet...</p>
        </div>
      )}

      <Pagination 
          page={filters.page} 
          totalPages={vehiclesMeta.totalPages} 
          total={vehiclesMeta.total} 
          onPageChange={p => setFilters({ ...filters, page: p })}
          limit={filters.limit}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Update Vehicle Details' : 'Register New Asset'} size="md">
        <div className="space-y-5 px-1">
          <div>
            <label className="label">Vehicle Number *</label>
            <input className="input-field font-mono uppercase tracking-widest text-lg" value={form.number} onChange={e => setForm({...form, number: e.target.value.toUpperCase()})} placeholder="GJ05-AB-1234" />
          </div>
          <div>
            <label className="label">Vehicle Category *</label>
            <Select
              className="w-full h-10"
              value={form.type}
              onChange={val => setForm({...form, type: val})}
              options={[
                { label: 'Heavy Truck', value: 'truck' },
                { label: 'Excavator / Hitachi', value: 'hitachi' },
                { label: 'Special Utility / Other', value: 'other' },
              ]}
            />
          </div>
          <div>
            <label className="label">Current Operational Status</label>
            <Select
              className="w-full h-10"
              value={form.status}
              onChange={val => setForm({...form, status: val})}
              options={[
                { label: 'Active & Operational', value: 'active' },
                { label: 'Inactive / Stored', value: 'inactive' },
                { label: 'Under Maintenance', value: 'maintenance' },
              ]}
            />
          </div>
          <div className="flex gap-3 pt-6">
            <button disabled={isSubmitting} className="btn-primary flex-1 py-4 text-base shadow-2xl disabled:opacity-50" onClick={save}>
              {editing ? (isSubmitting ? 'Updating...' : 'Confirm Changes') : (isSubmitting ? 'Registering...' : 'Register Asset')}
            </button>
            <button className="btn-secondary px-8" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
