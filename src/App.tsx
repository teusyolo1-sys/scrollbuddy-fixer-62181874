import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabaseConfigured } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import EditorPage from "./pages/EditorPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutResultPage from "./pages/CheckoutResultPage";
import PixPaymentPage from "./pages/PixPaymentPage";
import EndocenterDashboard from "./pages/EndocenterDashboard";
import LobbyPage from "./pages/LobbyPage";

const SetupNotice = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <div className="text-center max-w-lg space-y-4">
      <h1 className="text-3xl font-bold text-foreground">⚙️ Configuração necessária</h1>
      <p className="text-muted-foreground">
        Para usar o Site Editor Pro, configure as variáveis de ambiente do Supabase no projeto:
      </p>
      <div className="bg-card border border-border rounded-xl p-4 text-left text-sm font-mono space-y-1">
        <p><span className="text-primary">VITE_SUPABASE_URL</span>=https://seu-projeto.supabase.co</p>
        <p><span className="text-primary">VITE_SUPABASE_PUBLISHABLE_KEY</span>=eyJ...</p>
      </div>
      <p className="text-xs text-muted-foreground">Adicione nas configurações do projeto no Lovable (Settings → Environment Variables) ou ative o Lovable Cloud.</p>
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
  const { isAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando...</div>;
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

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
          <Route path="/editor" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/" element={<LobbyPage />} />
          <Route path="/endocenter" element={<EndocenterDashboard />} />
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/checkout/pix" element={<ProtectedRoute><PixPaymentPage /></ProtectedRoute>} />
          <Route path="/checkout/:status" element={<ProtectedRoute><CheckoutResultPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
