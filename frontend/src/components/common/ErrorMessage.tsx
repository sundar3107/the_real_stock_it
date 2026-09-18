import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message?: string | null;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss, className = '' }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
        <span className="font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto text-red-500 hover:text-red-700 p-0.5 rounded transition"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
