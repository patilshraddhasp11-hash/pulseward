import React, { useState } from 'react';
import { getAuditLogs, encryptSensitivePHI, decryptSensitivePHI } from '../../services/encryption';
import { ShieldCheck, Lock, Key, CheckCircle2, FileText, RefreshCw } from 'lucide-react';

interface EncryptionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EncryptionAuditModal: React.FC<EncryptionAuditModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState(getAuditLogs());
  const [testPlaintext, setTestPlaintext] = useState('Patient reported acute cardiac chest pain; ECG indicates STEMI');
  const [encryptedOutput, setEncryptedOutput] = useState<{ ciphertext: string; algorithm: string; integrityTag: string } | null>(null);
  const [decryptedOutput, setDecryptedOutput] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestEncrypt = () => {
    const enc = encryptSensitivePHI(testPlaintext);
    setEncryptedOutput(enc);
    setDecryptedOutput(null);
  };

  const handleTestDecrypt = () => {
    if (!encryptedOutput) return;
    const dec = decryptSensitivePHI(encryptedOutput.ciphertext);
    setDecryptedOutput(dec);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              HIPAA Cryptographic Security & Audit Trail
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">
            ✕
          </button>
        </div>

        {/* Overview banner */}
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
            <Lock className="w-4 h-4" />
            <span>NIST FIPS 197 Standard: AES-256-GCM with SHA-256 Integrity Verification</span>
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            All stored patient records, vital readings, diagnostic reports, and physician progress notes are protected via authenticated hardware-accelerated Galois/Counter Mode encryption. Every clinical interaction is immutably signed in the security audit trail.
          </p>
        </div>

        {/* Live Encryption Simulator */}
        <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-2">
            Interactive PHI Encryption Verification
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              value={testPlaintext}
              onChange={e => setTestPlaintext(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestEncrypt}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
              >
                Encrypt PHI
              </button>
              {encryptedOutput && (
                <button
                  type="button"
                  onClick={handleTestDecrypt}
                  className="px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
                >
                  Decrypt & Verify
                </button>
              )}
            </div>

            {encryptedOutput && (
              <div className="mt-2 p-2.5 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-400 break-all space-y-1">
                <div>Ciphertext: {encryptedOutput.ciphertext}</div>
                <div className="text-slate-400">Algorithm: {encryptedOutput.algorithm} · AuthTag: {encryptedOutput.integrityTag}</div>
              </div>
            )}

            {decryptedOutput && (
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Verified Plaintext: "{decryptedOutput}"
              </div>
            )}
          </div>
        </div>

        {/* Immutable Audit Log List */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Immutable Access Audit Log ({logs.length} entries)
            </span>
            <button
              onClick={() => setLogs(getAuditLogs())}
              className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map(log => (
              <div key={log.id} className="pt-2 text-xs flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="text-teal-600 dark:text-teal-400 font-mono">[{log.action}]</span>
                    <span>{log.userName}</span>
                    <span className="text-[10px] text-slate-400 uppercase">({log.role})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{log.details}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    MRN: {log.patientMRN} · {log.timestamp.replace('T', ' ').substring(0, 19)}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                  {log.dataHash}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Close Security Console
          </button>
        </div>
      </div>
    </div>
  );
};
