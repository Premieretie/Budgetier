import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuthStore';
import { useThemeStore } from './hooks/useThemeStore';
import { useCosmeticStore } from './hooks/useCosmeticStore';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages - Main
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DataExport from './pages/DataExport';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Cosmetics from './pages/Cosmetics';
import BankConnection from './pages/BankConnection';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ui/ToastContainer';
import ConsentModal from './components/ConsentModal';

const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/landing" replace />;
};

function App() {
  const { initializeAuth, isLoading, requiresConsent, isAuthenticated } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const { syncEquipped } = useCosmeticStore();

  useEffect(() => {
    initializeAuth();
    initializeTheme();
  }, [initializeAuth, initializeTheme]);

  useEffect(() => {
    if (isAuthenticated) syncEquipped();
  }, [isAuthenticated, syncEquipped]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Landing */}
        <Route path="/landing" element={<Landing />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/data-export" element={<DataExport />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/cosmetics" element={<Cosmetics />} />
            <Route path="/banking" element={<BankConnection />} />
          </Route>
        </Route>

        {/* Public Routes */}
        <Route path="/privacy" element={<PrivacyPolicy publicView />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
      {requiresConsent && <ConsentModal />}
    </>
  );
}

export default App;
