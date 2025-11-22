import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Tournaments from "./pages/Tournaments";
import Wallet from "./pages/Wallet";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Withdrawals from "./pages/Withdrawals";
import Deposits from "./pages/Deposits";
import ForgotPassword from "./components/ForgotPassword";
import Banners from "./pages/Banners";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password-otp" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="messages" element={<Messages />} />
            <Route path="withdrawals" element={<Withdrawals />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="banners" element={<Banners />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;