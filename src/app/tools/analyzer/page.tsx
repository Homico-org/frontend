'use client';

import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { type PriceCategory } from '@/data/priceDatabase';
import { aiService, EstimateAnalysisResult } from '@/services/ai';
import * as XLSX from 'xlsx';
import {
  FileSearch,
  Upload,
  Camera,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Download,
  RefreshCw,
  Sparkles,
  Shield,
  BarChart3,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Image,
  X,
  Minus,
} from 'lucide-react';

// UI Components
import { PageHeader } from '@/components/ui/PageHeader';

// Tools Components
import { categoryIconMap } from '@/components/tools/prices/categoryIcons';

interface AnalyzedItem {
  id: string;
  name: string;
  category: PriceCategory;
  quantity: number;
  unitPrice: number;
  total: number;
  marketAverage: number;
  status: 'low' | 'normal' | 'high' | 'very_high' | 'missing';
}

interface AnalysisResult {
  items: AnalyzedItem[];
  totalAmount: number;
  potentialSavings: number;
  alerts: {
    type: 'missing_price' | 'high_price' | 'very_high_price' | 'missing_item';
    message: string;
    itemName: string;
  }[];
  confidence: number;
}

const generateDemoAnalysis = (t: (key: string) => string): AnalysisResult => {
  const pcs = t('tools.analyzer.demoItems.pcs');
  const sqm = t('tools.analyzer.demoItems.sqm');
  const lm = t('tools.analyzer.demoItems.lm');

  const demoItems: AnalyzedItem[] = [
    { id: '1', name: `${t('tools.analyzer.demoItems.electricalPoints')} (56 ${pcs})`, category: 'electrical', quantity: 56, unitPrice: 60, total: 3360, marketAverage: 60, status: 'normal' },
    { id: '2', name: t('tools.analyzer.demoItems.electricalPanel'), category: 'electrical', quantity: 1, unitPrice: 450, total: 450, marketAverage: 400, status: 'high' },
    { id: '3', name: `${t('tools.analyzer.demoItems.plumbingPoints')} (10)`, category: 'plumbing', quantity: 10, unitPrice: 120, total: 1200, marketAverage: 120, status: 'normal' },
    { id: '4', name: t('tools.analyzer.demoItems.bathtubInstall'), category: 'plumbing', quantity: 1, unitPrice: 300, total: 300, marketAverage: 250, status: 'high' },
    { id: '5', name: `${t('tools.analyzer.demoItems.wallPlastering')} (120 ${sqm})`, category: 'walls', quantity: 120, unitPrice: 35, total: 4200, marketAverage: 30, status: 'high' },
    { id: '6', name: `${t('tools.analyzer.demoItems.wallPutty')} (120 ${sqm})`, category: 'walls', quantity: 120, unitPrice: 18, total: 2160, marketAverage: 18, status: 'normal' },
    { id: '7', name: `${t('tools.analyzer.demoItems.wallPainting')} (120 ${sqm})`, category: 'painting', quantity: 120, unitPrice: 18, total: 2160, marketAverage: 14, status: 'very_high' },
    { id: '8', name: `${t('tools.analyzer.demoItems.laminateFlooring')} (80 ${sqm})`, category: 'flooring', quantity: 80, unitPrice: 0, total: 0, marketAverage: 28, status: 'missing' },
    { id: '9', name: t('tools.analyzer.demoItems.radiatorInstall'), category: 'heating', quantity: 8, unitPrice: 0, total: 0, marketAverage: 130, status: 'missing' },
    { id: '10', name: `${t('tools.analyzer.demoItems.baseboardInstall')} (36 ${lm})`, category: 'flooring', quantity: 36, unitPrice: 22, total: 792, marketAverage: 14, status: 'very_high' },
    { id: '11', name: `${t('tools.analyzer.demoItems.drywallCeiling')} (80 ${sqm})`, category: 'ceiling', quantity: 80, unitPrice: 48, total: 3840, marketAverage: 45, status: 'normal' },
    { id: '12', name: `${t('tools.analyzer.demoItems.floorTiling')} (15 ${sqm})`, category: 'tiling', quantity: 15, unitPrice: 65, total: 975, marketAverage: 60, status: 'normal' },
    { id: '13', name: `${t('tools.analyzer.demoItems.wallTiling')} (25 ${sqm})`, category: 'tiling', quantity: 25, unitPrice: 70, total: 1750, marketAverage: 65, status: 'normal' },
    { id: '14', name: `${t('tools.analyzer.demoItems.interiorDoors')} (4 ${pcs})`, category: 'doors_windows', quantity: 4, unitPrice: 200, total: 800, marketAverage: 180, status: 'high' },
  ];

  const aboveMarket = t('tools.analyzer.alerts.aboveMarket');
  const alerts = [
    { type: 'missing_price' as const, message: t('tools.analyzer.alerts.priceNotSpecified'), itemName: t('tools.analyzer.demoItems.radiatorInstall') },
    { type: 'missing_price' as const, message: t('tools.analyzer.alerts.priceNotSpecified'), itemName: t('tools.analyzer.demoItems.laminateFlooring') },
    { type: 'very_high_price' as const, message: `57% ${aboveMarket}`, itemName: t('tools.analyzer.demoItems.baseboardInstall') },
    { type: 'very_high_price' as const, message: `28% ${aboveMarket}`, itemName: t('tools.analyzer.demoItems.wallPainting') },
  ];

  const totalAmount = demoItems.reduce((sum, item) => sum + item.total, 0);
  const potentialSavings = demoItems
    .filter((item) => item.status === 'high' || item.status === 'very_high')
    .reduce((sum, item) => sum + (item.total - item.quantity * item.marketAverage), 0);

  return { items: demoItems, totalAmount, potentialSavings: Math.round(potentialSavings), alerts, confidence: 87 };
};

