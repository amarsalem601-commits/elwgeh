import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import AssistantChatPage from "./pages/AssistantChatPage";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import InventoryPage from "./pages/InventoryPage";
import ReportsPage from "./pages/ReportsPage";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import EmployeesPage from "./pages/EmployeesPage";
import SettingsPage from "./pages/SettingsPage";
import EmployeeViewPage from "./pages/EmployeeViewPage";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage";
import AttendancePage from "./pages/AttendancePage";
import LocationTrackingPage from "./pages/LocationTrackingPage";
import ExpensesPage from "./pages/ExpensesPage";
import SalariesPage from "./pages/SalariesPage";
import TasksPage from "./pages/TasksPage";
import NotificationsPage from "./pages/NotificationsPage";
import RepairBookingPage from "./pages/RepairBookingPage";
import RepairManagementPage from "./pages/RepairManagementPage";
import InvoicesPage from "./pages/InvoicesPage";
import AccountingPage from "./pages/AccountingPage";
import WarehousesPage from "./pages/WarehousesPage";
import CRMPage from "./pages/CRMPage";
import RepairPageDesignPage from "./pages/RepairPageDesignPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileManagementPage from "./pages/ProfileManagementPage";
import DatabaseViewerPage from "./pages/DatabaseViewerPage";
import TeamManagementPage from "./pages/TeamManagementPage";
import AboutPage from "./pages/public/AboutPage";
import BranchesPage from "./pages/public/BranchesPage";
import ContactPage from "./pages/public/ContactPage";
import TeamPage from "./pages/public/TeamPage";
import DashboardLayout from "./components/DashboardLayout";
import EmployeeLayout from "./components/EmployeeLayout";
import OfflineScreen from "./components/OfflineScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userRole !== 'admin') return <Navigate to="/employee-dashboard" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const EmployeeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userRole === 'admin') return <Navigate to="/assistant" replace />;
  return <EmployeeLayout>{children}</EmployeeLayout>;
};

// Admin seed check removed for security - admin should be created via direct edge function call, not on every page load

const AppRoutes = () => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={userRole === 'admin' ? '/assistant' : '/employee-dashboard'} replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={userRole === 'admin' ? '/assistant' : '/employee-dashboard'} replace /> : <SignupPage />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? (userRole === 'admin' ? '/assistant' : '/employee-dashboard') : '/repair-booking'} replace />} />
      
      {/* Admin routes */}
      <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
      <Route path="/admin-dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
      <Route path="/assistant" element={<AdminRoute><AssistantChatPage /></AdminRoute>} />
      <Route path="/products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
      <Route path="/sales" element={<AdminRoute><SalesPage /></AdminRoute>} />
      <Route path="/purchases" element={<AdminRoute><PurchasesPage /></AdminRoute>} />
      <Route path="/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
      <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
      <Route path="/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
      <Route path="/suppliers" element={<AdminRoute><SuppliersPage /></AdminRoute>} />
      <Route path="/employees" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
      <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      <Route path="/employee-view/:userId" element={<AdminRoute><EmployeeViewPage /></AdminRoute>} />
      <Route path="/attendance" element={<AdminRoute><AttendancePage /></AdminRoute>} />
      <Route path="/location-tracking" element={<AdminRoute><LocationTrackingPage /></AdminRoute>} />
      <Route path="/expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />
      <Route path="/salaries" element={<AdminRoute><SalariesPage /></AdminRoute>} />
      <Route path="/tasks" element={<AdminRoute><TasksPage /></AdminRoute>} />
      <Route path="/notifications" element={<AdminRoute><NotificationsPage /></AdminRoute>} />
      <Route path="/repairs" element={<AdminRoute><RepairManagementPage /></AdminRoute>} />
      <Route path="/invoices" element={<AdminRoute><InvoicesPage /></AdminRoute>} />
      <Route path="/accounting" element={<AdminRoute><AccountingPage /></AdminRoute>} />
      <Route path="/warehouses" element={<AdminRoute><WarehousesPage /></AdminRoute>} />
      <Route path="/crm" element={<AdminRoute><CRMPage /></AdminRoute>} />
      <Route path="/repair-design" element={<AdminRoute><RepairPageDesignPage /></AdminRoute>} />
      <Route path="/profile" element={<AdminRoute><ProfilePage /></AdminRoute>} />
      <Route path="/profile-management" element={<AdminRoute><ProfileManagementPage /></AdminRoute>} />
      <Route path="/team-management" element={<AdminRoute><TeamManagementPage /></AdminRoute>} />
      <Route path="/database" element={<AdminRoute><DatabaseViewerPage /></AdminRoute>} />

      {/* Public pages */}
      <Route path="/repair-booking" element={<RepairBookingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/branches" element={<BranchesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/team" element={<TeamPage />} />

      {/* Employee routes */}
      <Route path="/employee-dashboard" element={<EmployeeRoute><EmployeeDashboardPage /></EmployeeRoute>} />
      <Route path="/employee/products" element={<EmployeeRoute><ProductsPage /></EmployeeRoute>} />
      <Route path="/employee/sales" element={<EmployeeRoute><SalesPage /></EmployeeRoute>} />
      <Route path="/employee/purchases" element={<EmployeeRoute><PurchasesPage /></EmployeeRoute>} />
      <Route path="/employee/inventory" element={<EmployeeRoute><InventoryPage /></EmployeeRoute>} />
      <Route path="/employee/reports" element={<EmployeeRoute><ReportsPage /></EmployeeRoute>} />
      <Route path="/employee/customers" element={<EmployeeRoute><CustomersPage /></EmployeeRoute>} />
      <Route path="/employee/suppliers" element={<EmployeeRoute><SuppliersPage /></EmployeeRoute>} />
      <Route path="/employee/attendance" element={<EmployeeRoute><AttendancePage /></EmployeeRoute>} />
      <Route path="/employee/tasks" element={<EmployeeRoute><TasksPage /></EmployeeRoute>} />
      <Route path="/employee/notifications" element={<EmployeeRoute><NotificationsPage /></EmployeeRoute>} />
      <Route path="/employee/salaries" element={<EmployeeRoute><SalariesPage /></EmployeeRoute>} />
      <Route path="/employee/profile" element={<EmployeeRoute><ProfilePage /></EmployeeRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <OfflineScreen>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </OfflineScreen>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
