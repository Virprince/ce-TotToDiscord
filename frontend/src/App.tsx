import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Activity, Settings, FileText, Users, TestTube2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';

// Pages
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { RulesPage } from '@/pages/Rules';
import { WatchedEntitiesPage } from '@/pages/WatchedEntities';
import { LogsPage } from '@/pages/Logs';
import { TestingPage } from '@/pages/Testing';
import { SettingsPage } from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function Navigation() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const links = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/rules', label: 'Règles', icon: Settings },
    { to: '/entities', label: 'Entités surveillées', icon: Users },
    { to: '/logs', label: 'Logs', icon: FileText },
    { to: '/testing', label: 'Tests', icon: TestTube2 }
  ];
  
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6" />
              <span className="text-lg font-bold">CE - Tot To Discord</span>
            </div>
            
            <div className="flex space-x-1">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname === to
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/rules" element={<RulesPage />} />
                  <Route path="/entities" element={<WatchedEntitiesPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="/testing" element={<TestingPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}