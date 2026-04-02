import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Truck, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, register } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'driver' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-500/20 backdrop-blur-xl border border-brand-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/10">
            <Truck className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-surface-400">
            {isLogin ? 'Sign in to access TransportPro' : 'Register to manage your transport fleet'}
          </p>
        </div>

        <form className="mt-8 space-y-5 bg-surface-900/50 backdrop-blur-xl p-8 rounded-2xl border border-surface-700/50 shadow-2xl" onSubmit={handleSubmit}>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-surface-500" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 bg-surface-800 border-surface-700 text-white rounded-lg focus:ring-brand-500 focus:border-brand-500 sm:text-sm py-2.5 transition-colors placeholder:text-surface-600"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-surface-500" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 bg-surface-800 border-surface-700 text-white rounded-lg focus:ring-brand-500 focus:border-brand-500 sm:text-sm py-2.5 transition-colors placeholder:text-surface-600"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-surface-500" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 bg-surface-800 border-surface-700 text-white rounded-lg focus:ring-brand-500 focus:border-brand-500 sm:text-sm py-2.5 transition-colors placeholder:text-surface-600"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="bg-brand-500/5 border border-brand-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-brand-400 font-medium uppercase tracking-widest">Registering as Driver</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-surface-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? 'Sign in' : 'Create account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              className="text-sm font-medium text-surface-400 hover:text-white transition-colors"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
