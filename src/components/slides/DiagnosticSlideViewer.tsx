import React, { useState, useEffect } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { DiagnosticSlide, LabTestMetric } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Crosshair,
  FileText,
  Eye,
  Sliders,
  Send,
  Ruler,
  SplitSquareVertical,
  Printer,
  Sparkles,
} from 'lucide-react';

export const DiagnosticSlideViewer: React.FC = () => {
  const { selectedPatient, showToast } = useHospital();
  const { currentUser } = useAuth();

  const slides: DiagnosticSlide[] = selectedPatient.diagnosticSlides || [];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [comparisonSlideIndex, setComparisonSlideIndex] = useState(1);
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  // Diagnostic Image Workstation controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isInverted, setIsInverted] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showCrosshairs, setShowCrosshairs] = useState(false);
  const [showCaliper, setShowCaliper] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePreset, setActivePreset] = useState<'Default' | 'Bone' | 'SoftTissue' | 'Lung'>('Default');

  // Consultation note editing
  const [consultationText, setConsultationText] = useState('');
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});

  // Reset viewport controls on slide switch
  useEffect(() => {
    setZoomLevel(1);
    setIsInverted(false);
    setBrightness(100);
    setContrast(100);
    setActivePreset('Default');
    setShowCaliper(false);
  }, [currentSlideIndex]);

  const activeSlide: DiagnosticSlide | undefined = slides[currentSlideIndex];
  const compareSlide: DiagnosticSlide | undefined =
    slides[comparisonSlideIndex % Math.max(1, slides.length)];

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const applyPreset = (preset: 'Default' | 'Bone' | 'SoftTissue' | 'Lung') => {
    setActivePreset(preset);
    if (preset === 'Default') {
      setBrightness(100);
      setContrast(100);
    } else if (preset === 'Bone') {
      setBrightness(115);
      setContrast(165);
      showToast('Window/Level: High Contrast Bone Filter applied', 'info');
    } else if (preset === 'SoftTissue') {
      setBrightness(95);
      setContrast(130);
      showToast('Window/Level: Soft Tissue Filter applied', 'info');
    } else if (preset === 'Lung') {
      setBrightness(125);
      setContrast(145);
      showToast('Window/Level: Pulmonary Airspace Filter applied', 'info');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevSlide();
      if (e.key === 'ArrowRight') handleNextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSaveConsultationNote = () => {
    if (!activeSlide || !consultationText.trim()) return;
    setSavedNotes(prev => ({
      ...prev,
      [activeSlide.id]: consultationText.trim(),
    }));
    setConsultationText('');
    showToast('Consultation remark saved to diagnostic slide', 'success');
  };

  if (!activeSlide || slides.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          No Diagnostic Slides Available for {selectedPatient.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Imaging studies, scans, and laboratory blood panels will appear here once ordered.
        </p>
      </div>
    );
  }

  // Render High-Precision Clinical SVG Visualizations for Diagnostic Modalities
  const renderDiagnosticVisual = (slide: DiagnosticSlide, customZoom = zoomLevel) => {
    const filterStyle = {
      filter: `${isInverted ? 'invert(1) ' : ''}brightness(${brightness}%) contrast(${contrast}%)`,
      transform: `scale(${customZoom})`,
      transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
    };

    if (slide.visualType === 'chest_xray') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full max-h-[460px] object-contain"
            style={filterStyle}
          >
            {/* Dark background */}
            <rect width="600" height="600" fill="#070b11" />

            {/* Thorax Outline */}
            <path
              d="M 120 180 Q 300 130 480 180 L 510 490 Q 300 560 90 490 Z"
              fill="#101725"
              stroke="#24334d"
              strokeWidth="2"
            />

            {/* Spine vertebral column */}
            <path
              d="M 300 100 L 300 520"
              stroke="#475569"
              strokeWidth="18"
              strokeDasharray="14 6"
              strokeLinecap="round"
            />

            {/* Clavicles */}
            <path
              d="M 180 160 Q 240 185 295 180"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 420 160 Q 360 185 305 180"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Ribs (Bilateral arches) */}
            {[210, 245, 280, 315, 350, 385, 420, 455].map((y, idx) => (
              <g key={idx} opacity="0.45">
                <path
                  d={`M 290 ${y} Q ${200 - idx * 6} ${y + 25} ${140 - idx * 4} ${y + 45}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d={`M 310 ${y} Q ${400 + idx * 6} ${460 + idx * 4} ${y + 45}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* Radiolucent Lung Fields (Darker air spaces) */}
            <ellipse cx="220" cy="320" rx="65" ry="110" fill="#040608" opacity="0.9" />
            <ellipse cx="380" cy="320" rx="65" ry="110" fill="#040608" opacity="0.9" />

            {/* Bronchovascular markings */}
            <path
              d="M 270 280 Q 230 300 200 340 M 270 310 Q 220 330 190 380"
              stroke="#475569"
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 330 280 Q 370 300 400 340 M 330 310 Q 380 330 410 380"
              stroke="#475569"
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />

            {/* Cardiac Silhouette (Heart shadow shifted left) */}
            <path
              d="M 270 250 C 270 250 210 320 220 400 C 230 460 330 470 360 440 C 390 410 380 310 340 270 Z"
              fill="#2d3748"
              stroke="#4a5568"
              strokeWidth="2"
              opacity="0.85"
            />

            {/* Metallic LAD stent marker indicator */}
            <circle cx="280" cy="340" r="4" fill="#38bdf8" />
            <circle
              cx="280"
              cy="340"
              r="10"
              stroke="#38bdf8"
              strokeWidth="1"
              fill="none"
              strokeDasharray="3 2"
            />
            <text x="296" y="344" fill="#38bdf8" fontSize="11" fontFamily="monospace">
              LAD STENT
            </text>

            {/* Radiologic markers */}
            <text x="50" y="80" fill="#94a3b8" fontSize="16" fontWeight="bold" fontFamily="monospace">
              R (PA)
            </text>
            <text x="50" y="105" fill="#64748b" fontSize="11" fontFamily="monospace">
              78 kVp · 3.2 mAs
            </text>
          </svg>
        </div>
      );
    }

    if (slide.visualType === 'brain_mri') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full max-h-[460px] object-contain"
            style={filterStyle}
          >
            <rect width="600" height="600" fill="#040608" />
            <ellipse
              cx="300"
              cy="300"
              rx="210"
              ry="240"
              fill="#0d1522"
              stroke="#64748b"
              strokeWidth="8"
            />
            <ellipse cx="300" cy="300" rx="198" ry="226" fill="#1e293b" />
            <line x1="300" y1="80" x2="300" y2="520" stroke="#0f172a" strokeWidth="3.5" />

            {/* Lateral Ventricles */}
            <path
              d="M 285 240 C 270 210 250 250 260 300 C 270 340 288 350 290 310 Z"
              fill="#040608"
              stroke="#334155"
              strokeWidth="2"
            />
            <path
              d="M 315 240 C 330 210 350 250 340 300 C 330 340 312 350 310 310 Z"
              fill="#040608"
              stroke="#334155"
              strokeWidth="2"
            />

            <ellipse cx="300" cy="325" rx="4" ry="24" fill="#040608" />

            <path d="M 170 200 Q 200 230 180 260" stroke="#0f172a" strokeWidth="2.5" fill="none" />
            <path d="M 430 200 Q 400 230 420 260" stroke="#0f172a" strokeWidth="2.5" fill="none" />
            <path d="M 150 310 Q 185 330 160 360" stroke="#0f172a" strokeWidth="2.5" fill="none" />
            <path d="M 450 310 Q 415 330 440 360" stroke="#0f172a" strokeWidth="2.5" fill="none" />

            <text x="60" y="80" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
              AX DWI / FLAIR
            </text>
            <text x="60" y="100" fill="#64748b" fontSize="11" fontFamily="monospace">
              TR 9000 · TE 94 · b=1000
            </text>
            <text x="500" y="80" fill="#94a3b8" fontSize="14" fontFamily="monospace">
              L
            </text>
          </svg>
        </div>
      );
    }

    if (slide.visualType === 'cardiac_echo') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full max-h-[460px] object-contain"
            style={filterStyle}
          >
            <rect width="600" height="600" fill="#03060a" />
            {/* Ultrasound sector beam cone */}
            <path
              d="M 300 70 L 100 500 A 380 380 0 0 0 500 500 Z"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="2"
            />

            {/* Apical 4-chamber contours */}
            <path
              d="M 280 220 C 230 280 200 380 260 450 C 300 480 340 450 350 400 C 370 300 320 230 280 220 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="3"
            />
            {/* Ventricular septum */}
            <line x1="290" y1="240" x2="300" y2="440" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />

            {/* Mitral valve leaflets */}
            <line x1="250" y1="360" x2="280" y2="380" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="310" y1="380" x2="340" y2="360" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Doppler color jet simulation */}
            <ellipse cx="295" cy="385" rx="18" ry="12" fill="#38bdf8" opacity="0.6" />

            <text x="50" y="80" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
              TTE APICAL 4-CHAMBER
            </text>
            <text x="50" y="100" fill="#64748b" fontSize="11" fontFamily="monospace">
              LVEF: 42% · Color Doppler 2.5 MHz
            </text>
          </svg>
        </div>
      );
    }

    if (slide.visualType === 'abdominal_ct') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full max-h-[460px] object-contain"
            style={filterStyle}
          >
            <rect width="600" height="600" fill="#05080e" />
            <ellipse
              cx="300"
              cy="300"
              rx="230"
              ry="190"
              fill="#111827"
              stroke="#374151"
              strokeWidth="12"
            />

            {/* Spine */}
            <circle cx="300" cy="420" r="28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="300" cy="420" r="10" fill="#334155" />

            {/* Aorta */}
            <circle cx="280" cy="380" r="14" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />

            {/* Liver */}
            <path
              d="M 140 220 C 180 160 280 180 290 240 C 295 310 240 370 160 340 C 130 320 120 260 140 220 Z"
              fill="#374151"
              stroke="#4b5563"
              strokeWidth="2"
            />

            {/* Gallbladder with inflamed wall */}
            <ellipse cx="260" cy="280" rx="22" ry="32" fill="#030712" stroke="#f43f5e" strokeWidth="5" />
            <circle cx="258" cy="275" r="5" fill="#f8fafc" />
            <circle cx="264" cy="288" r="4.5" fill="#f8fafc" />

            {/* Spleen */}
            <ellipse cx="440" cy="260" rx="36" ry="54" fill="#374151" stroke="#4b5563" strokeWidth="2" />

            <text x="50" y="70" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
              CT ABDOMEN / PELVIS + C
            </text>
            <text x="50" y="90" fill="#64748b" fontSize="11" fontFamily="monospace">
              Window: W:400 L:40 (Soft Tissue)
            </text>
          </svg>
        </div>
      );
    }

    if (slide.visualType === 'histology') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-[#2d0a27] overflow-hidden select-none">
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full max-h-[460px] object-contain"
            style={filterStyle}
          >
            <rect width="600" height="600" fill="#4a154b" />
            <circle cx="300" cy="300" r="280" fill="#86198f" opacity="0.4" />

            {/* Cellular Basophilic Nuclei scatter */}
            {Array.from({ length: 45 }).map((_, i) => {
              const cx = 80 + (i * 37) % 440;
              const cy = 90 + (i * 47) % 420;
              const r = 5 + (i % 4);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="#1e1b4b"
                  stroke="#311042"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
              );
            })}

            {/* Glandular lumen architecture */}
            <ellipse cx="250" cy="240" rx="70" ry="45" fill="#fdf2f8" stroke="#701a75" strokeWidth="8" opacity="0.9" />
            <ellipse cx="400" cy="360" rx="55" ry="38" fill="#fdf2f8" stroke="#701a75" strokeWidth="6" opacity="0.9" />

            <text x="40" y="60" fill="#fbcfe8" fontSize="13" fontWeight="bold" fontFamily="monospace">
              H&E STAIN · 40X MAGNIFICATION
            </text>
            <text x="40" y="80" fill="#e879f9" fontSize="11" fontFamily="monospace">
              Gallbladder Mucosal Section
            </text>
          </svg>
        </div>
      );
    }

    if (slide.visualType === 'blood_panel') {
      return (
        <div className="w-full h-full p-4 sm:p-6 bg-slate-950 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Comprehensive Laboratory Panel
              </h4>
              <p className="text-xs text-slate-400">Specimen: Venous Blood · Auto-Analyzer Cobas 8000</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Instrument Calibrated: Nominal</span>
          </div>

          <div className="space-y-3">
            {slide.labMetrics?.map((metric: LabTestMetric, idx: number) => {
              const isHigh = metric.status === 'high';
              const isLow = metric.status === 'low';
              const percentage = Math.min(
                100,
                Math.max(
                  0,
                  ((metric.value - metric.refMin * 0.7) / (metric.refMax * 1.3 - metric.refMin * 0.7)) * 100
                )
              );

              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-[180px]">
                    <div className="text-xs font-bold text-slate-200">{metric.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Ref: {metric.refMin} - {metric.refMax} {metric.unit}
                    </div>
                  </div>

                  {/* Visual Range Bar */}
                  <div className="flex-1 max-w-xs mx-2">
                    <div className="h-2 w-full bg-slate-800 rounded-full relative overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHigh ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end font-mono">
                    <span
                      className={`text-sm font-extrabold ${
                        isHigh ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'
                      }`}
                    >
                      {metric.value} {metric.unit}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isHigh
                          ? 'bg-rose-950/60 text-rose-300'
                          : isLow
                          ? 'bg-amber-950/60 text-amber-300'
                          : 'bg-emerald-950/40 text-emerald-300'
                      }`}
                    >
                      {metric.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <Eye className="w-12 h-12 text-slate-600 mb-2" />
        <span className="text-sm font-semibold text-slate-300">{slide.title}</span>
        <span className="text-xs text-slate-500 mt-1 font-mono">Modality: {slide.modality}</span>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      {/* Slide Carousel Header Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Consultation Slides ({currentSlideIndex + 1} of {slides.length})
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {activeSlide.modality}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">{activeSlide.date}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {activeSlide.title}
          </h2>
        </div>

        {/* Carousel & Tool Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Slide Arrow Navigation */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
              title="Previous Slide (Left Arrow)"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-600 dark:text-slate-400">
              {currentSlideIndex + 1}/{slides.length}
            </span>
            <button
              type="button"
              onClick={handleNextSlide}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
              title="Next Slide (Right Arrow)"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Window / Level Filter Presets */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => applyPreset('Default')}
              className={`px-2 py-1 rounded transition-all ${
                activePreset === 'Default'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Std
            </button>
            <button
              onClick={() => applyPreset('Bone')}
              className={`px-2 py-1 rounded transition-all ${
                activePreset === 'Bone'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Bone
            </button>
            <button
              onClick={() => applyPreset('SoftTissue')}
              className={`px-2 py-1 rounded transition-all ${
                activePreset === 'SoftTissue'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Soft
            </button>
            <button
              onClick={() => applyPreset('Lung')}
              className={`px-2 py-1 rounded transition-all ${
                activePreset === 'Lung'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Lung
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-1 text-[11px] font-mono text-slate-500">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setBrightness(100);
                setContrast(100);
                setIsInverted(false);
                setActivePreset('Default');
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Reset Viewport"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Radiology Invert Tool */}
          <button
            type="button"
            onClick={() => setIsInverted(!isInverted)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isInverted
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Invert Image Negative (High Contrast Bone/Parenchyma View)"
          >
            Invert
          </button>

          {/* Caliper Measurement tool */}
          <button
            type="button"
            onClick={() => {
              setShowCaliper(!showCaliper);
              if (!showCaliper) showToast('Digital Caliper placed: 18.4 mm measured', 'info');
            }}
            className={`p-2 rounded-lg border transition-colors ${
              showCaliper
                ? 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle Digital Measurement Caliper (mm)"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Crosshairs toggle */}
          <button
            type="button"
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`p-2 rounded-lg border transition-colors ${
              showCrosshairs
                ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle Diagnostic Crosshair Alignment"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Split-Screen Comparison Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsComparisonMode(!isComparisonMode);
              showToast(
                !isComparisonMode
                  ? 'Side-by-side comparison mode activated'
                  : 'Single slide view restored',
                'info'
              );
            }}
            className={`p-2 rounded-lg border transition-colors ${
              isComparisonMode
                ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle Side-by-Side Comparison Mode"
          >
            <SplitSquareVertical className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            title={isFullscreen ? 'Exit Consultation Fullscreen' : 'Enter Consultation Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slide Workspace Split: Visual Stage + Clinical Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Stage Container (Single or Split Comparison) */}
        <div
          className={`${
            isComparisonMode ? 'lg:col-span-12' : 'lg:col-span-8'
          } bg-black rounded-xl border border-slate-800 overflow-hidden relative min-h-[440px] flex items-center justify-center`}
        >
          {isComparisonMode ? (
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {/* Primary Slide */}
              <div className="relative p-2 flex flex-col items-center justify-center min-h-[400px]">
                <div className="absolute top-3 left-3 z-30 bg-slate-900/90 text-teal-400 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-800">
                  Current: {activeSlide.title} ({activeSlide.modality})
                </div>
                {renderDiagnosticVisual(activeSlide, 0.95)}
              </div>

              {/* Comparison Slide */}
              <div className="relative p-2 flex flex-col items-center justify-center min-h-[400px]">
                <div className="absolute top-3 left-3 z-30 bg-slate-900/90 text-cyan-400 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-800 flex items-center gap-2">
                  <span>Compare:</span>
                  <select
                    value={comparisonSlideIndex}
                    onChange={e => setComparisonSlideIndex(Number(e.target.value))}
                    className="bg-slate-800 text-white rounded text-[10px] px-1 py-0.5 border border-slate-700"
                  >
                    {slides.map((s, idx) => (
                      <option key={s.id} value={idx}>
                        {s.title} ({s.modality})
                      </option>
                    ))}
                  </select>
                </div>
                {compareSlide && renderDiagnosticVisual(compareSlide, 0.95)}
              </div>
            </div>
          ) : (
            <>
              {renderDiagnosticVisual(activeSlide)}

              {/* Crosshair Overlay */}
              {showCrosshairs && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute top-1/2 left-0 right-0 border-t border-cyan-400/50 border-dashed" />
                  <div className="absolute left-1/2 top-0 bottom-0 border-l border-cyan-400/50 border-dashed" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-cyan-400/70" />
                </div>
              )}

              {/* Digital Caliper Overlay */}
              {showCaliper && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                  <div className="relative w-64 border-t-2 border-amber-400 border-dashed">
                    <div className="absolute -left-1 -top-2 w-1.5 h-4 bg-amber-400" />
                    <div className="absolute -right-1 -top-2 w-1.5 h-4 bg-amber-400" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-950/90 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500">
                      18.4 mm · 0.0°
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bottom Slide Info HUD */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800">
            <span>Region: {activeSlide.anatomicRegion}</span>
            <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
            <span>Preset: {activePreset}</span>
            <span className={activeSlide.status === 'Abnormal' ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              Status: {activeSlide.status}
            </span>
          </div>
        </div>

        {/* Side Panel: Radiologist Impressions, Findings, and Consultation Notes */}
        {!isComparisonMode && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Diagnostic Report
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Radiologist Impression
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {activeSlide.radiologistImpression}
                </p>
              </div>

              {/* Key Clinical Findings */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Itemized Observations
                </h4>
                <ul className="space-y-1.5">
                  {activeSlide.findings.map((f, i) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-teal-500 font-bold mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prior Consultation Remark if any */}
              {savedNotes[activeSlide.id] && (
                <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
                  <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300">
                    Consultation Remark Added:
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                    "{savedNotes[activeSlide.id]}"
                  </p>
                </div>
              )}
            </div>

            {/* Add Consultation Doctor Note Form */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Add Consultation Round Note
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={consultationText}
                  onChange={e => setConsultationText(e.target.value)}
                  placeholder="e.g. Discussed stent patency with family..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleSaveConsultationNote}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Synchronized to {selectedPatient.name}’s EMR chart
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide Thumbnails Strip for Quick Switching */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Slide Thumbnails (Click to Jump)
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {slides.map((s, idx) => {
            const isCurrent = idx === currentSlideIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`flex-shrink-0 w-36 p-2 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold truncate">
                  Slide {idx + 1}: {s.modality}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {s.title}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {s.anatomicRegion}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
