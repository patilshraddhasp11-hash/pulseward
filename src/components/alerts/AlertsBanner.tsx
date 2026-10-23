import React from 'react';
import { useHospital } from '../../context/HospitalContext';
import { AlertTriangle, CheckCircle2, ChevronRight, Bell } from 'lucide-react';

interface AlertsBannerProps {
  onNavigateToPatient: (patientId: string) => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ onNavigateToPatient }) => {
  const { alerts, acknowledgeAlert } = useHospital();

  const criticalAlerts = alerts.filter(a => !a.acknowledged && a.severity === 'critical');

  if (criticalAlerts.length === 0) return null;

  const topAlert = criticalAlerts[0];

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 sm:px-6 shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-rose-700 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider font-mono mr-2">
              CRITICAL TELEMETRY ALERT:
            </span>
            <span className="text-xs font-semibold">{topAlert.patientName}</span>
            <span className="text-xs opacity-90 mx-1.5">({topAlert.bed} · {topAlert.ward})</span>
            <span className="text-xs font-mono font-bold bg-rose-800 px-2 py-0.5 rounded">
              {topAlert.metric}: {topAlert.value}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => onNavigateToPatient(topAlert.patientId)}
            className="text-xs font-medium underline hover:text-rose-100 flex items-center gap-1"
          >
            <span>Review Bedside Telemetry</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => acknowledgeAlert(topAlert.id)}
            className="px-2.5 py-1 text-xs font-semibold bg-white text-rose-700 hover:bg-rose-50 rounded shadow-sm transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
