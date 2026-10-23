import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Patient,
  PatientVitalReading,
  ClinicalNote,
  Medication,
  StaffMember,
  Appointment,
  PatientBilling,
  RealtimeAlert,
  PatientStatus,
  ToastNotification,
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_STAFF,
  INITIAL_APPOINTMENTS,
  INITIAL_BILLINGS,
  INITIAL_ALERTS,
} from '../data/mockData';
import { logSecurityAudit } from '../services/encryption';
import { useAuth } from './AuthContext';

interface HospitalContextType {
  patients: Patient[];
  selectedPatientId: string;
  selectedPatient: Patient;
  selectPatient: (id: string) => void;
  // Ward filter
  activeWardFilter: string;
  setActiveWardFilter: (ward: string) => void;
  // Real-time telemetry
  isLiveTelemetryActive: boolean;
  toggleLiveTelemetry: () => void;
  telemetrySpeedMs: number;
  setTelemetrySpeedMs: (ms: number) => void;
  isAudioAlertEnabled: boolean;
  toggleAudioAlert: () => void;
  triggerSimulatedEmergency: (patientId: string) => void;
  // Audio snooze
  alarmSnoozedUntil: number | null;
  snoozeAlarm: (seconds?: number) => void;
  isAlarmSnoozed: boolean;
  // Alerts
  alerts: RealtimeAlert[];
  unacknowledgedAlertsCount: number;
  acknowledgeAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  // Patient records sync
  addVitalReading: (patientId: string, reading: Omit<PatientVitalReading, 'id' | 'timestamp'>) => void;
  addClinicalNote: (patientId: string, noteText: string, category: ClinicalNote['category']) => void;
  addMedication: (patientId: string, medication: Omit<Medication, 'id' | 'startDate' | 'status'>) => void;
  updatePatientStatus: (patientId: string, status: PatientStatus) => void;
  // Staff
  staff: StaffMember[];
  reassignStaffBed: (staffId: string, bedNumber: string) => void;
  updateStaffAvailability: (staffId: string, availability: StaffMember['availability']) => void;
  pageStaffMember: (staffId: string, urgencyMessage: string) => void;
  // Appointments
  appointments: Appointment[];
  scheduleAppointment: (apt: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointmentStatus: (aptId: string, status: Appointment['status']) => void;
  // Billing & Discharge
  billings: PatientBilling[];
  approveDischargeStep: (billId: string, step: keyof PatientBilling['dischargeClearance']) => void;
  markBillingSettled: (billId: string) => void;
  generateDischargeSummary: (billId: string) => void;
  // Toast notifications
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

// Web Audio API emergency beep generator
class MedicalAlarmSounder {
  private audioCtx: AudioContext | null = null;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  playCriticalChime() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5 note
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5 note
      osc.frequency.setValueAtTime(880, now + 0.2); // A5 note

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playWarningChime() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(523.25, now + 0.15); // C5

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio policy safe
    }
  }
}

