import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select, DatePicker, Modal as AntModal } from 'antd';
import dayjs from 'dayjs';

export default function Upad() {
  const drivers = useStore(state => state.drivers);
  const fetchDrivers = useStore(state => state.fetchDrivers);

  useEffect(() => {
    if (drivers.length === 0) fetchDrivers({ limit: 1000 });
  }, [drivers.length, fetchDrivers]);

  const upad = useStore(state => state.upad);
  const addUpad = useStore(state => state.addUpad);
  const deleteUpad = useStore(state => state.deleteUpad);
  const [formData, setFormData] = useState({ driver: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'DR' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total advance for selected driver
  const selectedDriverTotal = useMemo(() => {
    if (!formData.driver) return 0;
    return (upad || [])
      .filter(record => String(record.driverId || record.driver?._id) === String(formData.driver))
      .reduce((sum, record) => sum + (record.amount || 0), 0);
  }, [upad, formData.driver]);


  // Group by driver for summary
  const driverSummary = useMemo(() => {
    const summary = {};
    (upad || []).forEach(record => {
        const dId = record.driverId || record.driver?._id;
        const dName = record.driver?.name || drivers.find(d => d.id === dId)?.name || 'Unknown';
        if (!summary[dId]) summary[dId] = { id: dId, name: dName, total: 0 };
        summary[dId].total += (record.amount || 0);
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [upad, drivers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.driver) return toast.error('Please select a driver');
    if (!formData.amount || isNaN(formData.amount)) return toast.error('Valid amount is required');
    if (!formData.date) return toast.error('Date is required');

    setIsSubmitting(true);
    try {
      const finalAmount = formData.type === 'CR' ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount));
      await addUpad({ ...formData, amount: finalAmount });
      setFormData({ driver: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'DR' });
      toast.success(formData.type === 'CR' ? 'Advance return recorded' : 'Advance payment added');
    } catch (error) {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    AntModal.confirm({
      title: 'Delete Payment Record?',
      content: 'Are you sure you want to delete this payment record? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteUpad(id);
          toast.success('Advance payment deleted');
        } catch (error) {
          // Error handled in store
        }
      },
    });
  };



  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="page-header items-start">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Wallet className="w-8 h-8 text-brand-500" />
            Advance Payments
          </h1>
          <p className="text-surface-400 mt-1 uppercase text-[10px] font-bold tracking-widest">Manage driver advance payments and records</p>
        </div>
        <div className="flex gap-3">

            <div className="flex gap-4">
            <div className="stat-card !py-3 !px-6 bg-surface-800/50 border-surface-700/50 hidden sm:flex">
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] mb-1 block">Active Drivers</span>
                <span className="text-2xl font-black text-white">{driverSummary.length}</span>
            </div>
            </div>
        </div>
      </div>

      {/* Driver Summary Bar */}
      {driverSummary.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {driverSummary.map(ds => (
                  <button 
                    key={ds.id} 
                    onClick={() => setFormData(f => ({ ...f, driver: ds.id }))}
                    className={`flex-shrink-0 card !bg-surface-800/40 p-4 border flex flex-col gap-1 min-w-[160px] hover:border-brand-500/30 transition-all ${formData.driver === ds.id ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-500/5' : 'border-surface-700/50'}`}
                  >
                      <span className="text-[10px] font-black uppercase text-surface-400 truncate">{ds.name}</span>
                      <span className="text-lg font-black text-white">₹{ds.total.toLocaleString()}</span>
                  </button>
              ))}
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Upad Form */}
        <div className="card p-6 lg:col-span-1 h-fit">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            Add Advance Payment
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Driver</label>
              <Select
                className="w-full h-10"
                placeholder="Select Driver"
                value={formData.driver || undefined}
                onChange={val => {
                    setFormData({ ...formData, driver: val });
                }}
                options={drivers.map(d => ({ label: `${d.name} (${d.phone})`, value: d.id }))}
                showSearch
              />
              {formData.driver && (
                <div className="mt-3 p-3 bg-brand-500/5 border border-brand-500/10 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest leading-none mb-1">Driver Balance</span>
                    <span className={`text-sm font-black ${selectedDriverTotal > 0 ? 'text-brand-400' : 'text-surface-500'}`}>
                        ₹{selectedDriverTotal.toLocaleString()}
                    </span>
                  </div>
                  {selectedDriverTotal === 0 ? (
                      <span className="bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded text-[9px] uppercase font-black">Ready for Opening Balance</span>
                  ) : selectedDriverTotal < 0 && (
                      <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[9px] uppercase font-black font-black">Credit Balance</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label">Transaction Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, type: 'DR' })}
                  className={`py-2 text-[10px] uppercase font-black rounded-lg border transition-all ${formData.type === 'DR' ? 'bg-brand-500/10 border-brand-500 text-brand-500' : 'bg-surface-800/50 border-surface-700/50 text-surface-500 hover:text-surface-300'}`}
                >
                  Advance (Give)
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, type: 'CR' })}
                  className={`py-2 text-[10px] uppercase font-black rounded-lg border transition-all ${formData.type === 'CR' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-surface-800/50 border-surface-700/50 text-surface-500 hover:text-surface-300'}`}
                >
                  Return (Paid)
                </button>
              </div>
            </div>
            
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field"
                placeholder="E.g., 5000"
                required
                min="1"
              />
            </div>

            <div>
              <label className="label">Date</label>
              <DatePicker 
                className="w-full h-10"
                value={formData.date ? dayjs(formData.date) : null}
                onChange={(date) => setFormData({ ...formData, date: date ? date.format('YYYY-MM-DD') : '' })}
                allowClear={false}
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center mt-2">
              {isSubmitting ? 'Adding...' : 'Add Payment'}
            </button>
          </form>
        </div>

        {/* Upad List */}
        <div className="card p-0 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-700/50 bg-surface-800/50">
            <h3 className="section-title flex items-center gap-2">Payment History</h3>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {upad.length === 0 ? (
              <div className="p-8 text-center text-surface-400">
                No advance payments found.
              </div>
            ) : (
              <table className="table w-full whitespace-nowrap">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Driver Name</th>
                    <th>Amount</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upad.map((record) => (
                    <tr key={record.id}>
                      <td className="text-surface-300">{record.date}</td>
                      <td>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${record.amount < 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {record.amount < 0 ? 'Return' : 'Advance'}
                        </span>
                      </td>
                      <td className="font-medium text-surface-100 uppercase">{record.driver?.name || 'Unknown Driver'}</td>
                      <td>
                        <span className={`font-semibold ${record.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {record.amount < 0 ? '-' : ''}₹{Math.abs(record.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-surface-400 hover:text-red-400 hover:bg-surface-700/50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
