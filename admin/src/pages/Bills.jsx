import { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  FileText, CheckCircle, Trash2, MapPin, Receipt,
  AlertCircle, DollarSign, Calendar, Building2,
  BadgeCheck, Hourglass, Plus, Truck
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const STATUS_FILTER = ['all', 'unpaid', 'paid'];

export default function Bills() {
  const bills = useStore(state => state.bills);
  const fetchBills = useStore(state => state.fetchBills);
  const addBill = useStore(state => state.addBill);
  const updateBillStatus = useStore(state => state.updateBillStatus);
  const deleteBill = useStore(state => state.deleteBill);
  const trips = useStore(state => state.trips);
  const fetchTrips = useStore(state => state.fetchTrips);
  const driverTrips = useStore(state => state.driverTrips);
  const fetchDriverTrips = useStore(state => state.fetchDriverTrips);
  const vendors = useStore(state => state.vendors);

  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal]               = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    vendorName:            '',
    destination:           '',
    billNumber:            `BILL-${Date.now().toString().slice(-6)}`,
    date:                  dayjs().format('YYYY-MM-DD'),
    notes:                 '',
    selectedTripIds:       [],
    selectedDriverTripIds: [],
  });

  const loadData = useCallback(() => {
    fetchBills();
    fetchTrips({ limit: 2000 });
    fetchDriverTrips({ status: 'verified' });
  }, [fetchBills, fetchTrips, fetchDriverTrips]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Destination Summaries (admin trips only) ─────────────────────────────
  const destinationSummaries = useMemo(() => {
    const stats = {};
    trips.forEach(t => {
      const dest = (t.destination || '').trim().toUpperCase() || 'UNSPECIFIED';
      if (!stats[dest]) stats[dest] = { name: dest, total: 0 };
      stats[dest].total += (t.trips || 1);
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [trips]);

  const grandTotal = destinationSummaries.reduce((s, d) => s + d.total, 0);

  // ── Bills computed ────────────────────────────────────────────────────────
  const filteredBills = useMemo(() =>
    statusFilter === 'all' ? bills : bills.filter(b => b.status === statusFilter),
  [bills, statusFilter]);

  const billStats = useMemo(() => ({
    all:    bills.length,
    unpaid: bills.filter(b => b.status === 'unpaid').length,
    paid:   bills.filter(b => b.status === 'paid').length,
    outstanding: bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + (b.totalAmount || 0), 0),
  }), [bills]);

  // ── Available trips in modal ───────────────────────────────────────────────
  const { availAdmin, availDriver } = useMemo(() => {
    const dest = (form.destination || '').trim().toUpperCase();
    if (!dest) return { availAdmin: [], availDriver: [] };
    const billedT  = new Set(bills.flatMap(b => b.trips       || []));
    const billedDT = new Set(bills.flatMap(b => b.driverTrips || []));
    return {
      availAdmin:  trips.filter(t =>
        (t.destination || '').trim().toUpperCase() === dest && !billedT.has(t.id)),
      availDriver: driverTrips.filter(dt =>
        dt.status === 'verified' &&
        (dt.destination || '').trim().toUpperCase() === dest &&
        !billedDT.has(dt.id)),
    };
  }, [trips, driverTrips, bills, form.destination]);

  const totalAvail    = availAdmin.length + availDriver.length;
  const selectedCount = useMemo(() =>
    availAdmin.filter(t => form.selectedTripIds.includes(t.id)).reduce((s, t) => s + (t.trips || 1), 0) +
    availDriver.filter(dt => form.selectedDriverTripIds.includes(dt.id)).reduce((s, dt) => s + (dt.trips || 1), 0),
  [availAdmin, availDriver, form.selectedTripIds, form.selectedDriverTripIds]);

  const selectedAmount = useMemo(() =>
    availAdmin.filter(t => form.selectedTripIds.includes(t.id))
      .reduce((s, t) => s + (t.sellPrice || 0) * (t.trips || 1), 0),
  [availAdmin, form.selectedTripIds]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleId = (field, id) =>
    setForm(p => ({ ...p, [field]: p[field].includes(id) ? p[field].filter(x => x !== id) : [...p[field], id] }));

  const openModal = destName => {
    setForm(f => ({
      ...f, destination: destName,
      selectedTripIds: [], selectedDriverTripIds: [],
      billNumber: `BILL-${Date.now().toString().slice(-6)}`,
    }));
    setModal(true);
  };

  const handleCreate = async () => {
    if (!form.vendorName.trim()) return toast.error('Enter vendor name');
    if (!form.selectedTripIds.length && !form.selectedDriverTripIds.length) return toast.error('Select at least one trip');
    setIsSubmitting(true);
    try {
      await addBill({
        vendorId:      '',
        vendorName:    form.vendorName.trim(),
        destination:   form.destination,
        billNumber:    form.billNumber,
        date:          form.date,
        notes:         form.notes,
        tripIds:       form.selectedTripIds,
        driverTripIds: form.selectedDriverTripIds,
      });
      toast.success('Invoice created!');
      setModal(false);
      loadData();
    } catch (err) { toast.error(err.message); }
    finally       { setIsSubmitting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-brand-500">BILLING</h1>
          <p className="text-surface-500 text-sm mt-1">
            {destinationSummaries.length} destinations · {grandTotal} total trips
          </p>
        </div>
      </div>

      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="label !mb-0">Total Bills</span>
          <span className="text-3xl font-black text-white">{billStats.all}</span>
        </div>
        <div className="stat-card">
          <span className="label !mb-0 text-emerald-400">Paid</span>
          <span className="text-3xl font-black text-emerald-400">{billStats.paid}</span>
        </div>
        <div className="stat-card">
          <span className="label !mb-0 text-amber-400">Unpaid</span>
          <span className="text-3xl font-black text-amber-400">{billStats.unpaid}</span>
        </div>
        <div className="stat-card">
          <span className="label !mb-0 text-red-400">Outstanding</span>
          <span className="text-2xl font-black text-red-400">{formatCurrency(billStats.outstanding)}</span>
        </div>
      </div>

      {/* ── Bill Cards ── */}
      <div>
        {/* Section Header + filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" /> All Invoices
          </h2>
          <div className="flex items-center gap-2 sm:ml-auto">
            {STATUS_FILTER.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all
                  ${statusFilter === s
                    ? s === 'paid'   ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : s === 'unpaid' ? 'bg-amber-500/20   text-amber-400   border-amber-500/40'
                                     : 'bg-brand-500/20   text-brand-400   border-brand-500/40'
                    : 'text-surface-500 border-surface-800 hover:border-surface-700'}`}>
                {s === 'all' ? `All (${billStats.all})` : s === 'paid' ? `Paid (${billStats.paid})` : `Unpaid (${billStats.unpaid})`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => (
            <div key={bill.id}
              className={`card !p-0 overflow-hidden border transition-all hover:shadow-xl group
                ${bill.status === 'paid' ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-surface-800 hover:border-amber-500/30'}`}>

              {/* Colour accent bar */}
              <div className={`h-1 w-full ${bill.status === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`} />

              <div className="p-5 space-y-4">

                {/* Top row: Bill # + Status */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-surface-500 tracking-widest">{bill.billNumber}</span>
                  <button
                    onClick={() => updateBillStatus(bill.id, bill.status === 'paid' ? 'unpaid' : 'paid')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-all
                      ${bill.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10   text-amber-400   border-amber-500/20   hover:bg-amber-500/20'}`}>
                    {bill.status === 'paid'
                      ? <><BadgeCheck className="w-3 h-3" /> Paid</>
                      : <><Hourglass  className="w-3 h-3" /> Unpaid</>}
                  </button>
                </div>

                {/* Destination */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold text-surface-500 uppercase mb-0.5">Site / Destination</div>
                    <div className="text-base font-black text-white uppercase truncate">{bill.destination || '—'}</div>
                  </div>
                </div>

                {/* Vendor */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-900 border border-surface-800 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-surface-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold text-surface-500 uppercase mb-0.5">Vendor / Party</div>
                    <div className="text-sm font-black text-white uppercase truncate">{bill.vendorName || bill.vendor?.name || '—'}</div>
                  </div>
                </div>

                {/* Stats: Trips + Amount */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-surface-900/60 rounded-xl p-3 border border-surface-800 text-center">
                    <div className="text-[8px] font-black text-surface-500 uppercase flex items-center justify-center gap-1 mb-1">
                      <Truck className="w-2.5 h-2.5" /> Total Trips
                    </div>
                    <div className="text-3xl font-black text-white">{bill.totalTripsCount}</div>
                  </div>
                  <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 text-center">
                    <div className="text-[8px] font-black text-emerald-600 uppercase flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-2.5 h-2.5" /> Total Amount
                    </div>
                    <div className="text-2xl font-black text-emerald-400">{formatCurrency(bill.totalAmount || 0)}</div>
                  </div>
                </div>

                {/* Date footer */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-800">
                  <div className="flex items-center gap-1.5 text-[9px] text-surface-500 font-bold uppercase">
                    <Calendar className="w-3 h-3" /> {formatDate(bill.date)}
                  </div>
                  <button
                    onClick={() => deleteBill(bill.id)}
                    className="text-[9px] font-bold text-surface-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-widest flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredBills.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center gap-3 border-2 border-dashed border-surface-800 rounded-3xl opacity-40">
              <FileText className="w-12 h-12 text-surface-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-surface-500">No invoices yet</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Destination Section ── */}
      <div>
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-brand-500" /> Destinations
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinationSummaries.map(dest => (
            <div key={dest.name}
              className="card !p-0 overflow-hidden group hover:border-brand-500/40 border-surface-800 transition-all">

              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-brand-400" />

              <div className="px-5 py-5 space-y-4">
                {/* Destination name row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[9px] font-black text-brand-500 uppercase tracking-[0.2em] mb-1">Destination Site</div>
                    <div className="text-lg font-black text-white uppercase truncate">{dest.name}</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-brand-500" />
                  </div>
                </div>

                {/* Trip count */}
                <div className="flex items-end justify-between pt-3 border-t border-surface-800">
                  <div>
                    <div className="text-[9px] font-bold text-surface-500 uppercase tracking-widest mb-1">Total Trips</div>
                    <div className="text-5xl font-black text-brand-400 leading-none">{dest.total}</div>
                  </div>
                  <button
                    onClick={() => openModal(dest.name)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-500/20">
                    <Plus className="w-3 h-3" /> Generate Bill
                  </button>
                </div>
              </div>
            </div>
          ))}

          {destinationSummaries.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center gap-3 border-2 border-dashed border-surface-800 rounded-3xl opacity-40">
              <MapPin className="w-12 h-12 text-surface-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-surface-500">No destination data</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Invoice Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title="GENERATE INVOICE" size="xl">
        <div className="space-y-5 pt-1">

          <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3">
            <MapPin className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-black text-white uppercase tracking-widest">{form.destination}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1.5 block">Vendor / Party *</label>
              <input
                type="text"
                className="input-field h-[42px]"
                placeholder="e.g. ABC Suppliers"
                value={form.vendorName}
                onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1.5 block">Bill Number</label>
              <input type="text" className="input-field h-[42px]"
                value={form.billNumber}
                onChange={e => setForm(f => ({ ...f, billNumber: e.target.value }))} />
            </div>
            <div>
              <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1.5 block">Date</label>
              <DatePicker className="w-full h-[42px]" value={dayjs(form.date)}
                onChange={d => setForm(f => ({ ...f, date: d?.format('YYYY-MM-DD') || f.date }))} />
            </div>
            <div>
              <label className="text-[9px] font-black text-surface-500 uppercase tracking-widest mb-1.5 block">Total Trips</label>
              <div className="h-[42px] bg-surface-900 border border-surface-800 rounded-xl px-4 flex items-center gap-3">
                <span className="text-2xl font-black text-brand-400 leading-none">{selectedCount}</span>
                {selectedAmount > 0 && <span className="text-xs font-black text-emerald-400">{formatCurrency(selectedAmount)}</span>}
              </div>
            </div>
          </div>

          {/* Trip list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-surface-400 uppercase tracking-widest">
                Available ({totalAvail})
              </span>
              <button onClick={() => {
                const all = form.selectedTripIds.length === availAdmin.length && form.selectedDriverTripIds.length === availDriver.length;
                setForm(f => ({
                  ...f,
                  selectedTripIds: all ? [] : availAdmin.map(t => t.id),
                  selectedDriverTripIds: all ? [] : availDriver.map(t => t.id)
                }));
              }} className="text-[9px] font-bold text-brand-500 hover:underline uppercase">
                {form.selectedTripIds.length === availAdmin.length && form.selectedDriverTripIds.length === availDriver.length && totalAvail > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {availAdmin.map(t => {
                const sel = form.selectedTripIds.includes(t.id);
                return (
                  <div key={t.id} onClick={() => toggleId('selectedTripIds', t.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                      ${sel ? 'bg-brand-500/10 border-brand-500/30 text-white' : 'bg-surface-900/50 border-surface-800 text-surface-400 hover:border-surface-700'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-brand-500 border-brand-500' : 'border-surface-700'}`}>
                      {sel && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-2 text-[10px] font-bold uppercase items-center">
                      <span className="text-surface-500">Admin</span>
                      <span>{formatDate(t.date)}</span>
                      <span className="text-center">{t.trips} trips</span>
                      <span className="text-right text-white">{formatCurrency(t.sellPrice * (t.trips || 1))}</span>
                    </div>
                  </div>
                );
              })}

              {availDriver.map(t => {
                const sel = form.selectedDriverTripIds.includes(t.id);
                return (
                  <div key={t.id} onClick={() => toggleId('selectedDriverTripIds', t.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                      ${sel ? 'bg-brand-500/10 border-brand-500/30 text-white' : 'bg-surface-900/50 border-surface-800 text-surface-400 hover:border-surface-700'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-brand-500 border-brand-500' : 'border-surface-700'}`}>
                      {sel && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-2 text-[10px] font-bold uppercase items-center">
                      <span className="text-surface-500">Driver</span>
                      <span>{formatDate(t.date)}</span>
                      <span className="text-center">{t.trips} trips</span>
                      <span className="text-right text-white">—</span>
                    </div>
                  </div>
                );
              })}

              {totalAvail === 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2 opacity-50" />
                  <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest">No unbilled trips for this destination</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-surface-800">
            <button onClick={handleCreate}
              disabled={isSubmitting || (!form.selectedTripIds.length && !form.selectedDriverTripIds.length) || !form.vendorName.trim()}
              className="flex-[2] py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
              {isSubmitting ? 'Creating...' : 'Finalize Invoice'}
            </button>
            <button onClick={() => setModal(false)}
              className="flex-1 py-4 bg-surface-900 border border-surface-800 hover:border-surface-700 text-surface-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl active:scale-95 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