const alarmSounder = new MedicalAlarmSounder();

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  // State with LocalStorage fallback
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('pulseward_patients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PATIENTS;
      }
    }
    return INITIAL_PATIENTS;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return patients[0]?.id || 'pat_001';
  });

  const [activeWardFilter, setActiveWardFilter] = useState<string>('All');

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('pulseward_staff');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STAFF;
      }
    }
    return INITIAL_STAFF;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('pulseward_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_APPOINTMENTS;
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const [billings, setBillings] = useState<PatientBilling[]>(() => {
    const saved = localStorage.getItem('pulseward_billings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BILLINGS;
      }
    }
    return INITIAL_BILLINGS;
  });

  const [alerts, setAlerts] = useState<RealtimeAlert[]>(() => {
    const saved = localStorage.getItem('pulseward_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ALERTS;
      }
    }
    return INITIAL_ALERTS;
  });

  const [isLiveTelemetryActive, setIsLiveTelemetryActive] = useState<boolean>(true);
  const [telemetrySpeedMs, setTelemetrySpeedMs] = useState<number>(3000);
  const [isAudioAlertEnabled, setIsAudioAlertEnabled] = useState<boolean>(false);
  const [alarmSnoozedUntil, setAlarmSnoozedUntil] = useState<number | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `tst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = {
      id,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts(prev => [...prev.slice(-3), newToast]); // max 4 toasts
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const isAlarmSnoozed = !!(alarmSnoozedUntil && Date.now() < alarmSnoozedUntil);

  const snoozeAlarm = useCallback((seconds: number = 120) => {
    const until = Date.now() + seconds * 1000;
    setAlarmSnoozedUntil(until);
    showToast(`Audible alerts snoozed for ${seconds} seconds`, 'info');
  }, [showToast]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('pulseward_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('pulseward_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('pulseward_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('pulseward_billings', JSON.stringify(billings));
  }, [billings]);

  useEffect(() => {
    localStorage.setItem('pulseward_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const selectPatient = useCallback(
    (id: string) => {
      setSelectedPatientId(id);
      const target = patients.find(p => p.id === id);
      if (target && currentUser) {
        logSecurityAudit(
          currentUser.id,
          currentUser.name,
          role,
          'VIEW_RECORD',
          target.mrn,
          `Opened chart for patient ${target.name} (${target.bed})`
        );
      }
    },
    [patients, currentUser, role]
  );

  // Real-time telemetry generator loop
  const patientsRef = useRef(patients);
  patientsRef.current = patients;
  const isAudioEnabledRef = useRef(isAudioAlertEnabled);
  isAudioEnabledRef.current = isAudioAlertEnabled;
  const alarmSnoozedUntilRef = useRef(alarmSnoozedUntil);
  alarmSnoozedUntilRef.current = alarmSnoozedUntil;

  useEffect(() => {
    if (!isLiveTelemetryActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const isCurrentlySnoozed = alarmSnoozedUntilRef.current && now < alarmSnoozedUntilRef.current;

      setPatients(prevPatients => {
        return prevPatients.map(patient => {
          // If patient is critical or observation, simulate subtle natural fluctuations
          const vit = patient.currentVitals;
          const hrDelta = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const newHR = Math.max(48, Math.min(160, vit.heartRate + hrDelta));

          const bpSysDelta = Math.floor(Math.random() * 3) - 1;
          const newSysBP = Math.max(80, Math.min(210, vit.systolicBP + bpSysDelta));

          const bpDiaDelta = Math.floor(Math.random() * 3) - 1;
          const newDiaBP = Math.max(50, Math.min(125, vit.diastolicBP + bpDiaDelta));

          // Small SpO2 jitter
          const spo2Delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const newSpO2 = Math.max(85, Math.min(100, vit.spO2 + spo2Delta));

          // Temperature gentle fluctuation
          const tempDelta = Math.random() * 0.1 - 0.05;
          const newTemp = +(Math.max(35.5, Math.min(41.0, vit.temperature + tempDelta)).toFixed(1));

          // Detect threshold
          let alertLevel: 'normal' | 'warning' | 'critical' = 'normal';
          let alertReason = '';

          if (newSpO2 < 90 || newHR > 125 || newHR < 48 || newSysBP > 175 || newTemp > 39.2) {
            alertLevel = 'critical';
            alertReason = newSpO2 < 90 ? `SpO2 Critical Drop (${newSpO2}%)` : `Severe Tachycardia (${newHR} bpm)`;
          } else if (newSpO2 < 93 || newHR > 105 || newSysBP > 145 || newTemp > 38.0) {
            alertLevel = 'warning';
            alertReason = `Borderline telemetry reading (HR: ${newHR}, SpO2: ${newSpO2}%)`;
          }

          // If new critical alert arises for patient, notify
          if (alertLevel === 'critical' && vit.alertLevel !== 'critical') {
            if (isAudioEnabledRef.current && !isCurrentlySnoozed) {
              alarmSounder.playCriticalChime();
            }
            setAlerts(prev => [
              {
                id: `alt_${Date.now()}`,
                patientId: patient.id,
                patientName: patient.name,
                bed: patient.bed,
                ward: patient.ward,
                metric: 'Telemetry Breach',
                value: `HR: ${newHR} | SpO2: ${newSpO2}%`,
                threshold: 'Critical Protocol #4',
                severity: 'critical',
                timestamp: 'Just now',
                acknowledged: false,
              },
              ...prev,
            ]);
          }

          const nowTime = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const newReading: PatientVitalReading = {
            ...vit,
            id: `vit_${Date.now()}`,
            timestamp: nowTime,
            heartRate: newHR,
            systolicBP: newSysBP,
            diastolicBP: newDiaBP,
            spO2: newSpO2,
            temperature: newTemp,
            alertLevel,
            alertReason,
          };

          // Append to vitals history (keep last 14 readings)
          const updatedHistory = [...patient.vitalsHistory, newReading].slice(-14);

          return {
            ...patient,
            currentVitals: newReading,
            vitalsHistory: updatedHistory,
          };
        });
      });
    }, telemetrySpeedMs);

    return () => clearInterval(interval);
  }, [isLiveTelemetryActive, telemetrySpeedMs]);

  const toggleLiveTelemetry = () => {
    setIsLiveTelemetryActive(prev => {
      const next = !prev;
      showToast(next ? 'Live telemetry stream resumed' : 'Telemetry stream paused', 'info');
      return next;
    });
  };

  const toggleAudioAlert = () => {
    setIsAudioAlertEnabled(prev => {
      const next = !prev;
      if (next) {
        alarmSounder.playWarningChime();
        showToast('Audible alarm chime enabled', 'success');
      } else {
        showToast('Audible alarm chime muted', 'info');
      }
      return next;
    });
  };

  const triggerSimulatedEmergency = (patientId: string) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        const nowTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const criticalVital: PatientVitalReading = {
          ...p.currentVitals,
          id: `vit_${Date.now()}`,
          timestamp: nowTime,
          heartRate: 148,
          systolicBP: 182,
          diastolicBP: 110,
          spO2: 88,
          temperature: 39.4,
          alertLevel: 'critical',
          alertReason: 'CODE ALERT: Ventricular Tachycardia & Acute Hypoxia',
        };

        return {
          ...p,
          status: 'critical',
          currentVitals: criticalVital,
          vitalsHistory: [...p.vitalsHistory, criticalVital].slice(-14),
        };
      })
    );

    const targetPatient = patients.find(p => p.id === patientId);
    if (targetPatient) {
      if (isAudioAlertEnabled && !(alarmSnoozedUntil && Date.now() < alarmSnoozedUntil)) {
        alarmSounder.playCriticalChime();
      }
      const newAlert: RealtimeAlert = {
        id: `alt_${Date.now()}`,
        patientId: targetPatient.id,
        patientName: targetPatient.name,
        bed: targetPatient.bed,
        ward: targetPatient.ward,
        metric: 'Cardiac Rhythm & Oxygen Drop',
        value: 'HR: 148 BPM | SpO2: 88%',
        threshold: 'Emergency Crash Cart Protocol',
        severity: 'critical',
        timestamp: 'Just now',
        acknowledged: false,
      };
      setAlerts(prev => [newAlert, ...prev]);
      showToast(`Emergency triggered: ${targetPatient.name} (${targetPatient.bed})`, 'error');

      if (currentUser) {
        logSecurityAudit(
          currentUser.id,
          currentUser.name,
          role,
          'UPDATE_VITALS',
          targetPatient.mrn,
          `Triggered emergency crash simulation for ${targetPatient.name}`
        );
      }
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? {
              ...a,
              acknowledged: true,
              acknowledgedBy: currentUser?.name || 'Authorized Staff',
              acknowledgedAt: 'Just now',
            }
          : a
      )
    );
    showToast('Alert acknowledged and logged', 'success');
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    showToast('All patient alerts cleared from active log', 'info');
  };

  // Add vital reading manually
  const addVitalReading = async (
    patientId: string,
    reading: Omit<PatientVitalReading, 'id' | 'timestamp'>
  ) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullReading: PatientVitalReading = {
      ...reading,
      id: `vit_${Date.now()}`,
      timestamp: nowTime,
    };

    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          currentVitals: fullReading,
          vitalsHistory: [...p.vitalsHistory, fullReading].slice(-14),
        };
      })
    );

    const target = patients.find(p => p.id === patientId);
    showToast(`Vitals logged for ${target?.name || 'patient'}: HR ${fullReading.heartRate} bpm`, 'success');

    if (target && currentUser) {
      await logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'UPDATE_VITALS',
        target.mrn,
        `Logged vitals: HR ${fullReading.heartRate} bpm, BP ${fullReading.systolicBP}/${fullReading.diastolicBP}, SpO2 ${fullReading.spO2}%`
      );
    }
  };

  // Add clinical note
  const addClinicalNote = async (
    patientId: string,
    noteText: string,
    category: ClinicalNote['category']
  ) => {
    const newNote: ClinicalNote = {
      id: `cn_${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      author: currentUser?.name || 'Clinical Staff',
      authorRole: role,
      category,
      content: noteText,
      isEncrypted: true,
    };

    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          clinicalNotes: [newNote, ...p.clinicalNotes],
        };
      })
    );

    showToast(`Encrypted ${category} note saved to EMR`, 'success');

    const target = patients.find(p => p.id === patientId);
    if (target && currentUser) {
      await logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'SYNC_NOTE',
        target.mrn,
        `Added encrypted clinical progress note (${category})`
      );
    }
  };

  // Add medication
  const addMedication = async (
    patientId: string,
    medication: Omit<Medication, 'id' | 'startDate' | 'status'>
  ) => {
    const newMed: Medication = {
      ...medication,
      id: `med_${Date.now()}`,
      startDate: new Date().toISOString().substring(0, 10),
      status: 'active',
    };

    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          medications: [newMed, ...p.medications],
        };
      })
    );

    showToast(`Prescription authorized: ${newMed.name} ${newMed.dosage}`, 'success');

    const target = patients.find(p => p.id === patientId);
    if (target && currentUser) {
      await logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'SYNC_NOTE',
        target.mrn,
        `Prescribed medication: ${newMed.name} ${newMed.dosage}`
      );
    }
  };

  // Update patient status
  const updatePatientStatus = (patientId: string, status: PatientStatus) => {
    setPatients(prev =>
      prev.map(p => (p.id === patientId ? { ...p, status } : p))
    );
    showToast(`Patient status updated to ${status.toUpperCase()}`, 'info');
  };

  // Reassign staff bed
  const reassignStaffBed = async (staffId: string, bedNumber: string) => {
    setStaff(prev =>
      prev.map(s => {
        if (s.id !== staffId) return s;
        const exists = s.assignedBeds.includes(bedNumber);
        const updatedBeds = exists
          ? s.assignedBeds.filter(b => b !== bedNumber)
          : [...s.assignedBeds, bedNumber];
        return {
          ...s,
          assignedBeds: updatedBeds,
          activePatientCount: updatedBeds.length,
        };
      })
    );

    showToast(`Bed ${bedNumber} allocation updated`, 'info');

    if (currentUser) {
      await logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'REASSIGN_STAFF',
        'STAFF_ROSTER',
        `Updated bed assignment for staff ${staffId} to ${bedNumber}`
      );
    }
  };

  const updateStaffAvailability = (staffId: string, availability: StaffMember['availability']) => {
    setStaff(prev =>
      prev.map(s => (s.id === staffId ? { ...s, availability } : s))
    );
    const targetMember = staff.find(s => s.id === staffId);
    showToast(`${targetMember?.name || 'Staff'}: Status set to ${availability}`, 'info');
  };

  const pageStaffMember = (staffId: string, urgencyMessage: string) => {
    const member = staff.find(s => s.id === staffId);
    showToast(`PAGE DISPATCHED to ${member?.name}: "${urgencyMessage}"`, 'warning');
    if (currentUser) {
      logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'VIEW_RECORD',
        'STAFF_PAGE',
        `Dispatched urgent page to ${member?.name}: ${urgencyMessage}`
      );
    }
  };

  // Appointments
  const scheduleAppointment = async (apt: Omit<Appointment, 'id' | 'status'>) => {
    const newApt: Appointment = {
      ...apt,
      id: `apt_${Date.now()}`,
      status: 'Confirmed',
    };

    setAppointments(prev => [newApt, ...prev]);
    showToast(`Consultation scheduled with ${apt.doctorName}`, 'success');

    if (currentUser) {
      await logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'VIEW_RECORD',
        apt.patientMRN,
        `Scheduled ${apt.type} with ${apt.doctorName} on ${apt.dateTime}`
      );
    }
  };

  const updateAppointmentStatus = (aptId: string, status: Appointment['status']) => {
    setAppointments(prev =>
      prev.map(a => (a.id === aptId ? { ...a, status } : a))
    );
    showToast(`Appointment status updated to ${status}`, 'info');
  };

  // Discharge clearance step
  const approveDischargeStep = async (
    billId: string,
    step: keyof PatientBilling['dischargeClearance']
  ) => {
    setBillings(prev =>
      prev.map(b => {
        if (b.id !== billId) return b;
        const updatedClearance = {
          ...b.dischargeClearance,
          [step]: true,
          ...(step === 'physicianApproved' ? { physicianName: currentUser?.name || 'Attending Physician' } : {}),
        };

        const allApproved =
          updatedClearance.physicianApproved &&
          updatedClearance.nursingHandoffComplete &&
          updatedClearance.pharmacyDispensed &&
          updatedClearance.billingSettled;

        if (allApproved) {
          updatedClearance.dischargeApprovedDate = new Date()
            .toISOString()
            .substring(0, 16)
            .replace('T', ' ');
          updatePatientStatus(b.patientId, 'discharged');
        }

        return {
          ...b,
          dischargeClearance: updatedClearance,
        };
      })
    );

    const bill = billings.find(b => b.id === billId);
    showToast(`Discharge milestone certified: ${String(step)}`, 'success');

    if (bill && currentUser) {
      await logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'APPROVE_DISCHARGE',
        bill.patientMRN,
        `Approved discharge milestone: ${String(step)} for ${bill.patientName}`
      );
    }
  };

  const markBillingSettled = async (billId: string) => {
    setBillings(prev =>
      prev.map(b => {
        if (b.id !== billId) return b;
        return {
          ...b,
          paymentStatus: 'Cleared',
          dischargeClearance: {
            ...b.dischargeClearance,
            billingSettled: true,
          },
        };
      })
    );

    const bill = billings.find(b => b.id === billId);
    showToast(`Payment settled: $${bill?.patientTotalDue.toFixed(2)} received`, 'success');

    if (bill && currentUser) {
      await logSecurityAudit(
        currentUser.id,
        currentUser.name,
        role,
        'BILLING_SETTLEMENT',
        bill.patientMRN,
        `Payment cleared: $${bill.patientTotalDue.toFixed(2)} settled for ${bill.patientName}`
      );
    }
  };

  const generateDischargeSummary = (billId: string) => {
    const bill = billings.find(b => b.id === billId);
    if (!bill) return;
    const targetPatient = patients.find(p => p.id === bill.patientId);
    if (targetPatient) {
      addClinicalNote(
        targetPatient.id,
        `Official Discharge Clearance issued by ${currentUser?.name || 'Lead Physician'}. Patient condition stable, discharge medications dispensed, follow-up appointment scheduled.`,
        'Discharge Summary'
      );
    }
  };

  const unacknowledgedAlertsCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <HospitalContext.Provider
      value={{
        patients,
        selectedPatientId,
        selectedPatient,
        selectPatient,
        activeWardFilter,
        setActiveWardFilter,
        isLiveTelemetryActive,
        toggleLiveTelemetry,
        telemetrySpeedMs,
        setTelemetrySpeedMs,
        isAudioAlertEnabled,
        toggleAudioAlert,
        triggerSimulatedEmergency,
        alarmSnoozedUntil,
        snoozeAlarm,
        isAlarmSnoozed,
        alerts,
        unacknowledgedAlertsCount,
        acknowledgeAlert,
        clearAllAlerts,
        addVitalReading,
        addClinicalNote,
        addMedication,
        updatePatientStatus,
        staff,
        reassignStaffBed,
        updateStaffAvailability,
        pageStaffMember,
        appointments,
        scheduleAppointment,
        updateAppointmentStatus,
        billings,
        approveDischargeStep,
        markBillingSettled,
        generateDischargeSummary,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
