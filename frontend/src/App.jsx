import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider, theme } from 'antd';

// Lazy load pages for fast initial rendering
const Login = lazy(() => import('./pages/Login'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const DriverMonthlyDashboard = lazy(() => import('./pages/DriverMonthlyDashboard'));
const TripsHistory = lazy(() => import('./pages/TripsHistory'));

export default function App() {
  const { checkAuth, isAuthenticated, loading, user } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Prevent rendering anything before knowing if we have a token and it is valid
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-surface-300 font-medium">Connecting to system...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="min-h-screen bg-surface-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f97316', // brand-500
          borderRadius: 8, // rounded-lg
          colorBgContainer: '#0f172a', // surface-900
          colorBorder: '#334155', // surface-700
          colorTextPlaceholder: '#64748b', // surface-500
        },
        components: {
          Select: {
            controlHeight: 38,
            colorBgContainer: '#0f172a',
          },
          DatePicker: {
            controlHeight: 38,
            colorBgContainer: '#0f172a',
          },
          Input: {
             controlHeight: 38,
             colorBgContainer: '#0f172a',
          },
          Button: {
            controlHeight: 38,
            borderRadius: 8,
          }
        }
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />
        <Layout>
          <Suspense fallback={<div className="flex-1 bg-surface-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<DriverMonthlyDashboard />} />
              <Route path="/trips" element={<DriverDashboard />} />
              <Route path="/history" element={<TripsHistory />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}
