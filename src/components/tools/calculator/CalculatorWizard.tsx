'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { Home, Paintbrush, Wrench, Calculator, ChevronLeft, ChevronRight, Check, Upload, Sparkles, FileSpreadsheet, FileText, Image, X, AlertTriangle } from 'lucide-react';
import { type Room, type WorkCategories, type QualityLevel, type CalculatorStep, DEFAULT_WORK_CATEGORIES, type RoomType, type FlooringType, type WallType, type CeilingType } from './types';
import { StepRooms } from './StepRooms';
import { StepMaterials } from './StepMaterials';
import { StepWork } from './StepWork';
import { StepSummary } from './StepSummary';
import { createRoom, createRoomWithParams } from '@/utils/calculator';
import { aiService, ProjectAnalysisResult } from '@/services/ai';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';

interface CalculatorWizardProps {
  t: (key: string) => string;
}

const STEPS: { step: CalculatorStep; icon: typeof Home; key: string }[] = [
  { step: 1, icon: Home, key: 'rooms' },
  { step: 2, icon: Paintbrush, key: 'materials' },
  { step: 3, icon: Wrench, key: 'work' },
  { step: 4, icon: Calculator, key: 'summary' },
];

// File type icon helper
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return FileSpreadsheet;
  if (ext === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return Image;
  return FileText;
};

// Extract text from Excel files
const extractTextFromExcel = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        let text = '';
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
          jsonData.forEach((row) => {
            if (Array.isArray(row) && row.length > 0) {
              const rowText = row.filter(cell => cell !== null && cell !== undefined && cell !== '').join(' - ');
              if (rowText.trim()) {
                text += rowText + '\n';
              }
            }
          });
        });
        resolve(text.trim());
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// Extract text from PDF files
const extractTextFromPDF = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    text += pageText + '\n';
  }
  return text.trim();
};

// Convert image file to base64
const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

// Check if file is an image
const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
};

// Get image MIME type
const getImageMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return mimeTypes[ext || ''] || 'image/jpeg';
};

