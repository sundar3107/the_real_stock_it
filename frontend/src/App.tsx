import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/authentication/context/AuthContext';
import { ProtectedRoute } from './modules/authentication/components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './modules/authentication/pages/LoginPage';
import { RegisterPage } from './modules/authentication/pages/RegisterPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { ProfilePage } from './modules/authentication/pages/ProfilePage';
import { ProductsPage } from './modules/products/pages/ProductsPage';
import { InventoryPage } from './modules/inventory/pages/InventoryPage';
import { SuppliersPage } from './modules/suppliers/pages/SuppliersPage';
import { CustomersPage } from './modules/customers/pages/CustomersPage';
import { PurchasesPage } from './modules/purchases/pages/PurchasesPage';
import { SalesPage } from './modules/sales/pages/SalesPage';
import { InvoicesPage } from './modules/invoices/pages/InvoicesPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes enclosed by ProtectedRoute and AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
