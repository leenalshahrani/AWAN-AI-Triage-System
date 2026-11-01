import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { ProtectedRoute } from '@components/common/ProtectedRoute';
import { LoginPage } from '@features/auth/LoginPage';
import { PatientWelcome } from '@features/patient/PatientWelcome';
import { PatientLogin } from '@features/patient/PatientLogin';
import { PatientStart } from '@features/patient/PatientStart';
import { PatientAssessment } from '@features/patient/PatientAssessment';
import { PatientReview } from '@features/patient/PatientReview';
import { PatientProfile } from '@features/patient/PatientProfile';
import { PhysicianDashboard } from '@features/physician/PhysicianDashboard';
import { AdminDashboard } from '@features/admin/AdminDashboard';
import { UserControl } from '@features/admin/UserControl';
import { AIManagement } from '@features/admin/AIManagement';
import { AIConfiguration } from '@features/admin/AIConfiguration';
import { AuditLogs } from '@features/admin/AuditLogs';
import { Notifications } from '@features/admin/Notifications';
import { PatientsList } from '@features/admin/PatientsList';
import { StaffAlertPage } from '@features/staff/StaffAlertPage';
import './i18n/i18n.config';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/patient" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Public patient kiosk routes */}
        <Route path="/patient" element={<PatientWelcome />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/start" element={<PatientStart />} />
        <Route path="/patient/assessment" element={<PatientAssessment />} />
        <Route path="/patient/review" element={<PatientReview />} />
        <Route path="/patient/profile" element={<PatientProfile />} />

        {/* Protected physician route */}
        <Route
          path="/physician"
          element={
            <ProtectedRoute>
              <Layout><PhysicianDashboard /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected medical staff route */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredRole="staff">
              <Layout><StaffAlertPage /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><UserControl /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AIManagement /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/config"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AIConfiguration /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AuditLogs /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><Notifications /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><PatientsList /></Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