export function CalculatorWizard({ t }: CalculatorWizardProps) {
  const { locale } = useLanguage();
  const [currentStep, setCurrentStep] = useState<CalculatorStep>(1);
  const [rooms, setRooms] = useState<Room[]>([createRoom('living')]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [workCategories, setWorkCategories] = useState<WorkCategories>(DEFAULT_WORK_CATEGORIES);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('standard');
  const [includeMaterials, setIncludeMaterials] = useState(true);

  // AI Upload state
  const [showUpload, setShowUpload] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure activeRoomId is valid
  const effectiveActiveRoomId = useMemo(() => {
    if (activeRoomId && rooms.find((r) => r.id === activeRoomId)) {
      return activeRoomId;
    }
    return rooms[0]?.id || null;
  }, [activeRoomId, rooms]);

  // Apply AI analysis results to calculator state
  const applyAIResults = useCallback((result: ProjectAnalysisResult) => {
    // Create rooms from AI analysis
    if (result.rooms && result.rooms.length > 0) {
      const newRooms = result.rooms.map((room) =>
        createRoomWithParams({
          name: room.name,
          type: room.type as RoomType,
          length: room.length || 4,
          width: room.width || 3,
          height: room.height || 2.7,
          doors: room.doors || 1,
          windows: room.windows || 1,
          flooring: room.flooring as FlooringType || 'laminate',
          walls: room.walls as WallType || 'paint',
          ceiling: room.ceiling as CeilingType || 'paint',
        })
      );
      setRooms(newRooms);
    }

    // Apply work suggestions
    if (result.workSuggestions) {
      const ws = result.workSuggestions;
      setWorkCategories({
        demolition: ws.demolition ?? true,
        electrical: {
          enabled: true,
          outlets: ws.electrical?.outlets ?? 10,
          switches: ws.electrical?.switches ?? 6,
          lightingPoints: ws.electrical?.lightingPoints ?? 8,
          acPoints: ws.electrical?.acPoints ?? 1,
        },
        plumbing: {
          enabled: true,
          toilets: ws.plumbing?.toilets ?? 1,
          sinks: ws.plumbing?.sinks ?? 2,
          showers: ws.plumbing?.showers ?? 1,
          bathtubs: ws.plumbing?.bathtubs ?? 0,
        },
        heating: {
          enabled: true,
          radiators: ws.heating?.radiators ?? 4,
          underfloorArea: ws.heating?.underfloorArea ?? 0,
          boiler: false,
        },
        doorsWindows: {
          enabled: true,
          interiorDoors: ws.doorsWindows?.interiorDoors ?? 4,
          entranceDoor: ws.doorsWindows?.entranceDoor ?? false,
        },
      });
    }

    // Apply quality level
    if (result.qualityLevel) {
      setQualityLevel(result.qualityLevel);
    }
  }, []);

  // Handle file upload and AI analysis
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setIsAnalyzing(true);
    setAiError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let result;

      // Handle image files with AI vision
      if (isImageFile(file.name)) {
        const imageBase64 = await imageToBase64(file);
        const imageMimeType = getImageMimeType(file.name);
        result = await aiService.analyzeProject('', locale, imageBase64, imageMimeType);
      } else {
        // Extract text from document files
        let text = '';

        if (ext === 'xlsx' || ext === 'xls') {
          text = await extractTextFromExcel(file);
        } else if (ext === 'pdf') {
          text = await extractTextFromPDF(file);
        } else {
          throw new Error('Unsupported file type');
        }

        if (!text.trim()) {
          throw new Error('Could not extract text from file');
        }

        // Send to AI for analysis
        result = await aiService.analyzeProject(text, locale);
      }

      // Apply AI results to calculator
      applyAIResults(result);
      setAiNotes(result.notes || []);
      setShowUpload(false);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setAiError(err?.response?.data?.message || err?.message || t('tools.calculator.aiUploadError'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [locale, t, applyAIResults]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFileUpload]);

  const skipUpload = useCallback(() => {
    setShowUpload(false);
  }, []);

  const totalFloorArea = useMemo(() => {
    return rooms.reduce((sum, room) => sum + room.computed.floorArea, 0);
  }, [rooms]);

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev: CalculatorStep) => (prev + 1) as CalculatorStep);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev: CalculatorStep) => (prev - 1) as CalculatorStep);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((step: CalculatorStep) => {
    setCurrentStep(step);
  }, []);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return rooms.length > 0 && rooms.every(
          (r) => r.dimensions.length > 0 && r.dimensions.width > 0
        );
      case 2:
        return true; // Materials have defaults
      case 3:
        return true; // Work categories are optional
      case 4:
        return true;
      default:
        return true;
    }
  }, [currentStep, rooms]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepRooms rooms={rooms} onRoomsChange={setRooms} t={t} />;
      case 2:
        return (
          <StepMaterials
            rooms={rooms}
            activeRoomId={effectiveActiveRoomId}
            onRoomsChange={setRooms}
            onActiveRoomChange={setActiveRoomId}
            t={t}
          />
        );
      case 3:
        return (
          <StepWork
            workCategories={workCategories}
            totalFloorArea={totalFloorArea}
            onWorkCategoriesChange={setWorkCategories}
            t={t}
          />
        );
      case 4:
        return (
          <StepSummary
            rooms={rooms}
            workCategories={workCategories}
            qualityLevel={qualityLevel}
            includeMaterials={includeMaterials}
            onQualityLevelChange={setQualityLevel}
            onIncludeMaterialsChange={setIncludeMaterials}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Upload Section */}
      {showUpload && (
        <div className="bg-gradient-to-br from-forest-50 to-forest-100 dark:from-forest-900/20 dark:to-forest-800/10 rounded-2xl border border-forest-200 dark:border-forest-800/30 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-forest-200 dark:bg-forest-900/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-forest-600 dark:text-forest-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold text-forest-800 dark:text-forest-200">
                  {t('tools.calculator.aiUpload.title')}
                </h3>
                <p className="text-sm text-forest-600 dark:text-forest-400">
                  {t('tools.calculator.aiUpload.subtitle')}
                </p>
              </div>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-forest-200 dark:border-forest-900/50" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-forest-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-forest-100 dark:bg-forest-900/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-forest-500 animate-pulse" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-sm text-forest-700 dark:text-forest-300 font-medium">
                  {t('tools.calculator.aiUpload.analyzing')}
                </p>
                {uploadedFile && (
                  <p className="text-xs text-forest-600 dark:text-forest-400 mt-2">{uploadedFile.name}</p>
                )}
              </div>
            ) : (
              <>
                {aiError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-300">{aiError}</p>
                    </div>
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-forest-300 dark:border-forest-700 rounded-xl p-6 text-center cursor-pointer hover:border-forest-400 dark:hover:border-forest-600 hover:bg-forest-50/50 dark:hover:bg-forest-900/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-forest-200/50 dark:bg-forest-900/30 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-forest-600 dark:text-forest-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-forest-700 dark:text-forest-300 mb-1">
                    {t('tools.calculator.aiUpload.dropHere')}
                  </p>
                  <p className="text-xs text-forest-500 dark:text-forest-500">
                    {t('tools.calculator.aiUpload.formats')}
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <button
                  onClick={skipUpload}
                  className="w-full mt-4 py-3 text-sm font-medium text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors"
                >
                  {t('tools.calculator.aiUpload.skip')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Notes (shown after successful upload) */}
      {!showUpload && aiNotes.length > 0 && (
        <div className="bg-forest-50 dark:bg-forest-900/20 rounded-xl p-4 border border-forest-200 dark:border-forest-800/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-forest-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-forest-700 dark:text-forest-300 mb-2">
                {t('tools.calculator.aiUpload.notes')}
              </p>
              <ul className="space-y-1">
                {aiNotes.slice(0, 3).map((note, i) => (
                  <li key={i} className="text-xs text-forest-600 dark:text-forest-400 flex items-start gap-1.5">
                    <span className="text-forest-400 mt-0.5">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setAiNotes([])}
              className="p-1 text-forest-400 hover:text-forest-600 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Step Progress */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-center">
          {STEPS.map(({ step, icon: Icon, key }, index) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;
            const isClickable = step <= currentStep || (step === currentStep + 1 && canProceed);

            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => isClickable && handleStepClick(step)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center gap-1.5 transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/30'
                        : isCompleted
                        ? 'bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={2} />
                    ) : (
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block min-w-[60px] text-center ${
                      isActive
                        ? 'text-terracotta-600 dark:text-terracotta-400'
                        : isCompleted
                        ? 'text-forest-600 dark:text-forest-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {t(`tools.calculator.steps.${key}`)}
                  </span>
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors ${
                      currentStep > step
                        ? 'bg-forest-400 dark:bg-forest-600'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            {t('tools.calculator.back')}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-semibold shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {t('tools.calculator.next')}
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
