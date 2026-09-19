import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { LayoutDashboard, Package, Boxes, Truck, UserCheck, Layers } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Inventory', path: '/inventory', icon: Boxes },
    { label: 'Suppliers', path: '/suppliers', icon: Truck },
    { label: 'My Profile', path: '/profile', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}

            {/* Modular Integration Placeholder for upcoming modules */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <div className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Layers className="w-3.5 h-3.5" />
                <span>Upcoming SCM Modules</span>
              </div>
              <div className="px-3 py-1 text-xs text-slate-400 italic">
                Customers, Purchases & Sales will link here in future modules.
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Stock Management System &bull; SCM Project Baseline &bull; Module 4: Supplier Management
      </footer>
    </div>
  );
};
