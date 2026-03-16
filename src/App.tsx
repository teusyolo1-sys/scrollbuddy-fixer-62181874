import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabaseConfigured } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import LoadingScreen from "@/components/LoadingScreen";

// Lazy load das páginas
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LobbyPage = lazy(() => import("./pages/LobbyPage"));
const EndocenterDashboard = lazy(() => import("./pages/EndocenterDashboard"));
const PermissionsPage = lazy(() => import("./pages/PermissionsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AgencyWalletPage = lazy(() => import("./pages/AgencyWalletPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

const SetupNotice = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <div className="text-center max-w-lg space-y-4">
      <h1 className="text-3xl font-bold text-foreground">⚙️ Configuração necessária</h1>
      <p className="text-muted-foreground">Configure as variáveis de ambiente do Supabase.</p>
    </div>
  </div>
);

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useUserRole();
  if (loading) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => {
  if (!supabaseConfigured) {
    return <BrowserRouter><SetupNotice /></BrowserRouter>;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Sonner />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
            <Route path="/" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
            <Route path="/endocenter/:companyId" element={<ProtectedRoute><EndocenterDashboard /></ProtectedRoute>} />
            <Route path="/endocenter" element={<ProtectedRoute><EndocenterDashboard /></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute><AdminRoute><PermissionsPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/agency-wallet" element={<ProtectedRoute><AdminRoute><AgencyWalletPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
