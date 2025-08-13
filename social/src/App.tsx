import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastNotificationProvider } from "./context/NotificationContext";
import { DatabaseNotificationProvider } from "./context/DatabaseNotificationContext";
import Layout from "./components/Layout";
import ErrorBoundaryEnhanced from "./components/ErrorBoundaryEnhanced";
import { Home } from "./pages/Home.tsx";
import { Login } from "./pages/Login";
import { AdminLogin } from "./pages/AdminLogin";
import { AlumniLogin } from "./pages/AlumniLogin";
import { StudentLogin } from "./pages/StudentLogin";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { Directory } from "./pages/Directory";
import { Connections } from "./pages/Connections";
import Messages from "./pages/Messages";
import { Announcements } from "./pages/Announcements";
import { Jobs } from "./pages/Jobs";
import { Events } from "./pages/Events";
import { AdminDashboard } from "./pages/AdminDashboard";
import SystemDiagnostics from "./components/SystemDiagnostics";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route Component (redirects to home if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/admin-login" element={
        <PublicRoute>
          <AdminLogin />
        </PublicRoute>
      } />
      <Route path="/alumni-login" element={
        <PublicRoute>
          <AlumniLogin />
        </PublicRoute>
      } />
      <Route path="/student-login" element={
        <PublicRoute>
          <StudentLogin />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Protected Routes with Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="directory" element={<Directory />} />
        <Route path="connections" element={<Connections />} />
        <Route path="messages" element={<Messages />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="events" element={<Events />} />
        <Route path="admin-dashboard" element={<AdminDashboard />} />
        <Route path="diagnostics" element={<SystemDiagnostics />} />
      </Route>

      {/* Catch-all route - redirect /home to / */}
      <Route path="/home" element={<Navigate to="/" replace />} />
      
      {/* Catch-all route for any other unmatched routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundaryEnhanced>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ErrorBoundaryEnhanced>
            <ToastNotificationProvider>
              <DatabaseNotificationProvider>
                <ErrorBoundaryEnhanced>
                  <AppRoutes />
                </ErrorBoundaryEnhanced>
              </DatabaseNotificationProvider>
            </ToastNotificationProvider>
          </ErrorBoundaryEnhanced>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundaryEnhanced>
  );
}

export default App;