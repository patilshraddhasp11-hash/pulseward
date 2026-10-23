import React from 'react';
import { useHospital } from '../../context/HospitalContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useHospital();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
        let borderClass = 'border-slate-700 bg-slate-900/95 text-slate-100';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
          borderClass = 'border-emerald-500/30 bg-slate-900/95 text-emerald-100';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
          borderClass = 'border-rose-500/30 bg-slate-900/95 text-rose-100';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
          borderClass = 'border-amber-500/30 bg-slate-900/95 text-amber-100';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-xl border shadow-xl backdrop-blur-md transition-all text-xs ${borderClass}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <div>
                <span className="font-medium">{toast.message}</span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">{toast.timestamp}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
