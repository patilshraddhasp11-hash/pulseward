import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Appointment, AppointmentType, StaffMember } from '../../types';
import {
  Calendar,
  Clock,
  UserCheck,
  Stethoscope,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';

export const AppointmentsScheduler: React.FC = () => {
  const { appointments, scheduleAppointment, updateAppointmentStatus, staff, patients } = useHospital();

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // New appointment form state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    staff.find(s => s.role === 'doctor')?.id || ''
  );
  const [aptDate, setAptDate] = useState('2026-10-22 17:00');
  const [duration, setDuration] = useState(30);
  const [aptType, setAptType] = useState<AppointmentType>('Consultation');
  const [roomNumber, setRoomNumber] = useState('Clinic Suite 3');
  const [aptNotes, setAptNotes] = useState('');

  const doctorsList = staff.filter(s => s.role === 'doctor');

  const filteredAppointments = appointments.filter(apt => {
    const matchDept = departmentFilter === 'All' || apt.department.includes(departmentFilter);
    const matchStatus = statusFilter === 'All' || apt.status === statusFilter;
    return matchDept && matchStatus;
  });

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === selectedPatientId);
    const doctorObj = staff.find(s => s.id === selectedDoctorId);

    if (!patientObj || !doctorObj) return;

    scheduleAppointment({
      patientId: patientObj.id,
      patientName: patientObj.name,
      patientMRN: patientObj.mrn,
      doctorId: doctorObj.id,
      doctorName: doctorObj.name,
      department: doctorObj.department,
      dateTime: aptDate,
      durationMinutes: Number(duration),
      type: aptType,
      roomNumber,
      notes: aptNotes.trim() || 'Scheduled clinical consultation',
    });

    setIsBookModalOpen(false);
    setAptNotes('');
  };

  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;
  const inProgressCount = appointments.filter(a => a.status === 'In Progress').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Appointments</span>
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {appointments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Today’s Hospital Queue</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Confirmed Slots</span>
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
            {confirmedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Upcoming today</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">In Progress</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active consultations</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Rounds signed off</div>
        </div>
      </div>

      {/* Doctor Availability Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Attending Physicians Live Availability
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check active status before routing outpatient consultations or bedside emergency rounds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {doctorsList.map(doc => {
            const isAvail = doc.availability === 'Available';
            const isSurgery = doc.availability === 'In Surgery';
            return (
              <div
                key={doc.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</div>
                  <div className="text-[11px] text-slate-500">{doc.department}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">Shift: {doc.shift.split(' ')[0]}</div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isAvail
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : isSurgery
                      ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {doc.availability}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Scheduled Patient Consultations ({filteredAppointments.length})
            </h3>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Attending Doctor</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Location / Room</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAppointments.map(apt => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {apt.dateTime}
                    <div className="text-[10px] text-slate-400 font-normal">{apt.durationMinutes} mins</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{apt.patientName}</div>
                    <div className="text-[10px] font-mono text-slate-500">{apt.patientMRN}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{apt.doctorName}</div>
                    <div className="text-[10px] text-slate-500">{apt.department}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                      {apt.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {apt.roomNumber}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        apt.status === 'Confirmed'
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                          : apt.status === 'In Progress'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {apt.status === 'Confirmed' && (
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(apt.id, 'In Progress')}
                          className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
                        >
                          Start
                        </button>
                      )}
                      {apt.status === 'In Progress' && (
                        <button
                          type="button"
                          onClick={() => updateAppointmentStatus(apt.id, 'Completed')}
                          className="px-2 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Book Clinical Consultation / Follow-Up
              </h3>
              <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.bed} · {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Attending Physician
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  {doctorsList.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.department} ({doc.availability})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="text"
                    required
                    value={aptDate}
                    onChange={e => setAptDate(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (Comprehensive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Appointment Type
                  </label>
                  <select
                    value={aptType}
                    onChange={e => setAptType(e.target.value as AppointmentType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Consultation">Clinical Consultation</option>
                    <option value="Follow-up">Post-Procedure Follow-Up</option>
                    <option value="Pre-Op Evaluation">Pre-Op Evaluation</option>
                    <option value="Discharge Clearance">Discharge Clearance</option>
                    <option value="Diagnostic Review">Diagnostic Scan Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Room / Suite
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    placeholder="e.g. Clinic Suite 3 or ICU Bedside"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Agenda & Instructions
                </label>
                <textarea
                  rows={2}
                  value={aptNotes}
                  onChange={e => setAptNotes(e.target.value)}
                  placeholder="e.g. Review blood panels, assess wound healing..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
