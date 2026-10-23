import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  AlertCircle,
  Pill,
  History,
  ShieldCheck,
  Plus,
  Send,
  CheckCircle2,
  Lock,
  User,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { ClinicalNote } from '../../types';

export const PatientDirectory: React.FC = () => {
  const { selectedPatient, addClinicalNote, addMedication, updatePatientStatus, showToast } =
    useHospital();
  const { role, currentUser, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'meds' | 'timeline'>('overview');
  const [noteFilter, setNoteFilter] = useState<string>('All');

  // New Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteCategory, setNoteCategory] = useState<ClinicalNote['category']>('Physician Progress');
  const [noteContent, setNoteContent] = useState('');

  // New Medication Modal
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('Once daily');
  const [medRoute, setMedRoute] = useState('Oral');

  // Allergy contraindication detection
  const detectedAllergy = selectedPatient.history.allergies.find(allergy =>
    medName.toLowerCase().trim() && allergy.toLowerCase().includes(medName.toLowerCase().trim().slice(0, 4))
  );

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    addClinicalNote(selectedPatient.id, noteContent.trim(), noteCategory);
    setNoteContent('');
    setIsNoteModalOpen(false);
  };

  const handleAddMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !medDosage.trim()) return;

    if (detectedAllergy) {
      const confirmProceed = window.confirm(
        `WARNING: Patient has a documented allergy to "${detectedAllergy}". Proceed with override?`
      );
      if (!confirmProceed) return;
    }

    addMedication(selectedPatient.id, {
      name: medName.trim(),
      dosage: medDosage.trim(),
      frequency: medFrequency,
      route: medRoute,
      prescribedBy: currentUser?.name || 'Attending Physician',
    });
    setMedName('');
    setMedDosage('');
    setIsMedModalOpen(false);
  };

  const filteredNotes = selectedPatient.clinicalNotes.filter(
    n => noteFilter === 'All' || n.category === noteFilter
  );

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-base shrink-0 border border-teal-200 dark:border-teal-800">
              {selectedPatient.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedPatient.name}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {selectedPatient.mrn}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                  {selectedPatient.ward} · {selectedPatient.bed}
                </span>
                {selectedPatient.fallRisk && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Fall Risk: {selectedPatient.fallRisk}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Primary Diagnosis:{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {selectedPatient.primaryDiagnosis}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span>
                  DOB: {selectedPatient.dob} ({selectedPatient.age} yrs)
                </span>
                <span>·</span>
                <span>Gender: {selectedPatient.gender}</span>
                <span>·</span>
                <span>Blood: {selectedPatient.bloodGroup}</span>
                <span>·</span>
                <span>Admitted: {selectedPatient.admissionDate}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Progress Note</span>
            </button>

            {hasPermission('prescribe_meds') && (
              <button
                type="button"
                onClick={() => setIsMedModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-sm transition-all"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Prescribe Med</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Medical History & Allergies
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Clinical Progress Notes ({selectedPatient.clinicalNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('meds')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              activeTab === 'meds'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active Medications ({selectedPatient.medications.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Clinical Timeline Events
          </button>
        </div>
      </div>

      {/* Tab 1: Comprehensive Medical History */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allergies & Alerts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Allergies & Adverse Reactions
              </h3>
            </div>
            <div className="space-y-2">
              {selectedPatient.history.allergies.length === 0 ? (
                <div className="text-xs text-slate-500">No known drug allergies (NKDA).</div>
              ) : (
                selectedPatient.history.allergies.map((allergy, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center justify-between"
                  >
                    <span>{allergy}</span>
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                      High Risk
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Chronic Medical Conditions
              </h4>
              <ul className="space-y-1.5">
                {selectedPatient.history.chronicConditions.map((cond, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Past Surgical History & Family History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Past Surgical History
              </h3>
            </div>
            <div className="space-y-2">
              {selectedPatient.history.pastSurgeries.length === 0 ? (
                <div className="text-xs text-slate-500">No prior major surgeries on record.</div>
              ) : (
                selectedPatient.history.pastSurgeries.map((surg, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {surg.procedure}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {surg.date} · {surg.hospital}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Immunizations & Code Status */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Code Status
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  {selectedPatient.history.codeStatus}
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Verified Immunizations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.history.immunizations.map((imm, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium"
                    >
                      {imm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Clinical Progress Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Chronological Progress Notes (AES-256 Encrypted)
            </span>

            {/* Note category filter */}
            <div className="flex items-center gap-2">
              <select
                value={noteFilter}
                onChange={e => setNoteFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
              >
                <option value="All">All Categories</option>
                <option value="Physician Progress">Physician Progress</option>
                <option value="Nursing Handoff">Nursing Handoff</option>
                <option value="Consultation">Consultation</option>
                <option value="Discharge Summary">Discharge Summary</option>
              </select>

              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                + Write Entry
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{note.author}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {note.authorRole}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-teal-600 dark:text-teal-400 font-medium">
                      {note.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                    <span title="AES-256 Encrypted">
                      <Lock className="w-3 h-3 text-emerald-500" />
                    </span>
                    <span>{note.date}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Active Medications */}
      {activeTab === 'meds' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Active Inpatient Prescription Roster
            </h3>
            {hasPermission('prescribe_meds') && (
              <button
                type="button"
                onClick={() => setIsMedModalOpen(true)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                + Add Medication
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Medication Name</th>
                  <th className="py-2.5 px-3">Dosage</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Start Date</th>
                  <th className="py-2.5 px-3">Prescriber</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedPatient.medications.map(med => (
                  <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {med.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {med.dosage}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {med.frequency}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {med.route}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{med.startDate}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {med.prescribedBy}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                        {med.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Clinical Timeline Events */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider font-mono">
            Chronological Hospital Stay Trajectory
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {/* Event 1 */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Emergency Hospital Admission
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {selectedPatient.admissionDate} · Triage Bedside Registration
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {selectedPatient.history.admissionReason}
              </p>
            </div>

            {/* Event 2 */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Bedside Telemetry Node Activated
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Continuous ECG Lead II & SpO2 Plethysmograph monitoring assigned to {selectedPatient.bed}
              </div>
            </div>

            {/* Event 3 */}
            {selectedPatient.clinicalNotes.map((note, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {note.category} ({note.author})
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{note.date}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Clinical Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Clinical Progress Note
              </h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNoteSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Note Classification
                </label>
                <select
                  value={noteCategory}
                  onChange={e => setNoteCategory(e.target.value as ClinicalNote['category'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="Physician Progress">Physician Progress</option>
                  <option value="Nursing Handoff">Nursing Handoff</option>
                  <option value="Consultation">Consultation Note</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Narrative (Subjective / Objective / Assessment / Plan)
                </label>
                <textarea
                  rows={5}
                  required
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Record assessment, hemodynamic stability, changes in therapy..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Note will be automatically encrypted with AES-256-GCM.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm"
                >
                  Save to EMR Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medication Modal with Contraindication Check */}
      {isMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Prescribe Inpatient Medication
              </h3>
              <button onClick={() => setIsMedModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Medication Name & Formulation
                </label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  placeholder="e.g. Enoxaparin (Lovenox) or Lisinopril"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Real-time Allergy Contraindication Banner */}
              {detectedAllergy && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">CRITICAL ALLERGY CONTRAINDICATION:</span>
                    <p className="mt-0.5">
                      Patient has documented sensitivity: <strong>{detectedAllergy}</strong>.
                      Prescription requires conscious clinical override.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    required
                    value={medDosage}
                    onChange={e => setMedDosage(e.target.value)}
                    placeholder="e.g. 40 mg SC or 10 mg Oral"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Route
                  </label>
                  <select
                    value={medRoute}
                    onChange={e => setMedRoute(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Oral">Oral (PO)</option>
                    <option value="IV">Intravenous (IV)</option>
                    <option value="SC">Subcutaneous (SC)</option>
                    <option value="IM">Intramuscular (IM)</option>
                    <option value="Inhalation">Inhalation (Nebulizer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dosing Frequency
                </label>
                <select
                  value={medFrequency}
                  onChange={e => setMedFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="Once daily">Once daily (QD)</option>
                  <option value="Twice daily">Twice daily (BID)</option>
                  <option value="Three times daily">Three times daily (TID)</option>
                  <option value="Every 4 hours">Every 4 hours (Q4H)</option>
                  <option value="PRN as needed">PRN (As needed for pain/fever)</option>
                  <option value="Continuous infusion">Continuous IV Infusion</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm"
                >
                  Authorize Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
