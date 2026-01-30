import { api } from '@/lib/api';

// Types for AI API responses
export interface EstimateAnalysisResult {
  summary: string;
  overallAssessment: 'fair' | 'expensive' | 'cheap' | 'mixed';
  totalEstimated: number;
  totalMarketAverage: number;
  savings: number;
  lineItems: {
    item: string;
    estimatedPrice: number;
    marketPrice: number;
    assessment: 'fair' | 'high' | 'low';
    note?: string;
  }[];
  recommendations: string[];
  redFlags: string[];
}

export interface RenovationCalculatorResult {
  totalEstimate: number;
  breakdown: {
    category: string;
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    description: string;
  }[];
  timeline: string;
  tips: string[];
}

export interface CompareEstimatesResult {
  winner: {
    index: number;
    name: string;
    reason: string;
  };
  comparison: {
    name: string;
    totalPrice: number;
    priceScore: number;
    valueScore: number;
    pros: string[];
    cons: string[];
  }[];
  summary: string;
  recommendation: string;
}

export interface PriceCheckResult {
  item: string;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  unit: string;
  factors: string[];
  tips: string[];
}

export type RenovationType = 'cosmetic' | 'standard' | 'full' | 'luxury';
export type PropertyType = 'apartment' | 'house';

export interface CalculateRenovationParams {
  area: number;
  rooms: number;
  bathrooms: number;
  renovationType: RenovationType;
  includeKitchen: boolean;
  includeFurniture: boolean;
  propertyType: PropertyType;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * AI Service - Frontend API client for AI tools
 */
export const aiService = {
  /**
   * Analyze a contractor's estimate using AI
   */
  async analyzeEstimate(
    estimateText: string,
    locale: string = 'en'
  ): Promise<EstimateAnalysisResult> {
    const response = await api.post('/ai/analyze-estimate', {
      estimateText,
      locale,
    });
    return response.data;
  },

  /**
   * Calculate renovation budget based on parameters
   */
  async calculateRenovation(
    params: CalculateRenovationParams,
    locale: string = 'en'
  ): Promise<RenovationCalculatorResult> {
    const response = await api.post('/ai/calculate-renovation', {
      ...params,
      locale,
    });
    return response.data;
  },

  /**
   * Compare multiple contractor estimates
   */
  async compareEstimates(
    estimates: { name: string; content: string }[],
    locale: string = 'en'
  ): Promise<CompareEstimatesResult> {
    const response = await api.post('/ai/compare-estimates', {
      estimates,
      locale,
    });
    return response.data;
  },

  /**
   * Get market price information for a renovation item
   */
  async getPriceInfo(
    item: string,
    locale: string = 'en'
  ): Promise<PriceCheckResult> {
    const response = await api.post('/ai/price-info', {
      item,
      locale,
    });
    return response.data;
  },

  /**
   * Chat with AI renovation assistant
   */
  async chat(
    messages: ChatMessage[],
    locale: string = 'en'
  ): Promise<string> {
    const response = await api.post('/ai/chat', {
      messages,
      locale,
    });
    return response.data.response;
  },
};

export default aiService;
