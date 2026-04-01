import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FamilyProvider, useFamily } from './contexts/FamilyContext';
import theme from './theme';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import SendMoneyPage from './pages/SendMoneyPage';
import LogExpensePage from './pages/LogExpensePage';
import ExpensesPage from './pages/ExpensesPage';
import SettlementsPage from './pages/SettlementsPage';
import MemberProfilePage from './pages/MemberProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import { CircularProgress, Box } from '@mui/material';
import AppWatermark from './components/AppWatermark';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=signin" replace />;
  }

  return <>{children}</>;
}

function FamilyRoute({ children }: { children: React.ReactNode }) {
  const { family, loading } = useFamily();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!family) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppWatermark />
      <BrowserRouter>
        <AuthProvider>
          <FamilyProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <SetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <DashboardPage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-money"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <SendMoneyPage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/log-expense"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <LogExpensePage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <ExpensesPage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settlements"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <SettlementsPage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/member/:memberId"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <MemberProfilePage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <NotificationsPage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <FamilyRoute>
                      <SettingsPage />
                    </FamilyRoute>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </FamilyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
