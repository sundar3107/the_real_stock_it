import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/authentication/context/AuthContext';
import { ProtectedRoute } from './modules/authentication/components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './modules/authentication/pages/LoginPage';
import { RegisterPage } from './modules/authentication/pages/RegisterPage';
import { WelcomeDashboardPage } from './modules/authentication/pages/WelcomeDashboardPage';
import { ProfilePage } from './modules/authentication/pages/ProfilePage';
import { ProductsPage } from './modules/products/pages/ProductsPage';
import { InventoryPage } from './modules/inventory/pages/InventoryPage';

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
            <Route path="/dashboard" element={<WelcomeDashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
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
