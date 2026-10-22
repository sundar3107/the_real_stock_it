import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  XCircle,
  Truck,
  ShoppingBag,
  Receipt,
  Info,
  CheckCheck,
  Check,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { INotification, NotificationType } from '../types/notification.types';
import { notificationService } from '../services/notificationService';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | NotificationType>('ALL');
  const [page, setPage] = useState(1);
  const limit = 15;
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const isReadParam = activeFilter === 'UNREAD' ? 'false' : undefined;
      const typeParam =
        activeFilter !== 'ALL' && activeFilter !== 'UNREAD' ? activeFilter : undefined;

      const res = await notificationService.getNotifications({
        page,
        limit,
        is_read: isReadParam,
        type: typeParam,
      });

      setNotifications(res.notifications);
      setTotal(res.total);
      setUnreadCount(res.unread_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateRelated = (notif: INotification) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }

    if (notif.reference_type === 'PRODUCT') {
      navigate('/inventory');
    } else if (notif.reference_type === 'PURCHASE_ORDER') {
      navigate('/purchases');
    } else if (notif.reference_type === 'SALES_ORDER') {
      navigate('/sales');
    } else if (notif.reference_type === 'INVOICE') {
      navigate('/invoices');
    }
  };

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'PURCHASE_ORDER':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'SALES_ORDER':
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'INVOICE':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const filterTabs: { id: 'ALL' | 'UNREAD' | NotificationType; label: string }[] = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'UNREAD', label: `Unread (${unreadCount})` },
    { id: 'LOW_STOCK', label: 'Low Stock' },
    { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
    { id: 'PURCHASE_ORDER', label: 'Purchases' },
    { id: 'SALES_ORDER', label: 'Sales' },
    { id: 'INVOICE', label: 'Invoices' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Notifications &amp; Alert Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock alerts, inventory health thresholds, and critical operational events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            title="Refresh Notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveFilter(tab.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <div className="text-xs">Fetching alert events...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">All clear! No alerts found.</div>
            <div className="text-xs">There are no notifications matching the selected filter.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.is_read ? 'bg-blue-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 ${
                      notif.type === 'OUT_OF_STOCK'
                        ? 'bg-rose-100'
                        : notif.type === 'LOW_STOCK'
                        ? 'bg-amber-100'
                        : notif.type === 'PURCHASE_ORDER'
                        ? 'bg-blue-100'
                        : notif.type === 'SALES_ORDER'
                        ? 'bg-emerald-100'
                        : 'bg-slate-100'
                    }`}
                  >
                    {renderIcon(notif.type)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm ${
                          !notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                          NEW
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{notif.message}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {notif.reference_type && (
                    <button
                      onClick={() => handleNavigateRelated(notif)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                    >
                      <span>View Record</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!notif.is_read ? (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 px-2 py-1 italic">Read</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {total > limit && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} alerts
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
