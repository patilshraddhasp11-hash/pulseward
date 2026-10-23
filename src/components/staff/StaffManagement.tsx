import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { StaffMember, UserRole } from '../../types';
import {
  Users,
  Stethoscope,
  HeartPulse,
  UserCog,
  Bed,
  Clock,
  Phone,
  Mail,
  Edit2,
  Check,
  Plus,
  Radio,
  Send,
  ShieldCheck,
} from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { staff, reassignStaffBed, updateStaffAvailability, pageStaffMember, patients } = useHospital();
  const { role } = useAuth();

  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedStaffForBed, setSelectedStaffForBed] = useState<StaffMember | null>(null);
  const [pagingStaffMember, setPagingStaffMember] = useState<StaffMember | null>(null);
  const [pagingMessage, setPagingMessage] = useState('Urgent bedside evaluation requested');
  const [bedInput, setBedInput] = useState('');

  const filteredStaff = staff.filter(
    s => roleFilter === 'all' || s.role === roleFilter
  );

  const availableBeds = patients.map(p => p.bed);

  const handleAddBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForBed || !bedInput.trim()) return;
    reassignStaffBed(selectedStaffForBed.id, bedInput.trim());
    setBedInput('');
  };

  const handleSendPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagingStaffMember || !pagingMessage.trim()) return;
    pageStaffMember(pagingStaffMember.id, pagingMessage.trim());
    setPagingStaffMember(null);
  };

  const getAvailabilityClass = (status: StaffMember['availability']) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'In Surgery':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'In Rounds':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'On Break':
        return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Clinical Staff & Bed Allocation Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time shift schedules, on-call doctor availability, and nurse patient-to-bed allocation.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              roleFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Staff ({staff.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('doctor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              roleFilter === 'doctor'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Doctors ({staff.filter(s => s.role === 'doctor').length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('nurse')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              roleFilter === 'nurse'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nurses ({staff.filter(s => s.role === 'nurse').length})
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => (
          <div
            key={member.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              {/* Member header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {member.role === 'doctor' ? (
                      <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    ) : member.role === 'nurse' ? (
                      <HeartPulse className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <UserCog className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {member.name}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {member.title} · {member.department}
                  </div>
                </div>

                {/* Availability status dropdown */}
                <select
                  value={member.availability}
                  onChange={e =>
                    updateStaffAvailability(
                      member.id,
                      e.target.value as StaffMember['availability']
                    )
                  }
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${getAvailabilityClass(
                    member.availability
                  )} cursor-pointer focus:outline-none`}
                >
                  <option value="Available">Available</option>
                  <option value="In Surgery">In Surgery</option>
                  <option value="In Rounds">In Rounds</option>
                  <option value="On Break">On Break</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>

              {/* Shift info and Staff Ratio */}
              <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  Shift:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {member.shift}
                </span>
              </div>

              {/* Bed Assignments */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Patient Beds ({member.assignedBeds.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStaffForBed(member)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Manage Beds</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {member.assignedBeds.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No beds assigned</span>
                  ) : (
                    member.assignedBeds.map(bed => (
                      <span
                        key={bed}
                        className="text-xs font-mono font-medium px-2 py-1 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 flex items-center gap-1"
                      >
                        <Bed className="w-3 h-3" />
                        {bed}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Contact & Urgent Page Action */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {member.contactNumber}
              </span>

              <button
                type="button"
                onClick={() => setPagingStaffMember(member)}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 font-semibold text-[11px]"
              >
                <Radio className="w-3 h-3 text-teal-500" />
                <span>Page</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bed Assignment Manager Modal */}
      {selectedStaffForBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bed Allocation: {selectedStaffForBed.name}
              </h3>
              <button
                onClick={() => setSelectedStaffForBed(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-3">
                Click a bed to toggle assignment for {selectedStaffForBed.name} ({selectedStaffForBed.role}):
              </p>

              {/* Active Hospital Beds */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {availableBeds.map(bed => {
                  const isAssigned = selectedStaffForBed.assignedBeds.includes(bed);
                  return (
                    <button
                      key={bed}
                      type="button"
                      onClick={() => {
                        reassignStaffBed(selectedStaffForBed.id, bed);
                        setSelectedStaffForBed(prev =>
                          prev
                            ? {
                                ...prev,
                                assignedBeds: isAssigned
                                  ? prev.assignedBeds.filter(b => b !== bed)
                                  : [...prev.assignedBeds, bed],
                              }
                            : null
                        );
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-mono font-medium flex items-center justify-between transition-all ${
                        isAssigned
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span>{bed}</span>
                      {isAssigned && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Bed Adder */}
              <form onSubmit={handleAddBed} className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={bedInput}
                  onChange={e => setBedInput(e.target.value)}
                  placeholder="Or enter bed (e.g. Bed 102-B)"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-500"
                >
                  Add Bed
                </button>
              </form>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStaffForBed(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Pager Modal */}
      {pagingStaffMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Dispatch Page: {pagingStaffMember.name}
                </h3>
              </div>
              <button
                onClick={() => setPagingStaffMember(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendPage} className="mt-4 space-y-3">
              <div className="text-xs text-slate-500">
                Member: <strong>{pagingStaffMember.name}</strong> ({pagingStaffMember.title}) · Status: {pagingStaffMember.availability}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Urgency Message / Call to Station
                </label>
                <textarea
                  rows={3}
                  required
                  value={pagingMessage}
                  onChange={e => setPagingMessage(e.target.value)}
                  placeholder="e.g. Code 4 assistance requested at ICU Bed 101-A immediately"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPagingStaffMember(null)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Page</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