// File type icon helper
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return FileSpreadsheet;
  if (ext === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '')) return Image;
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

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    text += pageText + '\n';
  }

  return text.trim();
};

// Extract text from file based on type
const extractTextFromFile = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'xlsx' || ext === 'xls') {
    return extractTextFromExcel(file);
  }

  if (ext === 'pdf') {
    return extractTextFromPDF(file);
  }

  // For images, we can't extract text client-side without OCR
  // Return empty string and let the user know
  if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '')) {
    throw new Error('IMAGE_NOT_SUPPORTED');
  }

  throw new Error('Unsupported file type');
};

export default function AnalyzerPage() {
  const { t, locale } = useLanguage();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [estimateText, setEstimateText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<EstimateAnalysisResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze with OpenAI
  const analyzeWithAI = useCallback(async (text: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await aiService.analyzeEstimate(text, locale);
      setAiAnalysis(result);
      setExpandedCategories(new Set());
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setError(err?.response?.data?.message || err?.message || t('tools.analyzer.errors.analysisError'));
      // Fallback to demo
      setAnalysis(generateDemoAnalysis(t));
    } finally {
      setIsAnalyzing(false);
    }
  }, [locale, t]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setUploadedFile(selectedFile);
    setIsAnalyzing(true);
    setError(null);

    try {
      const extractedText = await extractTextFromFile(selectedFile);

      if (!extractedText.trim()) {
        throw new Error('NO_TEXT_EXTRACTED');
      }

      // Use AI to analyze the extracted text
      const result = await aiService.analyzeEstimate(extractedText, locale);
      setAiAnalysis(result);
      setExpandedCategories(new Set());
    } catch (err: any) {
      console.error('File analysis error:', err);

      if (err.message === 'IMAGE_NOT_SUPPORTED') {
        setError(t('tools.analyzer.errors.imageNotSupported'));
      } else if (err.message === 'NO_TEXT_EXTRACTED') {
        setError(t('tools.analyzer.errors.noTextExtracted'));
      } else {
        setError(err?.response?.data?.message || err?.message || t('tools.analyzer.errors.analysisError'));
      }

      // Fallback to demo on error
      setAnalysis(generateDemoAnalysis(t));
    } finally {
      setIsAnalyzing(false);
    }
  }, [t, locale]);

  const handleTextAnalyze = useCallback(() => {
    if (!estimateText.trim()) return;
    analyzeWithAI(estimateText);
  }, [estimateText, analyzeWithAI]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  }, [handleFileSelect]);

  const handleDemo = useCallback(() => {
    // Demo estimate text
    const demoText = locale === 'ka'
      ? `რემონტის ხარჯთაღრიცხვა - 80კვმ ბინა

ელექტრიკა:
- ელექტროწერტილები (56 ცალი) - 60₾ თითო = 3,360₾
- ელექტროფარი - 450₾

სანტექნიკა:
- სანტექნიკის წერტილები (10) - 120₾ თითო = 1,200₾
- აბაზანის მონტაჟი - 300₾

კედლები:
- შელესვა (120 კვმ) - 35₾/კვმ = 4,200₾
- თაბაშირი (120 კვმ) - 18₾/კვმ = 2,160₾

შეღებვა:
- კედლების შეღებვა (120 კვმ) - 18₾/კვმ = 2,160₾

იატაკი:
- ლამინატის დაგება (80 კვმ) - ფასი არ არის მითითებული
- პლინტუსის მონტაჟი (36 მ) - 22₾/მ = 792₾

ჭერი:
- თაბაშირმუყაოს ჭერი (80 კვმ) - 48₾/კვმ = 3,840₾

კაფელი:
- იატაკის კაფელი (15 კვმ) - 65₾/კვმ = 975₾
- კედლის კაფელი (25 კვმ) - 70₾/კვმ = 1,750₾

კარები:
- შიდა კარები (4 ცალი) - 200₾ თითო = 800₾

გათბობა:
- რადიატორების მონტაჟი (8 ცალი) - ფასი არ არის მითითებული`
      : `Renovation Estimate - 80sqm Apartment

Electrical:
- Electrical points (56 pcs) - 60₾ each = 3,360₾
- Electrical panel - 450₾

Plumbing:
- Plumbing points (10) - 120₾ each = 1,200₾
- Bathtub installation - 300₾

Walls:
- Plastering (120 sqm) - 35₾/sqm = 4,200₾
- Putty (120 sqm) - 18₾/sqm = 2,160₾

Painting:
- Wall painting (120 sqm) - 18₾/sqm = 2,160₾

Flooring:
- Laminate installation (80 sqm) - price not specified
- Baseboard installation (36 m) - 22₾/m = 792₾

Ceiling:
- Drywall ceiling (80 sqm) - 48₾/sqm = 3,840₾

Tiling:
- Floor tiles (15 sqm) - 65₾/sqm = 975₾
- Wall tiles (25 sqm) - 70₾/sqm = 1,750₾

Doors:
- Interior doors (4 pcs) - 200₾ each = 800₾

Heating:
- Radiator installation (8 pcs) - price not specified`;

    setEstimateText(demoText);
    analyzeWithAI(demoText);
  }, [locale, analyzeWithAI]);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setAiAnalysis(null);
    setUploadedFile(null);
    setEstimateText('');
    setIsAnalyzing(false);
    setExpandedCategories(new Set());
    setError(null);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getStatusConfig = (status: AnalyzedItem['status']) => {
    switch (status) {
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800/30',
          icon: TrendingDown,
        };
      case 'normal':
        return {
          bg: 'bg-forest-50 dark:bg-forest-900/20',
          text: 'text-forest-600 dark:text-forest-400',
          border: 'border-forest-200 dark:border-forest-800/30',
          icon: Check,
        };
      case 'high':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800/30',
          icon: TrendingUp,
        };
      case 'very_high':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800/30',
          icon: TrendingUp,
        };
      case 'missing':
        return {
          bg: 'bg-neutral-100 dark:bg-neutral-800',
          text: 'text-neutral-500 dark:text-neutral-400',
          border: 'border-neutral-200 dark:border-neutral-700',
          icon: HelpCircle,
        };
      default:
        return {
          bg: 'bg-neutral-100',
          text: 'text-neutral-600',
          border: 'border-neutral-200',
          icon: Minus,
        };
    }
  };

  const getCategoryName = (category: PriceCategory) => {
    return t(`tools.categories.${category}`);
  };

  const formatCurrency = (amount: number | null | undefined) =>
    amount != null ? amount.toLocaleString() + '₾' : '—';

  const itemsByCategory = analysis?.items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<PriceCategory, AnalyzedItem[]>
  );

  const featureItems = [
    { icon: Sparkles, label: t('tools.analyzer.features.free') },
    { icon: BarChart3, label: t('tools.analyzer.features.compare') },
    { icon: Shield, label: t('tools.analyzer.features.missing') },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0a0a0a]">
      {/* Page Header */}
      <PageHeader
        icon={FileSearch}
        iconVariant="accent"
        title={t('tools.analyzer.title')}
        subtitle={t('tools.analyzer.subtitle')}
        backHref="/tools"
        backLabel={t('tools.back')}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {!analysis && !aiAnalysis && !isAnalyzing ? (
            <>
              {/* Mode Tabs */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    inputMode === 'text'
                      ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/25'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-terracotta-300'
                  }`}
                >
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.analyzer.pasteText')}
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    inputMode === 'upload'
                      ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/25'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-terracotta-300'
                  }`}
                >
                  <Upload className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.analyzer.uploadFile')}
                </button>
              </div>

              {inputMode === 'text' ? (
                /* Text Input Mode */
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('tools.analyzer.pasteEstimate')}
                    </label>
                    <textarea
                      value={estimateText}
                      onChange={(e) => setEstimateText(e.target.value)}
                      placeholder={t('tools.analyzer.textPlaceholder')}
                      rows={10}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 focus:border-terracotta-500 transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={handleTextAnalyze}
                    disabled={!estimateText.trim()}
                    className="w-full px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white disabled:text-neutral-500 font-semibold rounded-xl shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                    {t('tools.analyzer.analyzeButton')}
                  </button>
                </div>
              ) : (
                /* Upload Mode */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center
                    transition-all duration-200 bg-white dark:bg-neutral-900
                    ${
                      isDragOver
                        ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/20 scale-[1.01]'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-terracotta-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png,.heic"
                    onChange={handleInputChange}
                    className="hidden"
                  />

                  <div className="mb-5">
                    <div
                      className={`
                      mx-auto w-16 h-16 rounded-2xl flex items-center justify-center
                      bg-gradient-to-br from-terracotta-100 to-terracotta-200 dark:from-terracotta-900/40 dark:to-terracotta-800/30
                      transition-transform duration-200
                      ${isDragOver ? 'scale-110' : ''}
                    `}
                    >
                      <Upload className="w-7 h-7 text-terracotta-600 dark:text-terracotta-400" strokeWidth={1.5} />
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    {t('tools.analyzer.uploadTitle')}
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-1">{t('tools.analyzer.uploadSubtitle')}</p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-5">
                    {t('tools.analyzer.supportedFormats')}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-neutral-400">{t('tools.analyzer.orTakePhoto')}</span>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Camera className="w-5 h-5 text-neutral-600 dark:text-neutral-400" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {featureItems.map(({ icon: Icon, label }, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2.5 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-terracotta-300 dark:hover:border-terracotta-700/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-terracotta-50 dark:bg-terracotta-900/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-terracotta-500" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs text-center text-neutral-600 dark:text-neutral-400 font-medium">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Demo Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleDemo}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 transition-all"
                >
                  {t('tools.analyzer.tryDemo')}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </button>
              </div>
            </>
          ) : isAnalyzing ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-terracotta-200 dark:border-terracotta-900/50" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-terracotta-500 animate-spin" />
                <div className="absolute inset-3 rounded-full bg-terracotta-50 dark:bg-terracotta-900/20 flex items-center justify-center">
                  <FileSearch className="w-8 h-8 text-terracotta-500 animate-pulse" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                {t('tools.analyzer.analyzing')}
              </p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-terracotta-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              {uploadedFile && (
                <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {(() => {
                    const FileIcon = getFileIcon(uploadedFile.name);
                    return <FileIcon className="w-5 h-5 text-terracotta-500" strokeWidth={1.5} />;
                  })()}
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{uploadedFile.name}</span>
                </div>
              )}
            </div>
          ) : aiAnalysis ? (
            /* AI Analysis Results */
            <div className="space-y-4">
              {/* Overall Assessment Badge */}
              <div className={`
                p-4 rounded-2xl border flex items-center gap-4
                ${aiAnalysis.overallAssessment === 'fair'
                  ? 'bg-forest-50 dark:bg-forest-900/20 border-forest-200 dark:border-forest-800/30'
                  : aiAnalysis.overallAssessment === 'cheap'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
                  : aiAnalysis.overallAssessment === 'expensive'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
                }
              `}>
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${aiAnalysis.overallAssessment === 'fair'
                    ? 'bg-forest-100 dark:bg-forest-900/40'
                    : aiAnalysis.overallAssessment === 'cheap'
                    ? 'bg-blue-100 dark:bg-blue-900/40'
                    : aiAnalysis.overallAssessment === 'expensive'
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : 'bg-amber-100 dark:bg-amber-900/40'
                  }
                `}>
                  {aiAnalysis.overallAssessment === 'fair' ? (
                    <Check className="w-6 h-6 text-forest-600 dark:text-forest-400" />
                  ) : aiAnalysis.overallAssessment === 'cheap' ? (
                    <TrendingDown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : aiAnalysis.overallAssessment === 'expensive' ? (
                    <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${
                    aiAnalysis.overallAssessment === 'fair'
                      ? 'text-forest-700 dark:text-forest-300'
                      : aiAnalysis.overallAssessment === 'cheap'
                      ? 'text-blue-700 dark:text-blue-300'
                      : aiAnalysis.overallAssessment === 'expensive'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {t(`tools.analyzer.assessment.${aiAnalysis.overallAssessment}`)}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {aiAnalysis.summary}
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                    {t('tools.analyzer.results.totalAmount')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tabular-nums">
                    {formatCurrency(aiAnalysis.totalEstimated)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {t('tools.analyzer.marketAvg')}: {formatCurrency(aiAnalysis.totalMarketAverage)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-forest-50 to-forest-100 dark:from-forest-900/30 dark:to-forest-800/20 rounded-2xl p-5 border border-forest-200 dark:border-forest-800/30">
                  <div className="flex items-center gap-2 text-sm text-forest-600 dark:text-forest-400 mb-2">
                    <TrendingDown className="w-4 h-4" strokeWidth={1.5} />
                    {t('tools.analyzer.results.potentialSavings')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-forest-700 dark:text-forest-300 tabular-nums">
                    ~{formatCurrency(Math.abs(aiAnalysis.savings))}
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              {aiAnalysis.redFlags.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-800/30">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
                    {t('tools.analyzer.results.redFlags')} ({aiAnalysis.redFlags.length})
                  </h3>
                  <div className="space-y-2">
                    {aiAnalysis.redFlags.map((flag, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/60 dark:bg-neutral-900/40 rounded-xl"
                      >
                        <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{flag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {t('tools.analyzer.results.lineItems')}
                  </h3>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {aiAnalysis.lineItems.map((item, index) => {
                    const priceDiff = item.marketPrice > 0
                      ? Math.round(((item.estimatedPrice - item.marketPrice) / item.marketPrice) * 100)
                      : null;

                    return (
                      <div key={index} className="px-4 py-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {item.item}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                            {item.marketPrice > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="text-neutral-400">{t('tools.analyzer.marketAvg')}:</span>
                                <span>{formatCurrency(item.marketPrice)}</span>
                              </span>
                            )}
                            {item.note && (
                              <span className="text-neutral-400 italic">{item.note}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {priceDiff !== null && priceDiff !== 0 && (
                            <span className={`text-xs font-medium ${priceDiff > 0 ? 'text-red-500' : 'text-forest-500'}`}>
                              {priceDiff > 0 ? '+' : ''}{priceDiff}%
                            </span>
                          )}
                          <span className="font-semibold text-neutral-900 dark:text-white tabular-nums text-sm min-w-[70px] text-right">
                            {formatCurrency(item.estimatedPrice)}
                          </span>
                          <span
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5
                              ${item.assessment === 'fair'
                                ? 'bg-forest-50 dark:bg-forest-900/20 text-forest-600 dark:text-forest-400'
                                : item.assessment === 'low'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              }
                            `}
                          >
                            {item.assessment === 'fair' ? (
                              <Check className="w-3.5 h-3.5" strokeWidth={2} />
                            ) : item.assessment === 'low' ? (
                              <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                            )}
                            {t(`tools.analyzer.status.${item.assessment === 'fair' ? 'normal' : item.assessment}`)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              {aiAnalysis.recommendations.length > 0 && (
                <div className="bg-forest-50 dark:bg-forest-900/20 rounded-2xl p-5 border border-forest-200 dark:border-forest-800/30">
                  <h3 className="font-semibold text-forest-800 dark:text-forest-300 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                    {t('tools.analyzer.results.recommendations')}
                  </h3>
                  <ul className="space-y-2">
                    {aiAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                        <Check className="w-4 h-4 text-forest-500 flex-shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetAnalysis}
                  className="flex-1 px-6 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.analyzer.analyzeAnother')}
                </button>
                <button className="flex-1 px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.analyzer.downloadPdf')}
                </button>
              </div>
            </div>
          ) : analysis ? (
            /* Demo Results (fallback) */
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                    {t('tools.analyzer.results.totalAmount')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tabular-nums">
                    {formatCurrency(analysis.totalAmount)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-forest-50 to-forest-100 dark:from-forest-900/30 dark:to-forest-800/20 rounded-2xl p-5 border border-forest-200 dark:border-forest-800/30">
                  <div className="flex items-center gap-2 text-sm text-forest-600 dark:text-forest-400 mb-2">
                    <TrendingDown className="w-4 h-4" strokeWidth={1.5} />
                    {t('tools.analyzer.results.potentialSavings')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-forest-700 dark:text-forest-300 tabular-nums">
                    ~{formatCurrency(analysis.potentialSavings)}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {analysis.alerts.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/30">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
                    {t('tools.analyzer.results.alerts')} ({analysis.alerts.length})
                  </h3>
                  <div className="space-y-3">
                    {analysis.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/60 dark:bg-neutral-900/40 rounded-xl"
                      >
                        <div
                          className={`
                          mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
                          ${
                            alert.type === 'missing_price'
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                          }
                        `}
                        >
                          {alert.type === 'missing_price' ? (
                            <X className="w-3.5 h-3.5" strokeWidth={2} />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                          )}
                        </div>
                        <div className="text-sm text-neutral-700 dark:text-neutral-300">
                          <span className="font-semibold">{alert.itemName}</span>
                          <span className="text-neutral-500 dark:text-neutral-400"> — {alert.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items by Category */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {t('tools.analyzer.results.byCategory')}
                  </h3>
                </div>

                {itemsByCategory &&
                  Object.entries(itemsByCategory).map(([category, items]) => {
                    const categoryTotal = items.reduce((sum, item) => sum + item.total, 0);
                    const isExpanded = expandedCategories.has(category);
                    const CategoryIcon = categoryIconMap[category as PriceCategory];
                    const hasIssues = items.some((item) => item.status === 'high' || item.status === 'very_high' || item.status === 'missing');

                    return (
                      <div key={category} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <CategoryIcon className="w-4.5 h-4.5 text-neutral-600 dark:text-neutral-400" strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                              <span className="font-medium text-neutral-900 dark:text-white">
                                {getCategoryName(category as PriceCategory)}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-neutral-400">
                                  {items.length} {t('tools.analyzer.items')}
                                </span>
                                {hasIssues && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                              {formatCurrency(categoryTotal)}
                            </span>
                            <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Items */}
                        {isExpanded && (
                          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
                            {items.map((item) => {
                              const config = getStatusConfig(item.status);
                              const StatusIcon = config.icon;
                              const priceDiff = item.unitPrice > 0 && item.marketAverage > 0
                                ? Math.round(((item.unitPrice - item.marketAverage) / item.marketAverage) * 100)
                                : null;

                              return (
                                <div key={item.id} className="px-4 py-4 flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                      {item.name}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                      {item.unitPrice > 0 && (
                                        <span>
                                          {item.quantity} × {item.unitPrice}₾
                                        </span>
                                      )}
                                      {item.marketAverage > 0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="text-neutral-400">{t('tools.analyzer.marketAvg')}:</span>
                                          <span>{item.marketAverage}₾</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {priceDiff !== null && priceDiff !== 0 && (
                                      <span className={`text-xs font-medium ${priceDiff > 0 ? 'text-red-500' : 'text-forest-500'}`}>
                                        {priceDiff > 0 ? '+' : ''}{priceDiff}%
                                      </span>
                                    )}
                                    <span className="font-semibold text-neutral-900 dark:text-white tabular-nums text-sm min-w-[70px] text-right">
                                      {item.total > 0 ? formatCurrency(item.total) : '—'}
                                    </span>
                                    <span
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${config.bg} ${config.text}`}
                                    >
                                      <StatusIcon className="w-3.5 h-3.5" strokeWidth={2} />
                                      {t(`tools.analyzer.status.${item.status}`)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Confidence Score */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-terracotta-500" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t('tools.analyzer.results.confidence')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-terracotta-600 dark:text-terracotta-400">
                    {analysis.confidence}%
                  </span>
                </div>
                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-terracotta-400 to-terracotta-500 rounded-full transition-all duration-1000"
                    style={{ width: `${analysis.confidence}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetAnalysis}
                  className="flex-1 px-6 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.analyzer.analyzeAnother')}
                </button>
                <button className="flex-1 px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.analyzer.downloadPdf')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
