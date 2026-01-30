'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { type PriceCategory } from '@/data/priceDatabase';
import { aiService, CompareEstimatesResult } from '@/services/ai';
import * as XLSX from 'xlsx';
import {
  Scale,
  Plus,
  X,
  Upload,
  Trophy,
  Star,
  ChevronRight,
  Download,
  RefreshCw,
  Lightbulb,
  Check,
  Crown,
  Award,
  FileText,
  FileSpreadsheet,
  Image,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

// UI Components
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';

// Tools Components
import { categoryIconMap } from '@/components/tools/prices/categoryIcons';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc';
type ViewMode = 'table' | 'cards';

interface ContractorEstimate {
  id: string;
  name: string;
  rating?: number;
  categories: Record<PriceCategory, number>;
  total: number;
}

// Demo data
const generateDemoEstimates = (): ContractorEstimate[] => [
  {
    id: '1',
    name: 'Contractor A',
    rating: 4.2,
    categories: {
      demolition: 1200, electrical: 14000, plumbing: 3500, heating: 5200, walls: 25000,
      flooring: 11500, ceiling: 6800, painting: 4800, tiling: 6500, doors_windows: 4200,
    },
    total: 82700,
  },
  {
    id: '2',
    name: 'Contractor B',
    rating: 4.7,
    categories: {
      demolition: 1100, electrical: 12500, plumbing: 4200, heating: 4800, walls: 22000,
      flooring: 9800, ceiling: 7200, painting: 4200, tiling: 5800, doors_windows: 3800,
    },
    total: 75400,
  },
  {
    id: '3',
    name: 'Contractor C',
    rating: 3.9,
    categories: {
      demolition: 1400, electrical: 16200, plumbing: 3800, heating: 5800, walls: 28000,
      flooring: 13000, ceiling: 6500, painting: 5200, tiling: 7200, doors_windows: 4500,
    },
    total: 91600,
  },
];

const allCategories: PriceCategory[] = [
  'demolition', 'electrical', 'plumbing', 'heating', 'walls',
  'flooring', 'ceiling', 'painting', 'tiling', 'doors_windows',
];

const contractorColors = [
  { bg: 'bg-terracotta-500', light: 'bg-terracotta-100 dark:bg-terracotta-900/30', text: 'text-terracotta-600 dark:text-terracotta-400' },
  { bg: 'bg-forest-500', light: 'bg-forest-100 dark:bg-forest-900/30', text: 'text-forest-600 dark:text-forest-400' },
  { bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
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

// Extract text from file based on type
const extractTextFromFile = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    return extractTextFromExcel(file);
  }
  if (ext === 'pdf') {
    return extractTextFromPDF(file);
  }
  throw new Error('Unsupported file type');
};

export default function ComparePage() {
  const { t, locale } = useLanguage();

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [estimates, setEstimates] = useState<ContractorEstimate[] | null>(null);
  const [aiComparison, setAiComparison] = useState<CompareEstimatesResult | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showPercentages, setShowPercentages] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)].slice(0, 5));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)].slice(0, 5));
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCompare = useCallback(async () => {
    if (uploadedFiles.length < 2) return;
    setIsComparing(true);
    setComparisonError(null);

    try {
      // Extract text from all files
      const estimatesData = await Promise.all(
        uploadedFiles.map(async (file, index) => {
          try {
            const content = await extractTextFromFile(file);
            return {
              name: file.name.replace(/\.[^/.]+$/, '') || `Contractor ${index + 1}`,
              content,
            };
          } catch {
            return {
              name: file.name.replace(/\.[^/.]+$/, '') || `Contractor ${index + 1}`,
              content: `File: ${file.name} (could not extract text)`,
            };
          }
        })
      );

      // Use AI to compare
      const result = await aiService.compareEstimates(estimatesData, locale);
      setAiComparison(result);

      // Also set demo estimates for visual chart (fallback display)
      setEstimates(generateDemoEstimates().slice(0, uploadedFiles.length));
    } catch (err: any) {
      console.error('Compare error:', err);
      setComparisonError(err?.response?.data?.message || err?.message || t('tools.compare.compareError'));
      // Fallback to demo
      setEstimates(generateDemoEstimates().slice(0, uploadedFiles.length));
    } finally {
      setIsComparing(false);
    }
  }, [uploadedFiles, locale, t]);

  const handleDemo = useCallback(async () => {
    setIsComparing(true);
    setComparisonError(null);

    try {
      // Demo estimates text
      const demoEstimates = [
        {
          name: 'Contractor A',
          content: `Renovation Estimate - Contractor A
Demolition: 1,200₾
Electrical work (56 points): 14,000₾
Plumbing (10 points): 3,500₾
Heating system: 5,200₾
Wall plastering (120 sqm): 25,000₾
Flooring (80 sqm): 11,500₾
Ceiling work: 6,800₾
Painting: 4,800₾
Tiling (40 sqm): 6,500₾
Doors and windows: 4,200₾
Total: 82,700₾`,
        },
        {
          name: 'Contractor B',
          content: `Renovation Estimate - Contractor B
Demolition: 1,100₾
Electrical (56 points): 12,500₾
Plumbing work: 4,200₾
Heating: 4,800₾
Walls (plastering + putty): 22,000₾
Floor installation: 9,800₾
Ceiling: 7,200₾
Painting work: 4,200₾
Tile work: 5,800₾
Doors/windows: 3,800₾
Total: 75,400₾`,
        },
        {
          name: 'Contractor C',
          content: `Estimate from Contractor C
Demolition work: 1,400₾
Electrical installation: 16,200₾
Plumbing: 3,800₾
Heating system installation: 5,800₾
Wall finishing: 28,000₾
Flooring: 13,000₾
Ceiling installation: 6,500₾
Paint work: 5,200₾
Tiling: 7,200₾
Doors and windows installation: 4,500₾
Grand Total: 91,600₾`,
        },
      ];

      const result = await aiService.compareEstimates(demoEstimates, locale);
      setAiComparison(result);
      setEstimates(generateDemoEstimates());
    } catch (err: any) {
      console.error('Demo compare error:', err);
      setComparisonError(err?.response?.data?.message || err?.message || t('tools.compare.compareError'));
      setEstimates(generateDemoEstimates());
    } finally {
      setIsComparing(false);
    }
  }, [locale, t]);

  const resetComparison = useCallback(() => {
    setUploadedFiles([]);
    setEstimates(null);
    setAiComparison(null);
    setComparisonError(null);
    setIsComparing(false);
  }, []);

  const getCategoryName = (category: PriceCategory) => {
    return t(`tools.categories.${category}`);
  };

  const formatCurrency = (amount: number) => amount.toLocaleString() + '₾';

  const findCategoryWinner = (category: PriceCategory) => {
    if (!estimates) return null;
    let minPrice = Infinity;
    let winnerId = '';
    estimates.forEach((est) => {
      if (est.categories[category] < minPrice) {
        minPrice = est.categories[category];
        winnerId = est.id;
      }
    });
    return winnerId;
  };

  const totalWinner = estimates?.reduce((winner, est) =>
    est.total < (winner?.total ?? Infinity) ? est : winner
  );

  const bestValueWinner = estimates?.reduce((winner, est) => {
    const currentScore = (est.rating ?? 0) / est.total;
    const winnerScore = (winner?.rating ?? 0) / (winner?.total ?? 1);
    return currentScore > winnerScore ? est : winner;
  });

  const maxTotal = estimates ? Math.max(...estimates.map((e) => e.total)) : 0;
  const minTotal = estimates ? Math.min(...estimates.map((e) => e.total)) : 0;
  const savingsVsMax = totalWinner ? maxTotal - totalWinner.total : 0;

  // Sorted estimates based on current sort option
  const sortedEstimates = useMemo(() => {
    if (!estimates) return null;
    const sorted = [...estimates];
    switch (sortOption) {
      case 'price-asc':
        return sorted.sort((a, b) => a.total - b.total);
      case 'price-desc':
        return sorted.sort((a, b) => b.total - a.total);
      case 'rating-desc':
        return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:
        return sorted;
    }
  }, [estimates, sortOption]);

  // Calculate percentage difference from lowest price
  const getPercentageDiff = (amount: number, minAmount: number) => {
    if (minAmount === 0) return 0;
    return Math.round(((amount - minAmount) / minAmount) * 100);
  };

  // Get category min for percentage calculations
  const getCategoryMin = (category: PriceCategory) => {
    if (!estimates) return 0;
    return Math.min(...estimates.map((est) => est.categories[category]));
  };

  // Toggle category expansion for mobile view
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

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0a0a0a]">
      {/* Page Header */}
      <PageHeader
        icon={Scale}
        iconVariant="success"
        title={t('tools.compare.title')}
        subtitle={t('tools.compare.subtitle')}
        backHref="/tools"
        backLabel={t('tools.back')}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {!estimates && !isComparing ? (
            <>
              {/* Upload Section */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-900/30 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-forest-600 dark:text-forest-400" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {t('tools.compare.uploadEstimates')}
                  </h2>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6 ml-13">
                  {t('tools.compare.uploadSubtitle')}
                </p>

                {/* Uploaded Files */}
                <div className="space-y-3 mb-6">
                  {uploadedFiles.map((file, index) => {
                    const FileIcon = getFileIcon(file.name);
                    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl group hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${contractorColors[index].light} flex items-center justify-center relative`}>
                            <FileIcon className={`w-6 h-6 ${contractorColors[index].text}`} strokeWidth={1.5} />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md ${contractorColors[index].bg} flex items-center justify-center text-white text-[10px] font-bold`}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-none">{file.name}</div>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <span className={`px-1.5 py-0.5 rounded ${contractorColors[index].light} ${contractorColors[index].text} font-medium`}>
                                {ext}
                              </span>
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <X className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add More Button */}
                  {uploadedFiles.length < 5 && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all
                        ${isDragOver
                          ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/20 scale-[1.02]'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-forest-400 hover:bg-forest-50/50 dark:hover:bg-forest-900/10'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center justify-center gap-3 text-neutral-500 dark:text-neutral-400">
                        <div className={`w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center transition-transform ${isDragOver ? 'scale-110' : ''}`}>
                          <Plus className="w-7 h-7" strokeWidth={1.5} />
                        </div>
                        <span className="font-medium">{t('tools.compare.addEstimate')}</span>
                        <span className="text-sm text-neutral-400">{t('tools.compare.dragDropHint')}</span>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png"
                    onChange={handleFileAdd}
                    className="hidden"
                    multiple
                  />
                </div>

                {/* Upload Count Pills */}
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div
                      key={num}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        num <= uploadedFiles.length
                          ? 'bg-forest-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {num <= uploadedFiles.length ? <Check className="w-4 h-4" strokeWidth={2} /> : num}
                    </div>
                  ))}
                  <span className="text-sm text-neutral-500 ml-2">
                    {uploadedFiles.length}/5 {t('tools.compare.estimatesUploaded')}
                  </span>
                </div>

                {/* Compare Button */}
                <button
                  onClick={handleCompare}
                  disabled={uploadedFiles.length < 2}
                  className={`
                    w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2
                    ${uploadedFiles.length >= 2
                      ? 'bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    }
                  `}
                >
                  <Scale className="w-5 h-5" strokeWidth={1.5} />
                  {t('tools.compare.compare')}
                </button>
              </div>

              {/* Demo Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleDemo}
                  className="group px-8 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                >
                  <span className="flex items-center gap-2">
                    {t('tools.compare.tryDemo')}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                  </span>
                </button>
              </div>
            </>
          ) : isComparing ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-terracotta-200 dark:border-terracotta-900/50" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-terracotta-500 animate-spin" />
                <div className="absolute inset-3 rounded-full bg-terracotta-50 dark:bg-terracotta-900/20 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-terracotta-500 animate-pulse" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                {t('tools.compare.comparing')}
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
            </div>
          ) : estimates ? (
            /* Results */
            <div className="space-y-5">
              {/* Winner Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Best Price */}
                <div className="bg-gradient-to-br from-forest-500 to-forest-600 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-forest-500/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="absolute top-3 right-3">
                    <Trophy className="w-12 h-12 text-white/20" strokeWidth={1.5} />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-sm text-white/90 mb-2">
                      <Crown className="w-4 h-4" strokeWidth={1.5} />
                      {t('tools.compare.bestPrice')}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{totalWinner?.name}</div>
                    <div className="text-4xl font-bold text-white tabular-nums">{formatCurrency(totalWinner?.total ?? 0)}</div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg inline-flex items-center gap-2 text-sm text-white">
                        <TrendingDown className="w-4 h-4" strokeWidth={1.5} />
                        <span>{t('tools.compare.savings')}:</span>
                        <span className="font-bold">{formatCurrency(savingsVsMax)}</span>
                      </div>
                      {savingsVsMax > 0 && (
                        <span className="text-white/80 text-sm">
                          ({Math.round((savingsVsMax / maxTotal) * 100)}% {t('tools.compare.less') || 'less'})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Best Value */}
                <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-terracotta-500/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="absolute top-3 right-3">
                    <Award className="w-12 h-12 text-white/20" strokeWidth={1.5} />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-sm text-white/90 mb-2">
                      <Star className="w-4 h-4" strokeWidth={1.5} />
                      {t('tools.compare.bestValue')}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{bestValueWinner?.name}</div>
                    <div className="text-4xl font-bold text-white tabular-nums">{formatCurrency(bestValueWinner?.total ?? 0)}</div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg inline-flex items-center gap-1 text-sm text-white">
                        <Star className="w-4 h-4 fill-current" strokeWidth={1.5} />
                        <span className="font-bold">{bestValueWinner?.rating}</span>
                        <span>{t('tools.compare.rating')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= Math.floor(bestValueWinner?.rating ?? 0)
                                ? 'text-amber-300 fill-amber-300'
                                : 'text-white/30'
                            }`}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Price Comparison Bar Chart */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {t('tools.compare.priceOverview') || 'Price Overview'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPercentages(!showPercentages)}
                    className={`p-2 rounded-lg transition-colors ${
                      showPercentages
                        ? 'bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {showPercentages ? <Eye className="w-4 h-4" strokeWidth={1.5} /> : <EyeOff className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
                <div className="space-y-4">
                  {sortedEstimates?.map((est, idx) => {
                    const originalIdx = estimates?.findIndex((e) => e.id === est.id) ?? idx;
                    const barWidth = maxTotal > 0 ? (est.total / maxTotal) * 100 : 0;
                    const percentDiff = getPercentageDiff(est.total, minTotal);
                    const isWinner = est.id === totalWinner?.id;

                    return (
                      <div key={est.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${contractorColors[originalIdx].bg} flex items-center justify-center text-white text-sm font-bold`}>
                              {originalIdx + 1}
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-white">{est.name}</span>
                            {isWinner && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 text-xs font-semibold rounded-full">
                                <Trophy className="w-3 h-3" strokeWidth={2} />
                                {t('tools.compare.lowest') || 'Lowest'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {showPercentages && percentDiff > 0 && (
                              <span className="text-sm text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                                +{percentDiff}%
                              </span>
                            )}
                            {showPercentages && percentDiff === 0 && (
                              <span className="text-sm text-forest-500 dark:text-forest-400 font-medium flex items-center gap-1">
                                <Minus className="w-3.5 h-3.5" strokeWidth={2} />
                                {t('tools.compare.baseline') || 'Baseline'}
                              </span>
                            )}
                            <span className="font-bold text-neutral-900 dark:text-white tabular-nums min-w-[100px] text-right">
                              {formatCurrency(est.total)}
                            </span>
                          </div>
                        </div>
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isWinner
                                ? 'bg-gradient-to-r from-forest-400 to-forest-500'
                                : `bg-gradient-to-r ${contractorColors[originalIdx].bg.replace('bg-', 'from-')}/70 ${contractorColors[originalIdx].bg.replace('bg-', 'to-')}`
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                    {t('tools.compare.sortBy') || 'Sort by'}:
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                  >
                    <option value="default">{t('tools.compare.sortDefault') || 'Default'}</option>
                    <option value="price-asc">{t('tools.compare.sortPriceLow') || 'Price: Low to High'}</option>
                    <option value="price-desc">{t('tools.compare.sortPriceHigh') || 'Price: High to Low'}</option>
                    <option value="rating-desc">{t('tools.compare.sortRating') || 'Rating: Best First'}</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2.5 rounded-lg transition-colors ${
                      viewMode === 'table'
                        ? 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2.5 rounded-lg transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <PieChart className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Comparison Table - Table View */}
              {viewMode === 'table' && sortedEstimates && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                          <th className="px-5 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50">
                            {t('tools.compare.category')}
                          </th>
                          {sortedEstimates.map((est) => {
                            const originalIdx = estimates?.findIndex((e) => e.id === est.id) ?? 0;
                            return (
                              <th key={est.id} className="px-5 py-4 text-center bg-neutral-50 dark:bg-neutral-800/50">
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`w-10 h-10 rounded-xl ${contractorColors[originalIdx].bg} flex items-center justify-center`}>
                                    <span className="text-white font-bold text-sm">{originalIdx + 1}</span>
                                  </div>
                                  <div className="font-semibold text-neutral-900 dark:text-white">{est.name}</div>
                                  {est.rating && (
                                    <div className="flex items-center gap-1 text-amber-500">
                                      <Star className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                                      <span className="text-sm font-medium">{est.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {allCategories.map((category) => {
                          const winnerId = findCategoryWinner(category);
                          const hasValues = sortedEstimates.some((est) => est.categories[category] > 0);
                          if (!hasValues) return null;

                          const CategoryIcon = categoryIconMap[category];
                          const categoryMin = getCategoryMin(category);

                          return (
                            <tr key={category} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <CategoryIcon className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
                                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {getCategoryName(category)}
                                  </span>
                                </div>
                              </td>
                              {sortedEstimates.map((est) => {
                                const isWinner = est.id === winnerId;
                                const percentDiff = getPercentageDiff(est.categories[category], categoryMin);
                                return (
                                  <td key={est.id} className="px-5 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`
                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm tabular-nums
                                        ${isWinner
                                          ? 'bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300'
                                          : 'text-neutral-700 dark:text-neutral-300'
                                        }
                                      `}>
                                        {formatCurrency(est.categories[category])}
                                        {isWinner && <Check className="w-4 h-4" strokeWidth={2} />}
                                      </span>
                                      {showPercentages && percentDiff > 0 && (
                                        <span className="text-xs text-red-500/70 dark:text-red-400/70">
                                          +{percentDiff}%
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}

                        {/* Total Row */}
                        <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                          <td className="px-5 py-5">
                            <span className="text-lg font-bold text-neutral-900 dark:text-white">
                              {t('tools.compare.total')}
                            </span>
                          </td>
                          {sortedEstimates.map((est) => {
                            const isWinner = est.id === totalWinner?.id;
                            const percentDiff = getPercentageDiff(est.total, minTotal);
                            return (
                              <td key={est.id} className="px-5 py-5 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <span className={`text-xl font-bold tabular-nums ${isWinner ? 'text-forest-600 dark:text-forest-400' : 'text-neutral-900 dark:text-white'}`}>
                                    {formatCurrency(est.total)}
                                  </span>
                                  {showPercentages && percentDiff > 0 && (
                                    <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                                      +{percentDiff}% vs lowest
                                    </span>
                                  )}
                                  {isWinner && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-forest-500 text-white text-xs font-bold rounded-full">
                                      <Trophy className="w-3 h-3" strokeWidth={2} />
                                      {t('tools.compare.winner')}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Comparison Cards - Card View */}
              {viewMode === 'cards' && sortedEstimates && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedEstimates.map((est) => {
                    const originalIdx = estimates?.findIndex((e) => e.id === est.id) ?? 0;
                    const isWinner = est.id === totalWinner?.id;
                    const isBestValue = est.id === bestValueWinner?.id;
                    const percentDiff = getPercentageDiff(est.total, minTotal);

                    return (
                      <div
                        key={est.id}
                        className={`
                          bg-white dark:bg-neutral-900 rounded-2xl border-2 overflow-hidden transition-all
                          ${isWinner
                            ? 'border-forest-500 shadow-lg shadow-forest-500/10'
                            : isBestValue
                            ? 'border-terracotta-500 shadow-lg shadow-terracotta-500/10'
                            : 'border-neutral-200 dark:border-neutral-800'
                          }
                        `}
                      >
                        {/* Card Header */}
                        <div className={`p-4 ${contractorColors[originalIdx].light}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${contractorColors[originalIdx].bg} flex items-center justify-center text-white text-lg font-bold`}>
                                {originalIdx + 1}
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-white">{est.name}</div>
                                {est.rating && (
                                  <div className="flex items-center gap-1 text-amber-500">
                                    <Star className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                                    <span className="text-sm font-medium">{est.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {isWinner && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-forest-500 text-white text-xs font-bold rounded-full">
                                  <Trophy className="w-3 h-3" strokeWidth={2} />
                                  {t('tools.compare.bestPrice')}
                                </span>
                              )}
                              {isBestValue && !isWinner && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-terracotta-500 text-white text-xs font-bold rounded-full">
                                  <Award className="w-3 h-3" strokeWidth={2} />
                                  {t('tools.compare.bestValue')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                          <div className="text-center">
                            <div className={`text-3xl font-bold tabular-nums ${isWinner ? 'text-forest-600 dark:text-forest-400' : 'text-neutral-900 dark:text-white'}`}>
                              {formatCurrency(est.total)}
                            </div>
                            {showPercentages && (
                              <div className={`text-sm mt-1 ${
                                percentDiff === 0
                                  ? 'text-forest-500'
                                  : 'text-red-500'
                              }`}>
                                {percentDiff === 0 ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                                    {t('tools.compare.lowestPrice') || 'Lowest price'}
                                  </span>
                                ) : (
                                  <span>+{percentDiff}% {t('tools.compare.moreThanLowest') || 'more than lowest'}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                          {allCategories.map((category) => {
                            const CategoryIcon = categoryIconMap[category];
                            const value = est.categories[category];
                            if (value === 0) return null;
                            const categoryWinnerId = findCategoryWinner(category);
                            const isCategoryWinner = est.id === categoryWinnerId;

                            return (
                              <div
                                key={category}
                                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                                  isCategoryWinner ? 'bg-forest-50 dark:bg-forest-900/20' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {getCategoryName(category)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-sm font-semibold tabular-nums ${
                                    isCategoryWinner ? 'text-forest-600 dark:text-forest-400' : 'text-neutral-900 dark:text-white'
                                  }`}>
                                    {formatCurrency(value)}
                                  </span>
                                  {isCategoryWinner && <Check className="w-3.5 h-3.5 text-forest-500" strokeWidth={2} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AI Analysis Section */}
              {aiComparison && (
                <div className="bg-gradient-to-br from-forest-50 to-forest-100 dark:from-forest-900/20 dark:to-forest-800/10 rounded-2xl border border-forest-200 dark:border-forest-800/30 overflow-hidden">
                  <div className="p-4 border-b border-forest-200 dark:border-forest-800/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-forest-200 dark:bg-forest-900/40 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-forest-600 dark:text-forest-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold text-forest-800 dark:text-forest-200">
                      {t('tools.compare.aiAnalysis')}
                    </h3>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* AI Summary */}
                    <div className="p-4 bg-white/60 dark:bg-neutral-900/40 rounded-xl">
                      <p className="text-sm text-forest-700 dark:text-forest-300 leading-relaxed">
                        {aiComparison.summary}
                      </p>
                    </div>

                    {/* Detailed Comparison */}
                    <div className="space-y-4">
                      {aiComparison.comparison.map((item, index) => (
                        <div key={index} className="p-4 bg-white/60 dark:bg-neutral-900/40 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${contractorColors[index]?.bg || 'bg-neutral-500'} flex items-center justify-center text-white font-bold`}>
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-neutral-900 dark:text-white">{item.name}</h4>
                                <p className="text-sm text-forest-600 dark:text-forest-400 font-medium">
                                  {formatCurrency(item.totalPrice)}
                                </p>
                              </div>
                            </div>
                            {aiComparison.winner.index === index && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-forest-500 text-white text-xs font-bold rounded-full">
                                <Trophy className="w-3 h-3" strokeWidth={2} />
                                {t('tools.compare.aiWinner')}
                              </span>
                            )}
                          </div>

                          {/* Pros & Cons */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            {item.pros.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-forest-600 dark:text-forest-400 flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" strokeWidth={2} />
                                  {t('tools.compare.pros')}
                                </p>
                                <ul className="space-y-1">
                                  {item.pros.slice(0, 3).map((pro, i) => (
                                    <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                                      <span className="text-forest-500 mt-0.5">+</span>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.cons.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <ThumbsDown className="w-3 h-3" strokeWidth={2} />
                                  {t('tools.compare.cons')}
                                </p>
                                <ul className="space-y-1">
                                  {item.cons.slice(0, 3).map((con, i) => (
                                    <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                                      <span className="text-red-500 mt-0.5">−</span>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {comparisonError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{comparisonError}</p>
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="bg-terracotta-50 dark:bg-terracotta-900/20 rounded-2xl p-6 border border-terracotta-200/50 dark:border-terracotta-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-terracotta-500 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-terracotta-800 dark:text-terracotta-300 mb-2 text-lg">
                      {t('tools.compare.recommendation')}
                    </h3>
                    <p className="text-terracotta-700 dark:text-terracotta-400 leading-relaxed">
                      {aiComparison ? (
                        <>
                          <strong>{aiComparison.winner.name}</strong> — {aiComparison.recommendation}
                        </>
                      ) : (
                        <>
                          <strong>{bestValueWinner?.name}</strong> {t('tools.compare.recommendationText')} <Star className="w-4 h-4 inline text-amber-500 fill-current" />{bestValueWinner?.rating} - {formatCurrency(bestValueWinner?.total ?? 0)}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetComparison}
                  className="flex-1 px-6 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.compare.startOver')}
                </button>
                <button className="flex-1 px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  {t('tools.compare.downloadComparison')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
