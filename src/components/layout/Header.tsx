import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Stethoscope,
  HeartPulse,
  UserCog,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onOpenAuditModal: () => void;
  onOpenShortcutsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenAuditModal,
  onOpenShortcutsModal,
}) => {
  const { currentUser, role, switchDemoRole, logout } = useAuth();
  const {
    alerts,
    unacknowledgedAlertsCount,
    acknowledgeAlert,
    isAudioAlertEnabled,
    toggleAudioAlert,
    isLiveTelemetryActive,
    toggleLiveTelemetry,
    snoozeAlarm,
    isAlarmSnoozed,
  } = useHospital();
  const { theme, toggleTheme } = useTheme();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const getRoleIcon = () => {
    switch (role) {
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5 text-teal-500" />;
      case 'nurse':
        return <HeartPulse className="w-3.5 h-3.5 text-cyan-500" />;
      case 'admin':
        return <UserCog className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark + Mobile hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setCurrentTab('vitals');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" />
              PulseWard Telemetry
            </a>
          </div>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setCurrentTab('vitals')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                currentTab === 'vitals' ? 'border-teal-500 text-slate-900 dark:text-white font-semibold' : 'border-transparent'
              }`}
            >
              Vitals Telemetry
            </button>
            <button
              onClick={() => setCurrentTab('records')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                currentTab === 'records' ? 'border-teal-500 text-slate-900 dark:text-white font-semibold' : 'border-transparent'
              }`}
            >
              Medical Records
            </button>
            <button
              onClick={() => setCurrentTab('slides')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                currentTab === 'slides' ? 'border-teal-500 text-slate-900 dark:text-white font-semibold' : 'border-transparent'
              }`}
            >
              Diagnostic Slides
            </button>
            <button
              onClick={() => setCurrentTab('staff')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                currentTab === 'staff' ? 'border-teal-500 text-slate-900 dark:text-white font-semibold' : 'border-transparent'
              }`}
            >
              Staff Assignments
            </button>
            <button
              onClick={() => setCurrentTab('appointments')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                currentTab === 'appointments' ? 'border-teal-500 text-slate-900 dark:text-white font-semibold' : 'border-transparent'
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setCurrentTab('billing')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                currentTab === 'billing' ? 'border-teal-500 text-slate-900 dark:text-white font-semibold' : 'border-transparent'
              }`}
            >
              Discharge & Billing
            </button>
          </nav>

          {/* Zone 3: Primary action & system toggles */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live stream toggle */}
            <button
              type="button"
              onClick={toggleLiveTelemetry}
              title={isLiveTelemetryActive ? 'Pause Telemetry Stream' : 'Resume Telemetry Stream'}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isLiveTelemetryActive
                  ? 'border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveTelemetryActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="whitespace-nowrap">{isLiveTelemetryActive ? 'Telemetry Live' : 'Paused'}</span>
            </button>

            {/* Audio Alert Chime Toggle & Snooze */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleAudioAlert}
                title={isAudioAlertEnabled ? 'Urgent Chime: Active (Click to Mute)' : 'Urgent Chime: Muted (Click to Enable Sound)'}
                className={`p-2 rounded-lg border transition-colors ${
                  isAudioAlertEnabled
                    ? 'border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label="Toggle Alert Audio"
              >
                {isAudioAlertEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {isAudioAlertEnabled && (
                <button
                  type="button"
                  onClick={() => snoozeAlarm(120)}
                  title={isAlarmSnoozed ? 'Alarm Snoozed' : 'Snooze Audible Alarms (120s)'}
                  className={`px-2 py-1.5 text-[11px] font-mono rounded-lg border transition-all ${
                    isAlarmSnoozed
                      ? 'bg-amber-500 text-white font-bold border-amber-600 animate-pulse'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isAlarmSnoozed ? 'Snoozed' : 'Snooze'}
                </button>
              )}
            </div>

            {/* Keyboard Shortcuts Trigger */}
            <button
              type="button"
              onClick={onOpenShortcutsModal}
              title="Workstation Hotkeys (?)"
              className="hidden md:flex p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-mono text-xs font-bold w-8 h-8 items-center justify-center"
              aria-label="View keyboard shortcuts"
            >
              ?
            </button>

            {/* Real-time Alerts Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="View urgent health alerts"
              >
                <Bell className="w-4 h-4" />
                {unacknowledgedAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold text-white bg-rose-600 rounded-full flex items-center justify-center">
                    {unacknowledgedAlertsCount}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown Modal */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                        Patient Health Alerts
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {unacknowledgedAlertsCount} Unresolved
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-1">
                    {alerts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No critical alerts active. All patient vitals nominal.
                      </div>
                    ) : (
                      alerts.slice(0, 6).map(alt => (
                        <div key={alt.id} className="py-2.5 flex items-start justify-between gap-3">
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {alt.patientName}
                              </span>
                              <span className="text-[11px] text-slate-500">· {alt.bed}</span>
                            </div>
                            <div className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-0.5">
                              {alt.metric}: {alt.value}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {alt.timestamp} · {alt.threshold}
                            </div>
                          </div>

                          {!alt.acknowledged ? (
                            <button
                              type="button"
                              onClick={() => acknowledgeAlert(alt.id)}
                              className="px-2 py-1 text-[11px] font-medium bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors whitespace-nowrap"
                            >
                              Ack
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Acknowledged</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                    <button
                      onClick={() => {
                        setCurrentTab('vitals');
                        setIsAlertsOpen(false);
                      }}
                      className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                    >
                      Open Telemetry Monitor →
                    </button>
                    <button
                      onClick={() => setIsAlertsOpen(false)}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme representation"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* HIPAA Encryption Inspection Badge */}
            <button
              type="button"
              onClick={onOpenAuditModal}
              title="HIPAA Security & Cryptographic Audit Trail"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AES-256 Encrypted</span>
            </button>

            {/* Role Profile & Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300">
                  {currentUser?.avatarInitials || 'MD'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {currentUser?.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1">
                    {getRoleIcon()}
                    {role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Role Switcher Menu */}
              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-left">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Switch Role Profile
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {currentUser?.department}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('doctor');
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      role === 'doctor' ? 'font-semibold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
                    <div>
                      <div>Dr. Evelyn Vance</div>
                      <div className="text-[10px] text-slate-400 font-normal">Doctor / Attending MD</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('nurse');
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      role === 'nurse' ? 'font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <HeartPulse className="w-3.5 h-3.5 text-cyan-500" />
                    <div>
                      <div>Marcus Reed, RN</div>
                      <div className="text-[10px] text-slate-400 font-normal">ICU Charge Nurse</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('admin');
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      role === 'admin' ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <UserCog className="w-3.5 h-3.5 text-indigo-500" />
                    <div>
                      <div>Sarah Jenkins</div>
                      <div className="text-[10px] text-slate-400 font-normal">Hospital Administrator</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsRoleMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
