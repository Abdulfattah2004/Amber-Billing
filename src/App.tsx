import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DataProvider } from "@/contexts/DataContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Customers from "@/pages/Customers";
import AddCustomer from "@/pages/AddCustomer";
import Receipts from "@/pages/Receipts";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import DieselPurchases from "@/pages/DieselPurchases";
import Employees from "@/pages/Employees";
import Expenses from "@/pages/Expenses";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AuthGate = () => {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <DataProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Customers />} />
          <Route path="/add-customer" element={<AdminRoute><AddCustomer /></AdminRoute>} />
          <Route path="/edit-customer/:id" element={<AdminRoute><AddCustomer /></AdminRoute>} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/diesel" element={<AdminRoute><DieselPurchases /></AdminRoute>} />
          <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
          <Route path="/expenses" element={<AdminRoute><Expenses /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </DataProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/*" element={<AuthGate />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
