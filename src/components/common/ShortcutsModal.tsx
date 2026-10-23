import React from 'react';
import { Command, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 - 6', desc: 'Switch clinical views (Telemetry, Records, Slides, Staff, Appointments, Billing)' },
    { key: 'Space', desc: 'Pause / Resume real-time telemetry stream' },
    { key: 'S', desc: 'Snooze active audible alerts for 120 seconds' },
    { key: 'E', desc: 'Trigger simulated emergency crash-cart telemetry' },
    { key: '← / →', desc: 'Previous / Next slide in Diagnostic Slide Viewer' },
    { key: 'Esc', desc: 'Close any open modal or presentation' },
    { key: '?', desc: 'Toggle this keyboard shortcuts dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Clinical Workstation Hotkeys
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
