import React, { useState, useEffect, useRef } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  Droplet,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  Zap,
  Clock,
  Download,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

export const VitalsMonitor: React.FC = () => {
  const {
    selectedPatient,
    isLiveTelemetryActive,
    toggleLiveTelemetry,
    telemetrySpeedMs,
    setTelemetrySpeedMs,
    triggerSimulatedEmergency,
    addVitalReading,
    showToast,
  } = useHospital();
  const { role, hasPermission } = useAuth();

  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeTrendMetric, setActiveTrendMetric] = useState<'hr' | 'bp' | 'spo2'>('hr');

  // Form state for recording new vitals
  const [formHR, setFormHR] = useState(selectedPatient.currentVitals.heartRate);
  const [formSys, setFormSys] = useState(selectedPatient.currentVitals.systolicBP);
  const [formDia, setFormDia] = useState(selectedPatient.currentVitals.diastolicBP);
  const [formSpO2, setFormSpO2] = useState(selectedPatient.currentVitals.spO2);
  const [formRR, setFormRR] = useState(selectedPatient.currentVitals.respiratoryRate);
  const [formTemp, setFormTemp] = useState(selectedPatient.currentVitals.temperature);
  const [formGlucose, setFormGlucose] = useState(selectedPatient.currentVitals.bloodGlucose);
  const [formPain, setFormPain] = useState(selectedPatient.currentVitals.painScale);
  const [formGCS, setFormGCS] = useState(selectedPatient.currentVitals.gcs);

  // Sync modal form when patient changes
  useEffect(() => {
    setFormHR(selectedPatient.currentVitals.heartRate);
    setFormSys(selectedPatient.currentVitals.systolicBP);
    setFormDia(selectedPatient.currentVitals.diastolicBP);
    setFormSpO2(selectedPatient.currentVitals.spO2);
    setFormRR(selectedPatient.currentVitals.respiratoryRate);
    setFormTemp(selectedPatient.currentVitals.temperature);
    setFormGlucose(selectedPatient.currentVitals.bloodGlucose);
    setFormPain(selectedPatient.currentVitals.painScale);
    setFormGCS(selectedPatient.currentVitals.gcs);
  }, [selectedPatient.id]);

  // Dual-channel real-time canvas (Channel 1: Lead II ECG, Channel 2: SpO2 Plethysmogram)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let x = 0;
    const width = canvas.width;
    const height = canvas.height;
    const ecgCenterY = height * 0.28;
    const plethCenterY = height * 0.74;

    ctx.fillStyle = '#070b13';
    ctx.fillRect(0, 0, width, height);

    // Initial grid
    const drawGridSlice = (startX: number, sliceWidth: number) => {
      ctx.strokeStyle = '#141d2e';
      ctx.lineWidth = 0.5;
      for (let gx = startX - (startX % 20); gx < startX + sliceWidth; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 20) {
        ctx.beginPath();
        ctx.moveTo(startX, gy);
        ctx.lineTo(startX + sliceWidth, gy);
        ctx.stroke();
      }
    };

    drawGridSlice(0, width);

    let step = 0;
    const hr = selectedPatient.currentVitals.heartRate || 75;
    const cycleLength = Math.max(28, Math.floor(4000 / hr));

    const render = () => {
      const sweepSlice = 10;
      const clearX = (x + 2) % width;

      // Sweep clear
      ctx.fillStyle = '#070b13';
      ctx.fillRect(clearX, 0, sweepSlice, height);

      // Refresh grid on sweep
      drawGridSlice(clearX, sweepSlice);

      // Channel separator line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(clearX, height * 0.52);
      ctx.lineTo(clearX + sweepSlice, height * 0.52);
      ctx.stroke();
      ctx.setLineDash([]);

      const posInCycle = step % cycleLength;

      // 1. ECG Waveform Math (Lead II)
      let ecgOffset = 0;
      if (posInCycle === Math.floor(cycleLength * 0.15)) {
        ecgOffset = -8; // P wave
      } else if (posInCycle === Math.floor(cycleLength * 0.28)) {
        ecgOffset = 5; // Q dip
      } else if (posInCycle === Math.floor(cycleLength * 0.32)) {
        ecgOffset = -38; // R peak
      } else if (posInCycle === Math.floor(cycleLength * 0.36)) {
        ecgOffset = 14; // S dip
      } else if (posInCycle === Math.floor(cycleLength * 0.55)) {
        ecgOffset = -12; // T wave
      } else {
        ecgOffset = (Math.random() - 0.5) * 1.5;
      }

      const ecgY = ecgCenterY + ecgOffset;

      // Draw ECG
      ctx.strokeStyle =
        selectedPatient.currentVitals.alertLevel === 'critical' ? '#f43f5e' : '#10b981';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, ecgCenterY);
      ctx.lineTo((x + 2) % width, ecgY);
      ctx.stroke();

      // 2. Plethysmograph Waveform (SpO2 pulse volume wave with dicrotic notch)
      let plethOffset = 0;
      const plethCycle = (posInCycle / cycleLength) * Math.PI * 2;
      if (plethCycle < Math.PI) {
        // Systolic pulse rise
        plethOffset = -Math.sin(plethCycle) * 22;
        // Dicrotic notch
        if (plethCycle > 2.0 && plethCycle < 2.5) {
          plethOffset += 6;
        }
      } else {
        plethOffset = (Math.random() - 0.5) * 1.2;
      }

      const plethY = plethCenterY + plethOffset;

      // Draw Pleth
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x, plethCenterY);
      ctx.lineTo((x + 2) % width, plethY);
      ctx.stroke();

      x = (x + 2) % width;
      step++;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedPatient.currentVitals.heartRate, selectedPatient.currentVitals.alertLevel]);

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let alertLevel: 'normal' | 'warning' | 'critical' = 'normal';
    let alertReason = '';

    if (formSpO2 < 90 || formHR > 125 || formSys > 180 || formTemp > 39.2) {
      alertLevel = 'critical';
      alertReason = 'Immediate Attending Attention Required';
    } else if (formSpO2 < 94 || formHR > 105 || formSys > 145 || formTemp > 38.0) {
      alertLevel = 'warning';
      alertReason = 'Vital threshold deviation';
    }

    addVitalReading(selectedPatient.id, {
      heartRate: Number(formHR),
      systolicBP: Number(formSys),
      diastolicBP: Number(formDia),
      spO2: Number(formSpO2),
      respiratoryRate: Number(formRR),
      temperature: Number(formTemp),
      bloodGlucose: Number(formGlucose),
      painScale: Number(formPain),
      gcs: Number(formGCS),
      alertLevel,
      alertReason,
      recordedBy: role === 'doctor' ? 'Attending Physician' : 'Clinical Nurse',
    });

    setIsRecordModalOpen(false);
  };

  const handleExportTelemetry = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Timestamp,HeartRate_BPM,SystolicBP_mmHg,DiastolicBP_mmHg,SpO2_Percent,RespRate_BPM,Temp_C,Glucose_mgdL,Status',
        ...selectedPatient.vitalsHistory.map(
          v =>
            `"${v.timestamp}",${v.heartRate},${v.systolicBP},${v.diastolicBP},${v.spO2},${v.respiratoryRate},${v.temperature},${v.bloodGlucose},${v.alertLevel}`
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Telemetry_${selectedPatient.mrn}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Telemetry exported for ${selectedPatient.name}`, 'success');
  };

  const currentVitals = selectedPatient.currentVitals;
  const isCritical = currentVitals.alertLevel === 'critical';
  const mapValue = Math.round((2 * currentVitals.diastolicBP + currentVitals.systolicBP) / 3);
  const pulsePressure = currentVitals.systolicBP - currentVitals.diastolicBP;

  const displayTemp =
    tempUnit === 'C'
      ? `${currentVitals.temperature.toFixed(1)} °C`
      : `${((currentVitals.temperature * 9) / 5 + 32).toFixed(1)} °F`;

  // Calculate trends vs previous reading
  const history = selectedPatient.vitalsHistory;
  const prevReading = history.length > 1 ? history[history.length - 2] : null;
  const hrDiff = prevReading ? currentVitals.heartRate - prevReading.heartRate : 0;
  const spo2Diff = prevReading ? currentVitals.spO2 - prevReading.spO2 : 0;

  // Chart coordinate generator for trend visualizer
  const trendPoints = history.map((reading, i) => {
    let val = reading.heartRate;
    let min = 50;
    let max = 150;
    if (activeTrendMetric === 'bp') {
      val = reading.systolicBP;
      min = 80;
      max = 200;
    } else if (activeTrendMetric === 'spo2') {
      val = reading.spO2;
      min = 85;
      max = 100;
    }
    const xCoord = (i / Math.max(1, history.length - 1)) * 520 + 20;
    const yCoord = 110 - ((val - min) / (max - min)) * 90;
    return { x: xCoord, y: Math.max(15, Math.min(115, yCoord)), val, time: reading.timestamp };
  });

  const pathD =
    trendPoints.length > 0
      ? `M ${trendPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`
      : '';

  return (
    <div className="space-y-6">
      {/* Top Patient Telemetry Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800/60">
                {selectedPatient.bed}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {selectedPatient.ward}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500">{selectedPatient.mrn}</span>

              {/* Clinical Risk Badges */}
              {selectedPatient.fallRisk && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Fall Risk: {selectedPatient.fallRisk}
                </span>
              )}
              {selectedPatient.isolationProtocol && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {selectedPatient.isolationProtocol} Isolation
                </span>
              )}
              {selectedPatient.dietType && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Diet: {selectedPatient.dietType}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
              {selectedPatient.name}
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-pulse'
                    : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {selectedPatient.status}
              </span>
            </h1>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {selectedPatient.age} y/o {selectedPatient.gender} · Blood Group: {selectedPatient.bloodGroup} · Attending: {selectedPatient.attendingDoctorName} · Nurse: {selectedPatient.assignedNurseName}
            </p>
          </div>

          {/* Telemetry Stream Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleLiveTelemetry}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                isLiveTelemetryActive
                  ? 'border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {isLiveTelemetryActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLiveTelemetryActive ? 'Pause Stream' : 'Resume'}</span>
            </button>

            {/* Speed selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTelemetrySpeedMs(1500)}
                className={`px-2 py-1 text-[11px] rounded font-mono ${
                  telemetrySpeedMs === 1500
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 font-bold shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                1.5s
              </button>
              <button
                onClick={() => setTelemetrySpeedMs(3000)}
                className={`px-2 py-1 text-[11px] rounded font-mono ${
                  telemetrySpeedMs === 3000
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 font-bold shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                3.0s
              </button>
            </div>

            {/* Test Emergency Trigger */}
            <button
              type="button"
              onClick={() => triggerSimulatedEmergency(selectedPatient.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all"
              title="Simulate sudden arrhythmia/hypoxia to trigger clinical alerts"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Emergency</span>
            </button>

            {/* Export Telemetry */}
            <button
              type="button"
              onClick={handleExportTelemetry}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-all"
              title="Download CSV telemetry report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Record New Vitals (Sync) */}
            {hasPermission('record_vitals') && (
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Vitals</span>
              </button>
            )}
          </div>
        </div>

        {/* Critical Alert Warning Box if active */}
        {isCritical && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
              <span className="font-semibold">CRITICAL TELEMETRY BREACH:</span>
              <span>{currentVitals.alertReason || 'Immediate medical attention needed'}</span>
            </div>
            <span className="text-[11px] font-mono opacity-80">Telemetry Audio: Synthesizing Alert</span>
          </div>
        )}
      </div>

      {/* Dual-Channel Real-time Waveform Display (ECG + SpO2 Plethysmogram) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-900 gap-2">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>CH1: Lead II ECG (0.05 - 150 Hz)</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>CH2: SpO2 Plethysmogram (Vol: 100%)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Sweep: 25 mm/s</span>
            <span className={isCritical ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {currentVitals.heartRate > 100
                ? 'Sinus Tachycardia'
                : currentVitals.heartRate < 60
                ? 'Sinus Bradycardia'
                : 'Normal Sinus Rhythm'}
            </span>
          </div>
        </div>

        {/* Canvas Monitor */}
        <div className="w-full h-48 bg-[#070b13] rounded-lg overflow-hidden border border-slate-900">
          <canvas ref={canvasRef} width={860} height={192} className="w-full h-full block" />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 mt-2.5 px-1">
          <span>QRS Duration: 88 ms</span>
          <span>QTc: 412 ms</span>
          <span>Pulse Pressure: {pulsePressure} mmHg</span>
          <span>Mean Arterial Pressure (MAP): {mapValue} mmHg</span>
          <span>Perfusion Index: 4.8%</span>
        </div>
      </div>

      {/* 6 Key Clinical Vital Metric Cards with Trend Deltas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Heart Rate */}
        <div
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTrendMetric === 'hr' ? 'ring-2 ring-teal-500' : ''
          } ${
            isCritical && currentVitals.heartRate > 110
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          onClick={() => setActiveTrendMetric('hr')}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Heart Rate</span>
            <Heart className={`w-4 h-4 ${isCritical ? 'text-rose-500 animate-pulse' : 'text-rose-500'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {currentVitals.heartRate}
            </span>
            <span className="text-xs text-slate-500">BPM</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono mt-1">
            {hrDiff > 0 ? (
              <span className="text-rose-500 flex items-center font-bold">
                <TrendingUp className="w-3 h-3" /> +{hrDiff}
              </span>
            ) : hrDiff < 0 ? (
              <span className="text-emerald-500 flex items-center font-bold">
                <TrendingDown className="w-3 h-3" /> {hrDiff}
              </span>
            ) : (
              <span className="text-slate-400 flex items-center">
                <Minus className="w-3 h-3" /> steady
              </span>
            )}
            <span className="text-slate-400 ml-1">Target: 60-100</span>
          </div>
        </div>

        {/* 2. Blood Pressure */}
        <div
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTrendMetric === 'bp' ? 'ring-2 ring-teal-500' : ''
          } ${
            currentVitals.systolicBP > 160
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          onClick={() => setActiveTrendMetric('bp')}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Blood Pressure</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {currentVitals.systolicBP}/{currentVitals.diastolicBP}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            MAP: {mapValue} mmHg · PP: {pulsePressure}
          </div>
        </div>

        {/* 3. SpO2 Oxygen */}
        <div
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTrendMetric === 'spo2' ? 'ring-2 ring-teal-500' : ''
          } ${
            currentVitals.spO2 < 92
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          onClick={() => setActiveTrendMetric('spo2')}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Oxygen (SpO2)</span>
            <Droplet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {currentVitals.spO2}
            </span>
            <span className="text-xs text-slate-500">%</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono mt-1">
            {spo2Diff < 0 ? (
              <span className="text-rose-500 flex items-center font-bold">
                <TrendingDown className="w-3 h-3" /> {spo2Diff}%
              </span>
            ) : (
              <span className="text-emerald-500 flex items-center">
                <Minus className="w-3 h-3" /> nominal
              </span>
            )}
            <span className="text-slate-400 ml-1">{currentVitals.spO2 < 92 ? 'Hypoxic' : 'Room Air'}</span>
          </div>
        </div>

        {/* 4. Respiratory Rate */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Resp. Rate</span>
            <Wind className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {currentVitals.respiratoryRate}
            </span>
            <span className="text-xs text-slate-500">bpm</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Target: 12 - 20 bpm
          </div>
        </div>

        {/* 5. Temperature */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Temperature</span>
            <button
              onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
              className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-bold"
            >
              °{tempUnit === 'C' ? 'F' : 'C'}
            </button>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {displayTemp}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {currentVitals.temperature > 38.0 ? 'Pyrexia / Fever' : 'Normothermic'}
          </div>
        </div>

        {/* 6. Blood Glucose & GCS */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Blood Glucose</span>
            <Droplet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {currentVitals.bloodGlucose}
            </span>
            <span className="text-xs text-slate-500">mg/dL</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            GCS: {currentVitals.gcs}/15 · Pain: {currentVitals.painScale}/10
          </div>
        </div>
      </div>

      {/* Interactive Trend Chart Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Longitudinal Trend Vector (Last {history.length} Readings)
            </h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTrendMetric('hr')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTrendMetric === 'hr'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Heart Rate
            </button>
            <button
              onClick={() => setActiveTrendMetric('bp')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTrendMetric === 'bp'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Systolic BP
            </button>
            <button
              onClick={() => setActiveTrendMetric('spo2')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTrendMetric === 'spo2'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              SpO2 %
            </button>
          </div>
        </div>

        {/* SVG Sparkline Area */}
        <div className="relative w-full h-32 bg-slate-50 dark:bg-slate-950/60 rounded-lg p-2 border border-slate-100 dark:border-slate-800 overflow-hidden">
          <svg viewBox="0 0 560 130" className="w-full h-full preserve-3d">
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid references */}
            <line x1="20" y1="20" x2="540" y2="20" stroke="#94a3b8" strokeDasharray="3 3" opacity="0.2" />
            <line x1="20" y1="65" x2="540" y2="65" stroke="#94a3b8" strokeDasharray="3 3" opacity="0.2" />
            <line x1="20" y1="110" x2="540" y2="110" stroke="#94a3b8" strokeDasharray="3 3" opacity="0.2" />

            {/* Fill under line */}
            {pathD && (
              <path
                d={`${pathD} L ${trendPoints[trendPoints.length - 1].x} 115 L ${trendPoints[0].x} 115 Z`}
                fill="url(#trendGradient)"
              />
            )}

            {/* Main Trend Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Point circles */}
            {trendPoints.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="4" fill="#0d9488" stroke="#ffffff" strokeWidth="1.5" />
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {p.val}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Historical Telemetry Stream Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Chronological Telemetry Stream ({selectedPatient.vitalsHistory.length} logs)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Latest: {currentVitals.timestamp}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-3 text-right">Heart Rate</th>
                <th className="py-2.5 px-3 text-right">BP (Sys/Dia)</th>
                <th className="py-2.5 px-3 text-right">SpO2</th>
                <th className="py-2.5 px-3 text-right">Resp Rate</th>
                <th className="py-2.5 px-3 text-right">Temp</th>
                <th className="py-2.5 px-3 text-right">Glucose</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {selectedPatient.vitalsHistory.slice().reverse().map(reading => (
                <tr key={reading.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{reading.timestamp}</td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                      reading.heartRate > 105 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {reading.heartRate} bpm
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                    {reading.systolicBP}/{reading.diastolicBP}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                      reading.spO2 < 93 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {reading.spO2}%
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                    {reading.respiratoryRate} bpm
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                    {reading.temperature.toFixed(1)}°C
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                    {reading.bloodGlucose} mg/dL
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {reading.alertLevel === 'critical' ? (
                      <span className="text-[10px] font-sans font-bold text-rose-600 dark:text-rose-400">Critical</span>
                    ) : reading.alertLevel === 'warning' ? (
                      <span className="text-[10px] font-sans font-medium text-amber-600 dark:text-amber-400">Warning</span>
                    ) : (
                      <span className="text-[10px] font-sans text-emerald-600 dark:text-emerald-400">Nominal</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-500 truncate max-w-[140px]">
                    {reading.recordedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Input Vitals Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Record Bedside Vitals - {selectedPatient.name}
                </h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="220"
                    required
                    value={formHR}
                    onChange={e => setFormHR(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    SpO2 Oxygen (%)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="100"
                    required
                    value={formSpO2}
                    onChange={e => setFormSpO2(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="260"
                    required
                    value={formSys}
                    onChange={e => setFormSys(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="160"
                    required
                    value={formDia}
                    onChange={e => setFormDia(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Resp. Rate
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="60"
                    required
                    value={formRR}
                    onChange={e => setFormRR(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="34"
                    max="43"
                    required
                    value={formTemp}
                    onChange={e => setFormTemp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    required
                    value={formGlucose}
                    onChange={e => setFormGlucose(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Pain Scale (0 - 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formPain}
                    onChange={e => setFormPain(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    GCS Score (3 - 15)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={formGCS}
                    onChange={e => setFormGCS(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm"
                >
                  Save & Synchronize Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
