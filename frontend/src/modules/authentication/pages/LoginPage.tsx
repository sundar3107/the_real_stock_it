import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { Package } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md mb-3">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">StockIT Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to access your inventory and supply chain workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <LoginForm onSuccess={() => navigate(from, { replace: true })} />

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                Register new user
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials for Reviewers */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-700 mb-1">Default Admin Credentials:</div>
            <div>Email: <code className="text-blue-600 font-mono">admin@stockit.local</code></div>
            <div>Password: <code className="text-blue-600 font-mono">Admin@123456</code></div>
          </div>
        </div>
      </div>
    </div>
  );
};
