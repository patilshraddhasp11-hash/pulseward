import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AlertsBanner } from './components/alerts/AlertsBanner';
import { VitalsMonitor } from './components/vitals/VitalsMonitor';
import { PatientDirectory } from './components/patients/PatientDirectory';
import { DiagnosticSlideViewer } from './components/slides/DiagnosticSlideViewer';
import { StaffManagement } from './components/staff/StaffManagement';
import { AppointmentsScheduler } from './components/appointments/AppointmentsScheduler';
import { DischargeBilling } from './components/billing/DischargeBilling';
import { EncryptionAuditModal } from './components/security/EncryptionAuditModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ShortcutsModal } from './components/common/ShortcutsModal';

const MainWorkstation: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { selectPatient, selectedPatient, toggleLiveTelemetry, snoozeAlarm, triggerSimulatedEmergency } = useHospital();
  const [currentTab, setCurrentTab] = useState<string>('vitals');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // Global hotkeys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in form inputs
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === '1') setCurrentTab('vitals');
      else if (e.key === '2') setCurrentTab('records');
      else if (e.key === '3') setCurrentTab('slides');
      else if (e.key === '4') setCurrentTab('staff');
      else if (e.key === '5') setCurrentTab('appointments');
      else if (e.key === '6') setCurrentTab('billing');
      else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsModalOpen(prev => !prev);
      } else if (e.code === 'Space') {
        e.preventDefault();
        toggleLiveTelemetry();
      } else if (e.key.toLowerCase() === 's') {
        snoozeAlarm(120);
      } else if (e.key.toLowerCase() === 'e') {
        triggerSimulatedEmergency(selectedPatient.id);
      } else if (e.key === 'Escape') {
        setIsAuditModalOpen(false);
        setIsShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLiveTelemetry, snoozeAlarm, triggerSimulatedEmergency, selectedPatient.id]);

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  const handleNavigateToPatient = (patientId: string) => {
    selectPatient(patientId);
    setCurrentTab('vitals');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Critical Alert Bar */}
      <AlertsBanner onNavigateToPatient={handleNavigateToPatient} />

      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Workspace: Sidebar + Dynamic Content Viewport */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onOpenAuditModal={() => setIsAuditModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'vitals' && <VitalsMonitor />}
          {currentTab === 'records' && <PatientDirectory />}
          {currentTab === 'slides' && <DiagnosticSlideViewer />}
          {currentTab === 'staff' && <StaffManagement />}
          {currentTab === 'appointments' && <AppointmentsScheduler />}
          {currentTab === 'billing' && <DischargeBilling />}
        </main>
      </div>

      {/* Modals & Floating Notifications */}
      <EncryptionAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HospitalProvider>
          <MainWorkstation />
        </HospitalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
