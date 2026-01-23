'use client';

import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { type PriceCategory } from '@/data/priceDatabase';
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

export default function AnalyzerPage() {
  const { t, locale } = useLanguage();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setUploadedFile(selectedFile);
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysis(generateDemoAnalysis(t));
      setIsAnalyzing(false);
      setExpandedCategories(new Set(['electrical', 'walls']));
    }, 2000);
  }, [t]);

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
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysis(generateDemoAnalysis(t));
      setIsAnalyzing(false);
      setExpandedCategories(new Set(['electrical', 'walls']));
    }, 1500);
  }, [t]);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setUploadedFile(null);
    setIsAnalyzing(false);
    setExpandedCategories(new Set());
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

  const formatCurrency = (amount: number) => amount.toLocaleString() + '₾';

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
          {!analysis && !isAnalyzing ? (
            <>
              {/* Upload Zone */}
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
          ) : analysis ? (
            /* Results */
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
