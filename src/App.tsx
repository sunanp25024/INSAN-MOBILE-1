import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import NativeFeatureInitializer from '@/components/native-feature-initializer';
import { useEffect } from 'react';
import { initAuthMiddleware } from '@/lib/auth-middleware';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import PackagesPage from '@/pages/PackagesPage';
import UsersPage from '@/pages/UsersPage';
// import AttendancePage from '@/pages/AttendancePage';
// import DailyPackageInputPage from '@/pages/DailyPackageInputPage';
import DeliveryActivitiesPage from '@/pages/DeliveryActivitiesPage';
// import LocationsPage from '@/pages/LocationsPage';

// Components
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  // Inisialisasi middleware autentikasi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initAuthMiddleware();
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <NativeFeatureInitializer />
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/packages" element={<ProtectedRoute><PackagesPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['Admin', 'MasterAdmin']}><UsersPage /></ProtectedRoute>} />
          {/* <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} /> */}
          {/* <Route path="/daily-package-input" element={<ProtectedRoute><DailyPackageInputPage /></ProtectedRoute>} /> */}
          <Route path="/delivery-activities" element={<ProtectedRoute><DeliveryActivitiesPage /></ProtectedRoute>} />
          {/* <Route path="/locations" element={<ProtectedRoute allowedRoles={['Admin', 'MasterAdmin']}><LocationsPage /></ProtectedRoute>} /> */}
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;