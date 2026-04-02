import { useState } from 'react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Layers, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Modal as AntModal } from 'antd';

const empty = { name: '', buyPrice: 0, sellPrice: 0, color: '#f97316' };

export default function Soil() {
  const { soilTypes, addSoilType, updateSoilType, deleteSoilType, trips } = useStore();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const open = (s = null) => {
    setEditing(s);
    setForm(s ? { ...s } : { ...empty });
    setModal(true);
  };

  const save = async () => {
    if (!form.name) return toast.error('Soil name is required');
    try {
      if (editing) {
        await updateSoilType(editing.id, form);
        toast.success('Soil type updated');
      } else {
        await addSoilType(form);
        toast.success('New soil type added');
      }
      setModal(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const del = (id) => {
    AntModal.confirm({
      title: 'Delete Soil Type?',
      content: 'Are you sure you want to delete this soil type? This may affect existing trip records.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteSoilType(id);
          toast.success('Soil type deleted');
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  };

  const filtered = soilTypes.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">SOIL TYPES</h1>
          <p className="text-surface-500 text-sm mt-1">Manage soil types and their default pricing</p>
        </div>
        <button className="btn-primary" onClick={() => open()}>
          <Plus className="w-4 h-4" /> Add Soil Type
        </button>
      </div>

      <div className="flex gap-3">
        <input
          className="input-field max-w-sm"
          placeholder="Search soil types..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const soilTrips = trips.filter(t => t.soilTypeId === s.id);
          const totalTripsCount = soilTrips.reduce((acc, t) => acc + t.trips, 0);
          
          return (
            <div key={s.id} className="card p-4 hover:border-surface-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-surface-700 bg-brand-500/10 text-brand-400 shadow-inner">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">{s.name}</div>
                    <div className="text-[10px] text-surface-500 uppercase tracking-wider">Soil Type</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-success !px-2 !py-1" onClick={() => open(s)}><Edit2 className="w-3 h-3" /></button>
                  <button className="btn-danger !px-2 !py-1" onClick={() => del(s.id)}><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-surface-800/40 rounded-lg p-3 border border-surface-700/30">
                  <div className="text-[10px] text-surface-500 uppercase tracking-widest mb-1">Default Buy Price</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-brand-400" />
                    {s.buyPrice}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-700 flex justify-end items-center text-xs">
                <span className="text-surface-500 font-medium">{totalTripsCount} trips recorded</span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Soil Type' : 'Add Soil Type'}>
        <div className="space-y-4">
          <div>
            <label className="label">Soil Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Black Soil" />
          </div>
          <div>
            <label className="label">Default Buy Price (₹) *</label>
            <input 
              type="number" 
              className="input-field" 
              value={form.buyPrice} 
              onChange={e => setForm({...form, buyPrice: parseFloat(e.target.value) || 0})} 
              placeholder="0" 
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1" onClick={save}>
              {editing ? 'Update Soil' : 'Create Soil'}
            </button>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
