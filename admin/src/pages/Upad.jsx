import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select, DatePicker, Modal as AntModal } from 'antd';
import dayjs from 'dayjs';

export default function Upad() {
  const drivers = useStore(state => state.drivers);
  const upad = useStore(state => state.upad);
  const addUpad = useStore(state => state.addUpad);
  const deleteUpad = useStore(state => state.deleteUpad);
  const [formData, setFormData] = useState({ driver: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.driver) return toast.error('Please select a driver');
    if (!formData.amount || isNaN(formData.amount)) return toast.error('Valid amount is required');
    if (!formData.date) return toast.error('Date is required');

    setIsSubmitting(true);
    try {
      await addUpad({ ...formData, amount: Number(formData.amount) });
      setFormData({ driver: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '' });
      toast.success('Advance payment added');
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
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Wallet className="w-8 h-8 text-brand-500" />
            Advance Payments (Upad)
          </h1>
          <p className="text-surface-400 mt-1">Manage driver advance payments and records</p>
        </div>
      </div>

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
                onChange={val => setFormData({ ...formData, driver: val })}
                options={drivers.map(d => ({ label: `${d.name} (${d.phone})`, value: d.id }))}
                showSearch
              />
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

            <div>
              <label className="label">Note / Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input-field"
                placeholder="Optional"
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
                    <th>Driver Name</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upad.map((record) => (
                    <tr key={record.id}>
                      <td className="text-surface-300">{record.date}</td>
                      <td className="font-medium text-surface-100 uppercase">{record.driver?.name || 'Unknown Driver'}</td>
                      <td>
                        <span className="font-semibold text-emerald-400">₹{record.amount?.toLocaleString()}</span>
                      </td>
                      <td className="text-surface-300 capitalize">{record.reason || '-'}</td>
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
