import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, Stethoscope, HeartPulse, UserCog, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, signup, switchDemoRole } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Cardiology & Critical Care');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'signin') {
        const targetEmail = email.trim() || DEMO_USERS[selectedRole].email;
        await login(targetEmail, selectedRole);
      } else {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name and credentials.');
          setIsLoading(false);
          return;
        }
        await signup({
          name: name.trim(),
          email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@pulseward.health`,
          role: selectedRole,
          department,
          licenseNumber: licenseNumber.trim() || `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
        });
      }
    } catch {
      setErrorMsg('Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (roleKey: UserRole) => {
    switchDemoRole(roleKey);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient medical grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">PulseWard</h1>
            <p className="text-xs text-teal-400 font-medium">Clinical Telemetry & Health Records Platform</p>
          </div>
        </div>

        <h2 className="mt-6 text-center text-xl font-semibold text-slate-200">
          {mode === 'signin' ? 'Sign in to Clinical Workstation' : 'Register Clinical Staff Account'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Role-Based Access Control (RBAC) · AES-256-GCM Encrypted PHI
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Quick Demo Switcher Cards */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Instant Demo Access (1-Click)
              </span>
              <span className="text-[11px] text-teal-400 font-medium">Select Role to Test:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('doctor')}
                className="flex flex-col items-start p-3 rounded-xl border border-teal-500/30 bg-teal-950/20 hover:bg-teal-900/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-teal-400 mb-1">
                  <Stethoscope className="w-4 h-4" />
                  <span className="text-xs font-semibold">Doctor</span>
                </div>
                <div className="text-xs font-medium text-slate-200">Dr. Evelyn Vance</div>
                <div className="text-[11px] text-slate-400">Cardiology & ICU</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('nurse')}
                className="flex flex-col items-start p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <HeartPulse className="w-4 h-4" />
                  <span className="text-xs font-semibold">Nurse</span>
                </div>
                <div className="text-xs font-medium text-slate-200">Marcus Reed, RN</div>
                <div className="text-[11px] text-slate-400">ICU Charge Nurse</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('admin')}
                className="flex flex-col items-start p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 hover:bg-indigo-900/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <UserCog className="w-4 h-4" />
                  <span className="text-xs font-semibold">Admin</span>
                </div>
                <div className="text-xs font-medium text-slate-200">Sarah Jenkins</div>
                <div className="text-[11px] text-slate-400">Billing & Roster</div>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-3 text-slate-400 font-medium">Or Sign In with Credentials</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Select Clinical Role</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/70 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('doctor');
                    setEmail(DEMO_USERS.doctor.email);
                  }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    selectedRole === 'doctor'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Doctor / MD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('nurse');
                    setEmail(DEMO_USERS.nurse.email);
                  }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    selectedRole === 'nurse'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nurse / RN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setEmail(DEMO_USERS.admin.email);
                  }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hospital Admin
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name & Degree</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Dr. Julian Croft, MD"
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Cardiology & Critical Care">Cardiology & CCU</option>
                      <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                      <option value="Neurology Unit">Neurology Unit</option>
                      <option value="General & Laparoscopic Surgery">General Surgery</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Hospital Administration & Billing">Hospital Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Medical License / ID</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      placeholder="e.g. MD-991204-NY"
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hospital Work Email</label>
              <input
                type="email"
                required
                value={email || DEMO_USERS[selectedRole].email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@pulseward.health"
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? `Sign In as ${selectedRole.toUpperCase()}` : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMsg('');
              }}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              {mode === 'signin'
                ? "Need a new clinical staff account? Click to Register"
                : 'Already have credentials? Return to Sign In'}
            </button>
          </div>

          {/* Security footnote */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              HIPAA Privacy & Security Certified
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              256-Bit Hardware Encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
