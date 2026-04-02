import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider, theme } from 'antd';

// Lazy load pages for fast initial rendering
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Trips = lazy(() => import('./pages/Trips'));
const Diesel = lazy(() => import('./pages/Diesel'));
const Finance = lazy(() => import('./pages/Finance'));
const Reports = lazy(() => import('./pages/Reports'));
const Login = lazy(() => import('./pages/Login'));
const VerifyTrips = lazy(() => import('./pages/VerifyTrips'));
const Soil = lazy(() => import('./pages/Soil'));
const Upad = lazy(() => import('./pages/Upad'));
const Locations = lazy(() => import('./pages/Locations'));
const Bills = lazy(() => import('./pages/Bills'));

export default function App() {
  const { checkAuth, isAuthenticated, loading, hasInitialized, user } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Only show the app-level splash screen during initial boot or auth check
  if (loading && !hasInitialized) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-surface-300 font-medium">Connecting to system...</div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f97316', // brand-500
          borderRadius: 8, // rounded-lg matching native inputs
          colorBgContainer: '#0f172a', // surface-900 matching input field
          colorBorder: '#334155', // surface-700 matching input field
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
        {isAuthenticated ? (
          <Layout>
            <Suspense fallback={<div className="flex-1 bg-surface-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/trips" element={<Trips />} />
                <Route path="/verify-trips" element={<VerifyTrips />} />
                <Route path="/diesel" element={<Diesel />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/soil" element={<Soil />} />
                <Route path="/upad" element={<Upad />} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/bills" element={<Bills />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        ) : (
          <Suspense fallback={<div className="min-h-screen bg-surface-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        )}
      </BrowserRouter>
    </ConfigProvider>
  );
}
