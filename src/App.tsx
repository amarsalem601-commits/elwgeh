import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AssistantChatPage = lazy(() => import("./pages/AssistantChatPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const PurchasesPage = lazy(() => import("./pages/PurchasesPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const EmployeeViewPage = lazy(() => import("./pages/EmployeeViewPage"));
const EmployeeDashboardPage = lazy(() => import("./pages/EmployeeDashboardPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const LocationTrackingPage = lazy(() => import("./pages/LocationTrackingPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const SalariesPage = lazy(() => import("./pages/SalariesPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const RepairBookingPage = lazy(() => import("./pages/RepairBookingPage"));
const RepairManagementPage = lazy(() => import("./pages/RepairManagementPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const AccountingPage = lazy(() => import("./pages/AccountingPage"));
const WarehousesPage = lazy(() => import("./pages/WarehousesPage"));
const CRMPage = lazy(() => import("./pages/CRMPage"));
const RepairPageDesignPage = lazy(() => import("./pages/RepairPageDesignPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ProfileManagementPage = lazy(() => import("./pages/ProfileManagementPage"));
const DatabaseViewerPage = lazy(() => import("./pages/DatabaseViewerPage"));
const TeamManagementPage = lazy(() => import("./pages/TeamManagementPage"));
const AboutPage = lazy(() => import("./pages/public/AboutPage"));
const BranchesPage = lazy(() => import("./pages/public/BranchesPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));
const TeamPage = lazy(() => import("./pages/public/TeamPage"));
import DashboardLayout from "./components/DashboardLayout";
import EmployeeLayout from "./components/EmployeeLayout";
import OfflineScreen from "./components/OfflineScreen";
const NotFound = lazy(() => import("./pages/NotFound"));

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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
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
    </Suspense>
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
