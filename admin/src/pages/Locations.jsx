import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import Pagination from '../components/Pagination';
import { Plus, Trash2, MapPin, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select, Modal as AntModal } from 'antd';

export default function Locations() {
  const { locations, locationsMeta, fetchLocations, addLocation, deleteLocation, loading } = useStore();
  const [formData, setFormData] = useState({ name: '', type: 'source' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: ''
  });

  const loadData = useCallback(() => {
    fetchLocations(filters);
  }, [filters, fetchLocations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Location name is required');
    
    setIsSubmitting(true);
    try {
      await addLocation(formData);
      setFormData({ name: '', type: 'source' });
      loadData();
      toast.success('Location added successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    AntModal.confirm({
      title: 'Delete Location?',
      content: 'Are you sure you want to delete this location? This might affect existing trip logs display.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteLocation(id);
          loadData();
          toast.success('Location deleted');
        } catch (error) {
          toast.error(error.message);
        }
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title text-brand-500">LOCATIONS</h1>
          <p className="text-surface-500 text-sm mt-1">{locationsMeta.total} sources & destinations managed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Location Form */}
        <div className="space-y-6">
            <div className="stat-card bg-brand-500/5 !border-brand-500/20">
                <h3 className="section-title text-sm flex items-center gap-2 mb-4">
                    <Plus className="w-4 h-4 text-brand-500" />
                    REGISTER NEW POINT
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                    <label className="label">Point Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-field !bg-surface-950"
                        placeholder="e.g. Mine Site A"
                        required
                    />
                    </div>
                    
                    <div>
                    <label className="label">Operational Type</label>
                    <Select
                        className="w-full h-10"
                        value={formData.type}
                        onChange={(val) => setFormData({ ...formData, type: val })}
                        options={[
                            { label: 'Source (Departure)', value: 'source' },
                            { label: 'Destination (Arrival)', value: 'destination' },
                        ]}
                    />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 mt-2 shadow-2xl">
                    {isSubmitting ? 'Registering...' : 'Confirm Location'}
                    </button>
                </form>
            </div>
            

        </div>

        {/* Locations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-surface-900/50 p-4 rounded-2xl border border-surface-800">
              <div className="flex items-center gap-4 flex-1 max-w-sm">
                <Filter className="w-4 h-4 text-surface-500" />
                <Select 
                    className="flex-1" 
                    value={filters.type} 
                    onChange={val => setFilters({...filters, type: val, page: 1})}
                    options={[
                        { label: 'All Types', value: '' },
                        { label: 'Sources Only', value: 'source' },
                        { label: 'Destinations Only', value: 'destination' },
                    ]}
                />
              </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Location Name</th>
                  <th>Point Type</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td className="font-bold text-white text-base">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-800 rounded-lg">
                           <MapPin className={`w-4 h-4 ${loc.type === 'source' ? 'text-blue-400' : 'text-emerald-400'}`} />
                        </div>
                        {loc.name}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${loc.type === 'source' ? 'badge-blue' : 'badge-green'}`}>
                        {loc.type}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="p-3 text-surface-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {locations.length === 0 && !loading && (
                    <tr><td colSpan={5} className="text-center py-20 text-surface-600 uppercase tracking-widest font-black text-xs opacity-50">No locations mapped yet</td></tr>
                )}
              </tbody>
            </table>
            
            <Pagination 
                page={filters.page} 
                totalPages={locationsMeta.totalPages} 
                total={locationsMeta.total} 
                onPageChange={p => setFilters({ ...filters, page: p })}
                limit={filters.limit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
