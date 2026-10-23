import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { PatientBilling, BillingItem } from '../../types';
import {
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Printer,
  ShieldCheck,
  DollarSign,
  Receipt,
  Download,
  Building2,
} from 'lucide-react';

export const DischargeBilling: React.FC = () => {
  const { billings, approveDischargeStep, markBillingSettled, generateDischargeSummary, patients } = useHospital();
  const { currentUser, role, hasPermission } = useAuth();

  const [selectedBillId, setSelectedBillId] = useState(billings[0]?.id || '');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const activeBill = billings.find(b => b.id === selectedBillId) || billings[0];
  const relatedPatient = patients.find(p => p.id === activeBill?.patientId);

  if (!activeBill) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Billing Records Found</h3>
      </div>
    );
  }

  const clearance = activeBill.dischargeClearance;
  const isFullyCleared =
    clearance.physicianApproved &&
    clearance.nursingHandoffComplete &&
    clearance.pharmacyDispensed &&
    clearance.billingSettled;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Integrated Discharge Billing
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-500">{activeBill.patientMRN}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Discharge Clearance & Ledger: {activeBill.patientName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Room: {activeBill.roomType} · Admitted: {activeBill.admissionDate} · Discharge: {activeBill.dischargeDate}
          </p>
        </div>

        {/* Patient Billing Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBillId}
            onChange={e => setSelectedBillId(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
          >
            {billings.map(b => (
              <option key={b.id} value={b.id}>
                {b.patientName} ({b.paymentStatus})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Official Bill & Certificate</span>
          </button>
        </div>
      </div>

      {/* 4-Step Discharge Clearance Pipeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Clinical & Administrative Discharge Checklist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All 4 milestones must be certified by authorized personnel before the patient may depart.
            </p>
          </div>
          {isFullyCleared ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Patient Ready for Discharge
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Clearance In Progress
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1: Physician Clearance */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">1. Clinical Clearance</span>
                {clearance.physicianApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] text-amber-500 font-bold">Pending</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Attending physician reviews post-op/post-acute stability.
              </p>
              {clearance.physicianName && (
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-1">
                  Signed: {clearance.physicianName}
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              {clearance.physicianApproved ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Approved</span>
              ) : (
                <button
                  type="button"
                  disabled={!hasPermission('approve_discharge')}
                  onClick={() => approveDischargeStep(activeBill.id, 'physicianApproved')}
                  className="w-full py-1.5 text-xs font-semibold rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-colors"
                >
                  Doctor Sign-Off
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Nursing Handoff */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">2. Nursing Education</span>
                {clearance.nursingHandoffComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] text-amber-500 font-bold">Pending</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Wound care instructions, vital signs education, activity limits.
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              {clearance.nursingHandoffComplete ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed</span>
              ) : (
                <button
                  type="button"
                  onClick={() => approveDischargeStep(activeBill.id, 'nursingHandoffComplete')}
                  className="w-full py-1.5 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  Nurse Handoff Sign-Off
                </button>
              )}
            </div>
          </div>

          {/* Step 3: Pharmacy Dispensation */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">3. Pharmacy Dispensed</span>
                {clearance.pharmacyDispensed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] text-amber-500 font-bold">Pending</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Discharge medications labeled and delivered to bedside.
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              {clearance.pharmacyDispensed ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Dispensed</span>
              ) : (
                <button
                  type="button"
                  onClick={() => approveDischargeStep(activeBill.id, 'pharmacyDispensed')}
                  className="w-full py-1.5 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Confirm Dispensation
                </button>
              )}
            </div>
          </div>

          {/* Step 4: Billing Settlement */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">4. Billing Settlement</span>
                {clearance.billingSettled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] text-amber-500 font-bold">Unsettled</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Insurance co-pay collected & financial clearance verified.
              </p>
              <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                Balance: ${activeBill.patientTotalDue.toFixed(2)}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              {clearance.billingSettled ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Settled (Receipt Generated)</span>
              ) : (
                <button
                  type="button"
                  onClick={() => markBillingSettled(activeBill.id)}
                  className="w-full py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Clear & Settle Bill
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Financial Ledger Table & Insurance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Itemized Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Itemized Hospital Charges Ledger
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {activeBill.items.length} line items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {activeBill.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      ${item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Insurance & Payment Calculation
          </h3>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">
              {activeBill.insuranceProvider}
            </div>
            <div className="text-slate-500 font-mono">Policy: {activeBill.policyNumber}</div>
            <div className="text-teal-600 dark:text-teal-400 font-medium">
              Coverage: {activeBill.insuranceCoveragePercent}% Comprehensive
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono pt-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Gross Hospital Subtotal:</span>
              <span className="font-bold">${activeBill.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Insurance Covered ({activeBill.insuranceCoveragePercent}%):</span>
              <span>-${activeBill.insuranceCoveredAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Policy Deductible Paid:</span>
              <span>${activeBill.deductiblePaid.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
              <span>Net Patient Balance:</span>
              <span className="text-base text-teal-600 dark:text-teal-400">
                ${activeBill.patientTotalDue.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-3">
            <div className="text-xs font-medium text-slate-500 mb-1">Status:</div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                activeBill.paymentStatus === 'Cleared'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              {activeBill.paymentStatus}
            </span>
          </div>

          {activeBill.paymentStatus !== 'Cleared' && (
            <button
              type="button"
              onClick={() => markBillingSettled(activeBill.id)}
              className="w-full mt-2 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Process Patient Payment (${activeBill.patientTotalDue.toFixed(2)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Printable Discharge Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8">
            {/* Header / Clinic Letterhead */}
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                    P
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      PulseWard Memorial Hospital
                    </h2>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Center for Cardiovascular & Critical Care · Licensed Accreditation NY-4491
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-slate-600">
                <div className="font-bold text-slate-900">OFFICIAL DISCHARGE CERTIFICATE</div>
                <div>Invoice #: INV-{activeBill.id.toUpperCase()}</div>
                <div>Date: {new Date().toISOString().substring(0, 10)}</div>
              </div>
            </div>

            {/* Patient & Admission Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border mb-4">
              <div>
                <span className="text-slate-500 block">Patient Name:</span>
                <span className="font-bold text-slate-900">{activeBill.patientName}</span>
                <span className="text-slate-500 block mt-1">Medical Record Number:</span>
                <span className="font-mono text-slate-800">{activeBill.patientMRN}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admission Period:</span>
                <span className="font-medium">{activeBill.admissionDate} to {activeBill.dischargeDate}</span>
                <span className="text-slate-500 block mt-1">Attending Physician:</span>
                <span className="font-medium text-slate-900">{clearance.physicianName || 'Dr. Maya Patel, MD'}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="mb-4">
              <table className="w-full text-xs text-left border">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="py-1.5 px-3">Service / Medication</th>
                    <th className="py-1.5 px-2 text-right">Qty</th>
                    <th className="py-1.5 px-2 text-right">Price</th>
                    <th className="py-1.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[11px]">
                  {activeBill.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-1.5 px-3 font-sans">{item.description}</td>
                      <td className="py-1.5 px-2 text-right">{item.quantity}</td>
                      <td className="py-1.5 px-2 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-bold">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Balance Calculation */}
            <div className="flex justify-end mb-6 text-xs font-mono">
              <div className="w-64 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span className="font-bold">${activeBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Insurance Covered:</span>
                  <span>-${activeBill.insuranceCoveredAmount.toFixed(2)}</span>
                </div>
                <div className="pt-1 border-t flex justify-between font-bold text-sm text-slate-900">
                  <span>Net Amount Paid:</span>
                  <span>${activeBill.patientTotalDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Official Stamps / Signature */}
            <div className="pt-4 border-t flex items-center justify-between text-xs text-slate-500">
              <div>
                <div className="font-mono text-[10px] text-emerald-700 font-semibold">
                  DIGITALLY VERIFIED BY ATTENDING PHYSICIAN
                </div>
                <div className="text-slate-700 italic font-medium">
                  {clearance.physicianName || 'Dr. Maya Patel, MD'} (Digital Signature Validated)
                </div>
              </div>

              <div className="text-right font-mono text-[10px]">
                <div>STATUS: {activeBill.paymentStatus.toUpperCase()}</div>
                <div>HIPAA CERTIFIED RECORD</div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="mt-6 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
