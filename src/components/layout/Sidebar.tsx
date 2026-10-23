import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  FileText,
  Layers,
  Users,
  Calendar,
  CreditCard,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onOpenAuditModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenAuditModal,
}) => {
  const { patients, selectedPatientId, selectPatient, activeWardFilter, setActiveWardFilter } = useHospital();
  const { role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const wardTabs = ['All', 'ICU', 'Neurology', 'Surgery', 'Pediatrics'];

  const filteredPatients = patients.filter(p => {
    const matchWard =
      activeWardFilter === 'All' ||
      p.ward.toLowerCase().includes(activeWardFilter.toLowerCase()) ||
      (activeWardFilter === 'Surgery' && p.ward.toLowerCase().includes('general'));

    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase());

    return matchWard && matchQuery;
  });

  const navItems = [
    { id: 'vitals', label: 'Vitals Telemetry', icon: Activity, desc: 'Real-time bedside monitor' },
    { id: 'records', label: 'Medical History & EMR', icon: FileText, desc: 'Records & sync notes' },
    { id: 'slides', label: 'Diagnostic Slides', icon: Layers, desc: 'Consultation image viewer' },
    { id: 'staff', label: 'Staff Assignments', icon: Users, desc: 'Doctors & nurse roster' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, desc: 'Doctor availability & slots' },
    { id: 'billing', label: 'Billing & Discharge', icon: CreditCard, desc: 'Clearance & invoicing' },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">Critical</span>;
      case 'observation':
        return <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Observe</span>;
      case 'ready-discharge':
        return <span className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">Discharge</span>;
      default:
        return <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Stable</span>;
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 w-72 shrink-0">
      {/* Primary Workspace Navigation Links */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
          Clinical Workspace
        </div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <div className="flex-1 truncate">
                  <div className="leading-tight font-semibold">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Patient Bedside Selector */}
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Patients ({filteredPatients.length})
          </span>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Bedside Queue</span>
        </div>

        {/* Ward Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {wardTabs.map(ward => (
            <button
              key={ward}
              type="button"
              onClick={() => setActiveWardFilter(ward)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all whitespace-nowrap ${
                activeWardFilter === ward
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {ward}
            </button>
          ))}
        </div>

        {/* Filter search */}
        <div className="relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bed, MRN, name..."
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Patient List */}
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
          {filteredPatients.map(patient => {
            const isSelected = patient.id === selectedPatientId;
            const isCritical = patient.currentVitals.alertLevel === 'critical';

            return (
              <button
                key={patient.id}
                type="button"
                onClick={() => {
                  selectPatient(patient.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-teal-500 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/60'
                }`}
              >
                {isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-teal-500 rounded-r" />
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {patient.name}
                  </span>
                  {getStatusBadge(patient.status)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{patient.bed}</span>
                  <span className="font-mono text-[10px]">{patient.ward}</span>
                </div>

                {/* Micro vitals summary */}
                <div className="flex items-center justify-between text-[10px] font-mono mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className={isCritical ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                    HR: {patient.currentVitals.heartRate} bpm
                  </span>
                  <span className={patient.currentVitals.spO2 < 92 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                    SpO2: {patient.currentVitals.spO2}%
                  </span>
                  <span className="text-slate-500">
                    BP: {patient.currentVitals.systolicBP}/{patient.currentVitals.diastolicBP}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security & Audit Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900">
        <button
          type="button"
          onClick={onOpenAuditModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Security Audit Trail (AES-256)</span>
        </button>
        <div className="text-[10px] text-center text-slate-400 mt-1.5 flex items-center justify-center gap-1">
          <span>PulseWard Workstation</span>
          <span>·</span>
          <span className="font-semibold text-teal-600 dark:text-teal-400 uppercase">{role}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block shrink-0">{content}</aside>

      {/* Mobile drawer backdrop and overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
