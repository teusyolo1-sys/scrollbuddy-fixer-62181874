import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabaseConfigured } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AgencyWalletPage from "./pages/AgencyWalletPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import EndocenterDashboard from "./pages/EndocenterDashboard";
import LobbyPage from "./pages/LobbyPage";
import PermissionsPage from "./pages/PermissionsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const SetupNotice = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <div className="text-center max-w-lg space-y-4">
      <h1 className="text-3xl font-bold text-foreground">⚙️ Configuração necessária</h1>
      <p className="text-muted-foreground">
        Para usar o TaskFlow, configure as variáveis de ambiente do Supabase no projeto:
      </p>
      <div className="bg-card border border-border rounded-xl p-4 text-left text-sm font-mono space-y-1">
        <p><span className="text-primary">VITE_SUPABASE_URL</span>=https://seu-projeto.supabase.co</p>
        <p><span className="text-primary">VITE_SUPABASE_PUBLISHABLE_KEY</span>=eyJ...</p>
      </div>
    </div>
  </div>
);

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useUserRole();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando...</div>;
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
    return (
      <BrowserRouter>
        <SetupNotice />
      </BrowserRouter>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Sonner />
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
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
