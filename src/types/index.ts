export type UserRole = 'doctor' | 'nurse' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  licenseNumber: string;
  avatarInitials: string;
}

export type AlertSeverity = 'normal' | 'warning' | 'critical';

export interface PatientVitalReading {
  id: string;
  timestamp: string;
  heartRate: number; // bpm
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  spO2: number; // %
  respiratoryRate: number; // breaths/min
  temperature: number; // °C
  bloodGlucose: number; // mg/dL
  painScale: number; // 0-10
  gcs: number; // 3-15 Glasgow Coma Scale
  alertLevel: AlertSeverity;
  alertReason?: string;
  recordedBy: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string; // Oral, IV, IM, etc.
  startDate: string;
  prescribedBy: string;
  status: 'active' | 'completed' | 'discontinued';
}

export interface ClinicalNote {
  id: string;
  date: string;
  author: string;
  authorRole: UserRole;
  category: 'Physician Progress' | 'Nursing Handoff' | 'Consultation' | 'Discharge Summary';
  content: string;
  isEncrypted: boolean;
}

export interface MedicalHistory {
  allergies: string[];
  chronicConditions: string[];
  pastSurgeries: Array<{ procedure: string; date: string; hospital: string }>;
  immunizations: string[];
  familyHistory: string[];
  admissionReason: string;
  admissionDiagnosis: string;
  codeStatus: 'Full Code' | 'DNR' | 'DNI';
}

export type ModalityType = 'X-Ray' | 'MRI' | 'CT Scan' | 'Histology' | 'Lab Blood Panel' | 'Echocardiogram';

export interface LabTestMetric {
  name: string;
  value: number;
  unit: string;
  refMin: number;
  refMax: number;
  status: 'normal' | 'high' | 'low';
}

export interface DiagnosticSlide {
  id: string;
  patientId: string;
  title: string;
  modality: ModalityType;
  date: string;
  anatomicRegion: string;
  radiologistImpression: string;
  findings: string[];
  status: 'Normal' | 'Abnormal' | 'Critical Finding';
  visualType: 'chest_xray' | 'brain_mri' | 'abdominal_ct' | 'histology' | 'blood_panel' | 'cardiac_echo';
  labMetrics?: LabTestMetric[];
  consultationNotes?: string;
  doctorApproved: boolean;
}

export type PatientStatus = 'stable' | 'observation' | 'critical' | 'ready-discharge' | 'discharged';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup: string;
  ward: 'ICU' | 'CCU' | 'Cardiology Ward' | 'Neurology Unit' | 'General Ward' | 'Pediatrics';
  bed: string;
  admissionDate: string;
  attendingDoctorId: string;
  attendingDoctorName: string;
  assignedNurseId: string;
  assignedNurseName: string;
  status: PatientStatus;
  primaryDiagnosis: string;
  fallRisk?: 'Low' | 'Moderate' | 'High';
  isolationProtocol?: 'Standard' | 'Contact' | 'Droplet' | 'Airborne';
  dietType?: string;
  currentVitals: PatientVitalReading;
  vitalsHistory: PatientVitalReading[];
  history: MedicalHistory;
  medications: Medication[];
  clinicalNotes: ClinicalNote[];
  diagnosticSlides: DiagnosticSlide[];
  encryptedDataHash: string;
}

export type StaffShift = 'Day (07:00 - 15:00)' | 'Evening (15:00 - 23:00)' | 'Night (23:00 - 07:00)' | 'On-Call 24h';
export type StaffAvailability = 'Available' | 'In Surgery' | 'In Rounds' | 'On Break' | 'Off Duty';

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  shift: StaffShift;
  availability: StaffAvailability;
  assignedBeds: string[];
  contactNumber: string;
  email: string;
  activePatientCount: number;
}

export type AppointmentStatus = 'Confirmed' | 'In Progress' | 'Completed' | 'Rescheduled' | 'Cancelled';
export type AppointmentType = 'Consultation' | 'Follow-up' | 'Pre-Op Evaluation' | 'Discharge Clearance' | 'Diagnostic Review';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  doctorId: string;
  doctorName: string;
  department: string;
  dateTime: string;
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  roomNumber: string;
}

export interface BillingItem {
  id: string;
  description: string;
  category: 'Room & Board' | 'ICU Care' | 'Surgery & Procedures' | 'Diagnostics & Imaging' | 'Pharmacy & Meds' | 'Consultation Fees';
  quantity: number;
  unitPrice: number;
  total: number;
  coveredByInsurance: boolean;
}

export interface PatientBilling {
  id: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  admissionDate: string;
  dischargeDate: string;
  roomType: string;
  roomDays: number;
  items: BillingItem[];
  subtotal: number;
  insuranceProvider: string;
  policyNumber: string;
  insuranceCoveragePercent: number;
  insuranceCoveredAmount: number;
  deductiblePaid: number;
  patientTotalDue: number;
  paymentStatus: 'Cleared' | 'Pending Insurance' | 'Partially Paid' | 'Unpaid';
  dischargeClearance: {
    physicianApproved: boolean;
    physicianName?: string;
    nursingHandoffComplete: boolean;
    pharmacyDispensed: boolean;
    billingSettled: boolean;
    dischargeApprovedDate?: string;
  };
}

export interface RealtimeAlert {
  id: string;
  patientId: string;
  patientName: string;
  bed: string;
  ward: string;
  metric: string;
  value: string;
  threshold: string;
  severity: 'critical' | 'warning';
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface SecurityAuditRecord {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: 'VIEW_RECORD' | 'UPDATE_VITALS' | 'SYNC_NOTE' | 'APPROVE_DISCHARGE' | 'VIEW_DIAGNOSTICS' | 'REASSIGN_STAFF' | 'BILLING_SETTLEMENT';
  patientMRN: string;
  details: string;
  dataHash: string;
}
