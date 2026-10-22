import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/authentication/hooks/useAuth';
import { Button } from '../common/Button';
import { Package, LogOut } from 'lucide-react';
import { NotificationDropdown } from '../../modules/notifications/components/NotificationDropdown';

export const Header: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Name */}
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">StockIT</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                SCM System
              </span>
            </div>
          </Link>

          {/* User Profile, Notifications & Actions */}
          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notification Indicator Bell */}
              <NotificationDropdown />

              <div className="h-6 w-px bg-slate-200" />

              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition text-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                  {user.full_name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-800 leading-none">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] font-medium text-blue-600 mt-0.5">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 hover:border-red-200"
                title="Sign out of system"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
