export const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatDateShort = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export const SOIL_COLORS = {
  's1': { bg: 'bg-stone-800', text: 'text-stone-300', border: 'border-stone-600', dot: '#78716c' },
  's2': { bg: 'bg-yellow-900/40', text: 'text-yellow-400', border: 'border-yellow-700', dot: '#eab308' },
  's3': { bg: 'bg-amber-900/40', text: 'text-amber-400', border: 'border-amber-700', dot: '#f59e0b' },
};

export const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

export const getTripProfit = (trip) => (trip.sellPrice - trip.buyPrice) * trip.trips;
export const getTripRevenue = (trip) => trip.sellPrice * trip.trips;
export const getTripCost = (trip) => trip.buyPrice * trip.trips;

export const getLast7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
};

export const getLast30Days = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
};

export const groupBy = (arr, key) => arr.reduce((acc, item) => {
  const k = typeof key === 'function' ? key(item) : item[key];
  if (!acc[k]) acc[k] = [];
  acc[k].push(item);
  return acc;
}, {});
