'use client';

import AddressPicker from '@/components/common/AddressPicker';
import DatePicker from '@/components/common/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  AlertCircle,
  Building2,
  Camera,
  Castle,
  Check,
  ChevronDown,
  HelpCircle,
  Home,
  Layers,
  Link as LinkIcon,
  MapPin,
  Palette,
  Plus,
  Ruler,
  Send,
  Sparkles,
  Trash2,
  Warehouse,
  X
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Category {
  _id: string;
  key: string;
  name: string;
  nameKa: string;
  description?: string;
  descriptionKa?: string;
  icon?: string;
}

interface Reference {
  type: 'link' | 'image' | 'pinterest' | 'instagram';
  url: string;
  title?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', labelKa: 'ბინა', icon: Home },
  { value: 'house', label: 'House', labelKa: 'სახლი', icon: Castle },
  { value: 'office', label: 'Office', labelKa: 'ოფისი', icon: Building2 },
  { value: 'building', label: 'Building', labelKa: 'შენობა', icon: Warehouse },
  { value: 'other', label: 'Other', labelKa: 'სხვა', icon: HelpCircle },
];

const DESIGN_STYLES = [
  { value: 'Modern', label: 'Modern', labelKa: 'მოდერნი' },
  { value: 'Minimalist', label: 'Minimalist', labelKa: 'მინიმალისტური' },
  { value: 'Classic', label: 'Classic', labelKa: 'კლასიკური' },
  { value: 'Scandinavian', label: 'Scandinavian', labelKa: 'სკანდინავიური' },
  { value: 'Industrial', label: 'Industrial', labelKa: 'ინდუსტრიული' },
  { value: 'Bohemian', label: 'Bohemian', labelKa: 'ბოჰემური' },
  { value: 'Mid-Century Modern', label: 'Mid-Century Modern', labelKa: 'შუა საუკუნის მოდერნი' },
  { value: 'Contemporary', label: 'Contemporary', labelKa: 'თანამედროვე' },
  { value: 'Traditional', label: 'Traditional', labelKa: 'ტრადიციული' },
  { value: 'Rustic', label: 'Rustic', labelKa: 'რუსტიკული' },
];

const ROOM_OPTIONS = [
  { value: 'Living Room', label: 'Living Room', labelKa: 'მისაღები' },
  { value: 'Bedroom', label: 'Bedroom', labelKa: 'საძინებელი' },
  { value: 'Kitchen', label: 'Kitchen', labelKa: 'სამზარეულო' },
  { value: 'Bathroom', label: 'Bathroom', labelKa: 'სააბაზანო' },
  { value: 'Dining Room', label: 'Dining Room', labelKa: 'სასადილო' },
  { value: 'Home Office', label: 'Home Office', labelKa: 'სამუშაო ოთახი' },
  { value: 'Kids Room', label: 'Kids Room', labelKa: 'საბავშვო' },
  { value: 'Hallway', label: 'Hallway', labelKa: 'დერეფანი' },
  { value: 'Balcony', label: 'Balcony', labelKa: 'აივანი' },
  { value: 'Entire Space', label: 'Entire Space', labelKa: 'მთლიანი სივრცე' },
];

const WORK_TYPES = [
  { value: 'Demolition', label: 'Demolition', labelKa: 'დემონტაჟი' },
  { value: 'Wall Construction', label: 'Wall Construction', labelKa: 'კედლების აშენება' },
  { value: 'Electrical', label: 'Electrical', labelKa: 'ელექტროობა' },
  { value: 'Plumbing', label: 'Plumbing', labelKa: 'სანტექნიკა' },
  { value: 'Flooring', label: 'Flooring', labelKa: 'იატაკი' },
  { value: 'Painting', label: 'Painting', labelKa: 'შეღებვა' },
  { value: 'Tiling', label: 'Tiling', labelKa: 'კაფელი' },
  { value: 'Ceiling', label: 'Ceiling', labelKa: 'ჭერი' },
  { value: 'Windows & Doors', label: 'Windows & Doors', labelKa: 'ფანჯრები და კარები' },
  { value: 'HVAC', label: 'HVAC', labelKa: 'კონდიცირება/გათბობა' },
];

const PROJECT_PHASES = [
  { value: 'concept', label: 'Concept Design', labelKa: 'კონცეფციის დიზაინი', description: 'Initial ideas and sketches', descriptionKa: 'პირველადი იდეები და ესკიზები' },
  { value: 'schematic', label: 'Schematic Design', labelKa: 'სქემატური დიზაინი', description: 'Preliminary drawings and layouts', descriptionKa: 'წინასწარი ნახაზები და განლაგება' },
  { value: 'detailed', label: 'Detailed Design', labelKa: 'დეტალური დიზაინი', description: 'Full technical drawings', descriptionKa: 'სრული ტექნიკური ნახაზები' },
  { value: 'construction', label: 'Construction Documents', labelKa: 'სამშენებლო დოკუმენტაცია', description: 'Ready for building', descriptionKa: 'მზად მშენებლობისთვის' },
];

const ZONING_TYPES = [
  { value: 'residential', label: 'Residential', labelKa: 'საცხოვრებელი' },
  { value: 'commercial', label: 'Commercial', labelKa: 'კომერციული' },
  { value: 'mixed', label: 'Mixed Use', labelKa: 'შერეული' },
  { value: 'industrial', label: 'Industrial', labelKa: 'სამრეწველო' },
];

const CATEGORY_SPECIALTIES: Record<string, { value: string; label: string; labelKa: string }[]> = {
  'interior-design': [
    { value: 'interior', label: 'Interior Design', labelKa: 'ინტერიერი' },
    { value: 'exterior', label: 'Exterior Design', labelKa: 'ექსტერიერი' },
    { value: 'landscape-design', label: 'Landscape Design', labelKa: 'ლანდშაფტის დიზაინი' },
    { value: '3d-visualization', label: '3D Visualization', labelKa: '3D ვიზუალიზაცია' },
    { value: 'furniture-design', label: 'Furniture Design', labelKa: 'ავეჯის დიზაინი' },
  ],
  'architecture': [
    { value: 'residential-arch', label: 'Residential', labelKa: 'საცხოვრებელი' },
    { value: 'commercial-arch', label: 'Commercial', labelKa: 'კომერციული' },
    { value: 'industrial-arch', label: 'Industrial', labelKa: 'სამრეწველო' },
    { value: 'reconstruction', label: 'Reconstruction', labelKa: 'რეკონსტრუქცია' },
    { value: 'project-documentation', label: 'Project Documentation', labelKa: 'საპროექტო დოკუმენტაცია' },
  ],
  'craftsmen': [
    { value: 'electrical', label: 'Electrician', labelKa: 'ელექტრიკოსი' },
    { value: 'plumbing', label: 'Plumber', labelKa: 'სანტექნიკოსი' },
    { value: 'painting', label: 'Painter', labelKa: 'მხატვარი' },
    { value: 'tiling', label: 'Tiler', labelKa: 'მოკაფელე' },
    { value: 'flooring', label: 'Flooring', labelKa: 'იატაკის სპეციალისტი' },
    { value: 'plastering', label: 'Plasterer', labelKa: 'მლესავი' },
    { value: 'carpentry', label: 'Carpenter', labelKa: 'დურგალი' },
    { value: 'welding', label: 'Welder', labelKa: 'შემდუღებელი' },
    { value: 'hvac', label: 'HVAC', labelKa: 'გათბობა/გაგრილება' },
    { value: 'roofing', label: 'Roofer', labelKa: 'გადამხურავი' },
  ],
  'home-care': [
    { value: 'cleaning', label: 'Cleaning', labelKa: 'დალაგება' },
    { value: 'moving', label: 'Moving', labelKa: 'გადაზიდვა' },
    { value: 'gardening', label: 'Gardening', labelKa: 'მებაღეობა' },
    { value: 'appliance-repair', label: 'Appliance Repair', labelKa: 'ტექნიკის შეკეთება' },
    { value: 'pest-control', label: 'Pest Control', labelKa: 'დეზინსექცია' },
    { value: 'window-cleaning', label: 'Window Cleaning', labelKa: 'ფანჯრების წმენდა' },
  ],
};

const BUDGET_TYPES = [
  { value: 'fixed', label: 'Fixed Budget', labelKa: 'ფიქსირებული ბიუჯეტი', description: 'I have a specific amount', descriptionKa: 'კონკრეტული თანხა მაქვს' },
  { value: 'range', label: 'Budget Range', labelKa: 'ბიუჯეტის დიაპაზონი', description: 'Flexible within a range', descriptionKa: 'მოქნილი ფასის დიაპაზონი' },
  { value: 'per_sqm', label: 'Per Square Meter', labelKa: 'კვადრატულ მეტრზე', description: 'Based on area size', descriptionKa: 'ფართობის მიხედვით' },
  { value: 'negotiable', label: 'Negotiable', labelKa: 'შეთანხმებით', description: 'Open to discussion', descriptionKa: 'ფასზე შეთანხმება' },
];

// Category visual configurations
const CATEGORY_CONFIG: Record<string, {
  gradient: string;
  bgGradient: string;
  iconBg: string;
  accentColor: string;
  tagline: { en: string; ka: string };
}> = {
  'interior-design': {
    gradient: 'from-rose-500 via-fuchsia-500 to-violet-600',
    bgGradient: 'from-rose-50 via-fuchsia-50 to-violet-50 dark:from-rose-950/30 dark:via-fuchsia-950/30 dark:to-violet-950/30',
    iconBg: 'bg-gradient-to-br from-rose-100 to-fuchsia-100 dark:from-rose-900/40 dark:to-fuchsia-900/40',
    accentColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    tagline: { en: 'Transform spaces into experiences', ka: 'სივრცე გამოცდილებად' },
  },
  'architecture': {
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    bgGradient: 'from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-indigo-950/30',
    iconBg: 'bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40',
    accentColor: 'text-blue-600 dark:text-blue-400',
    tagline: { en: 'Blueprint your vision', ka: 'შენი ხედვის პროექტი' },
  },
  'craftsmen': {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    bgGradient: 'from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30',
    iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40',
    accentColor: 'text-orange-600 dark:text-orange-400',
    tagline: { en: 'Skilled hands, lasting quality', ka: 'ოსტატობა და ხარისხი' },
  },
  'home-care': {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30',
    iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40',
    accentColor: 'text-teal-600 dark:text-teal-400',
    tagline: { en: 'Care for your sanctuary', ka: 'შენი თავშესაფრის მოვლა' },
  },
};

// Category Illustrations
const CategoryIllustration = ({ categoryKey, isSelected }: { categoryKey: string; isSelected: boolean }) => {
  const baseClass = `w-full h-full transition-all duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`;

  switch (categoryKey) {
    case 'interior-design':
      return (
        <svg className={baseClass} viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="int-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <rect x="15" y="45" width="50" height="18" rx="4" fill="url(#int-grad)" opacity="0.9"/>
          <rect x="12" y="40" width="14" height="26" rx="3" fill="url(#int-grad)" opacity="0.7"/>
          <rect x="54" y="40" width="14" height="26" rx="3" fill="url(#int-grad)" opacity="0.7"/>
          <ellipse cx="30" cy="50" rx="8" ry="5" fill="white" opacity="0.4"/>
          <ellipse cx="50" cy="50" rx="8" ry="5" fill="white" opacity="0.4"/>
          <rect x="30" y="15" width="20" height="16" rx="2" stroke="url(#int-grad)" strokeWidth="2" fill="white" opacity="0.9"/>
          <circle cx="36" cy="22" r="3" fill="url(#int-grad)" opacity="0.6"/>
          <circle cx="46" cy="25" r="2" fill="url(#int-grad)" opacity="0.4"/>
        </svg>
      );
    case 'architecture':
      return (
        <svg className={baseClass} viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <path d="M15 65 L15 30 L40 12 L65 30 L65 65 Z" fill="url(#arch-grad)" opacity="0.2" stroke="url(#arch-grad)" strokeWidth="2"/>
          <rect x="22" y="35" width="10" height="14" rx="1" fill="url(#arch-grad)" opacity="0.6"/>
          <rect x="48" y="35" width="10" height="14" rx="1" fill="url(#arch-grad)" opacity="0.6"/>
          <rect x="34" y="45" width="12" height="20" rx="1" fill="url(#arch-grad)" opacity="0.8"/>
          <path d="M40 12 L40 5" stroke="url(#arch-grad)" strokeWidth="2"/>
          <circle cx="40" cy="5" r="2" fill="url(#arch-grad)"/>
        </svg>
      );
    case 'craftsmen':
      return (
        <svg className={baseClass} viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="craft-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <rect x="35" y="15" width="10" height="35" rx="2" fill="url(#craft-grad)" opacity="0.9"/>
          <rect x="30" y="50" width="20" height="8" rx="2" fill="url(#craft-grad)" opacity="0.7"/>
          <path d="M20 40 L30 30 L32 32 L22 42 Z" fill="url(#craft-grad)" opacity="0.8"/>
          <circle cx="18" cy="42" r="4" fill="url(#craft-grad)" opacity="0.6"/>
          <path d="M50 30 L60 40 L58 42 L48 32 Z" fill="url(#craft-grad)" opacity="0.8"/>
          <rect x="58" y="38" width="8" height="4" rx="1" fill="url(#craft-grad)" opacity="0.6" transform="rotate(45 62 40)"/>
        </svg>
      );
    case 'home-care':
      return (
        <svg className={baseClass} viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="care-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <path d="M40 15 L60 30 L60 60 L20 60 L20 30 Z" fill="url(#care-grad)" opacity="0.2" stroke="url(#care-grad)" strokeWidth="2"/>
          <path d="M15 32 L40 12 L65 32" stroke="url(#care-grad)" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <rect x="34" y="42" width="12" height="18" rx="1" fill="url(#care-grad)" opacity="0.6"/>
          <circle cx="40" cy="50" r="2" fill="white" opacity="0.8"/>
          <path d="M25 40 Q28 35 31 40 Q34 45 28 48 Q22 45 25 40" fill="#22c55e" opacity="0.7"/>
          <path d="M49 38 Q52 33 55 38 Q58 43 52 46 Q46 43 49 38" fill="#22c55e" opacity="0.7"/>
        </svg>
      );
    default:
      return null;
  }
};

export default function PostJobPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale: language } = useLanguage();
  const { isClientMode } = useViewMode();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadDoneRef = useRef(false);

  const editJobId = searchParams.get('edit');
  const isEditMode = !!editJobId;

  // Section refs for scroll tracking
  const sectionRefs = {
    category: useRef<HTMLDivElement>(null),
    basics: useRef<HTMLDivElement>(null),
    details: useRef<HTMLDivElement>(null),
    budget: useRef<HTMLDivElement>(null),
    media: useRef<HTMLDivElement>(null),
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activeSection, setActiveSection] = useState('category');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['category']));

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    propertyType: '',
    propertyTypeOther: '',
    areaSize: '',
    sizeUnit: 'sqm',
    roomCount: '',
    cadastralId: '',
    landArea: '',
    floorCount: '',
    projectPhase: '',
    permitRequired: false,
    currentCondition: '',
    zoningType: '',
    designStyles: [] as string[],
    roomsToDesign: [] as string[],
    furnitureIncluded: false,
    visualizationNeeded: false,
    preferredColors: [] as string[],
    workTypes: [] as string[],
    materialsProvided: false,
    materialsNote: '',
    occupiedDuringWork: false,
    urgencyLevel: '',
    serviceFrequency: '',
    preferredTime: '',
    accessInstructions: '',
    hasPets: false,
    budgetType: 'negotiable',
    budgetAmount: '',
    budgetMin: '',
    budgetMax: '',
    pricePerUnit: '',
    deadline: '',
    references: [] as Reference[],
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [newReferenceUrl, setNewReferenceUrl] = useState('');
  const [customWorkType, setCustomWorkType] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch job data for edit mode
  useEffect(() => {
    if (!editJobId || !isAuthenticated) return;

    const fetchJobData = async () => {
      setIsLoadingJob(true);
      try {
        const response = await api.get(`/jobs/${editJobId}`);
        const job = response.data;

        setFormData(prev => ({
          ...prev,
          category: job.category || '',
          title: job.title || '',
          description: job.description || '',
          location: job.location || '',
          propertyType: job.propertyType || '',
          propertyTypeOther: job.propertyTypeOther || '',
          areaSize: job.areaSize?.toString() || '',
          sizeUnit: job.sizeUnit || 'sqm',
          roomCount: job.roomCount?.toString() || '',
          cadastralId: job.cadastralId || '',
          landArea: job.landArea || '',
          floorCount: job.floorCount?.toString() || '',
          projectPhase: job.projectPhase || '',
          permitRequired: job.permitRequired || false,
          currentCondition: job.currentCondition || '',
          zoningType: job.zoningType || '',
          designStyles: job.designStyles || job.designStyle ? [job.designStyle] : [],
          roomsToDesign: job.roomsToDesign || [],
          furnitureIncluded: job.furnitureIncluded || false,
          visualizationNeeded: job.visualizationNeeded || false,
          preferredColors: job.preferredColors || [],
          workTypes: job.workTypes || [],
          materialsProvided: job.materialsProvided || false,
          materialsNote: job.materialsNote || '',
          occupiedDuringWork: job.occupiedDuringWork || false,
          urgencyLevel: job.urgencyLevel || '',
          serviceFrequency: job.serviceFrequency || '',
          preferredTime: job.preferredTime || '',
          accessInstructions: job.accessInstructions || '',
          hasPets: job.hasPets || false,
          budgetType: job.budgetType || 'negotiable',
          budgetAmount: job.budgetAmount?.toString() || '',
          budgetMin: job.budgetMin?.toString() || '',
          budgetMax: job.budgetMax?.toString() || '',
          pricePerUnit: job.pricePerUnit?.toString() || '',
          deadline: job.deadline ? job.deadline.split('T')[0] : '',
          references: job.references || [],
        }));

        if (job.skills && job.skills.length > 0 && job.category) {
          const categorySpecialties = CATEGORY_SPECIALTIES[job.category] || [];
          const predefinedValues = categorySpecialties.map(s => s.value);
          const matchedSpecialties: string[] = [];
          const customSpecs: string[] = [];

          job.skills.forEach((skill: string) => {
            if (predefinedValues.includes(skill)) {
              matchedSpecialties.push(skill);
            } else {
              const isDesignStyle = DESIGN_STYLES.some(ds => ds.value === skill);
              const isRoom = ROOM_OPTIONS.some(r => r.value === skill);
              if (!isDesignStyle && !isRoom) {
                customSpecs.push(skill);
              }
            }
          });

          setSelectedSpecialties(matchedSpecialties);
          setCustomSpecialties(customSpecs.slice(0, 5));
        }

        if (job.media && job.media.length > 0) {
          setExistingMedia(job.media);
        } else if (job.images && job.images.length > 0) {
          setExistingMedia(job.images.map((url: string) => ({ type: 'image' as const, url })));
        }

        // Expand all sections in edit mode
        setExpandedSections(new Set(['category', 'basics', 'details', 'budget', 'media']));
        initialLoadDoneRef.current = true;

      } catch (err: any) {
        console.error('Failed to fetch job:', err);
        setError('Failed to load job data for editing');
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobData();
  }, [editJobId, isAuthenticated]);

  // Auth check
  useEffect(() => {
    const isClient = user?.role === 'client';
    const isProInClientMode = user?.role === 'pro' && isClientMode;
    if (!authLoading && (!isAuthenticated || (!isClient && !isProInClientMode))) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, isClientMode]);

  // Auto-expand sections based on category selection
  useEffect(() => {
    if (formData.category) {
      setExpandedSections(prev => new Set([...prev, 'basics']));
    }
  }, [formData.category]);

  const selectedCategory = categories.find(c => c.key === formData.category);
  const isArchitecture = formData.category === 'architecture';
  const isInteriorDesign = formData.category === 'interior-design';
  const isCraftsmen = formData.category === 'craftsmen';
  const isHomeCare = formData.category === 'home-care';
  const categoryConfig = formData.category ? CATEGORY_CONFIG[formData.category] : null;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setFormData(prev => {
      const arr = prev[field as keyof typeof prev] as string[];
      if (field === 'roomsToDesign') {
        if (item === 'Entire Space') {
          if (arr.includes('Entire Space')) {
            return { ...prev, [field]: [] };
          }
          return { ...prev, [field]: ['Entire Space'] };
        } else {
          const filtered = arr.filter(i => i !== 'Entire Space');
          if (filtered.includes(item)) {
            return { ...prev, [field]: filtered.filter(i => i !== item) };
          }
          return { ...prev, [field]: [...filtered, item] };
        }
      }
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: MediaFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const addReference = () => {
    if (!newReferenceUrl.trim()) return;
    let type: Reference['type'] = 'link';
    if (newReferenceUrl.includes('pinterest')) type = 'pinterest';
    else if (newReferenceUrl.includes('instagram')) type = 'instagram';
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, { type, url: newReferenceUrl.trim() }]
    }));
    setNewReferenceUrl('');
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const addCustomWorkType = () => {
    const trimmed = customWorkType.trim();
    if (!trimmed || formData.workTypes.includes(trimmed)) {
      setCustomWorkType('');
      return;
    }
    setFormData(prev => ({
      ...prev,
      workTypes: [...prev.workTypes, trimmed]
    }));
    setCustomWorkType('');
  };

  const toggleSpecialty = (value: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(value)
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const addCustomSpecialty = () => {
    const trimmed = customSpecialtyInput.trim();
    if (!trimmed || customSpecialties.includes(trimmed) || selectedSpecialties.includes(trimmed) || customSpecialties.length >= 5) {
      setCustomSpecialtyInput('');
      return;
    }
    setCustomSpecialties(prev => [...prev, trimmed]);
    setCustomSpecialtyInput('');
  };

  const removeCustomSpecialty = (specialty: string) => {
    setCustomSpecialties(prev => prev.filter(s => s !== specialty));
  };

  useEffect(() => {
    if (isEditMode && !initialLoadDoneRef.current) return;
    if (isEditMode && initialLoadDoneRef.current) {
      setSelectedSpecialties([]);
      setCustomSpecialties([]);
      setCustomSpecialtyInput('');
    } else if (!isEditMode) {
      setSelectedSpecialties([]);
      setCustomSpecialties([]);
      setCustomSpecialtyInput('');
    }
  }, [formData.category, isEditMode]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const scrollToSection = (section: string) => {
    const ref = sectionRefs[section as keyof typeof sectionRefs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!expandedSections.has(section)) {
        setExpandedSections(prev => new Set([...prev, section]));
      }
    }
  };

  const canSubmit = (): boolean => {
    const hasCategory = !!formData.category;
    const hasSpecialty = selectedSpecialties.length > 0 || customSpecialties.length > 0;
    const hasTitle = !!formData.title;
    const hasDescription = !!formData.description;
    const hasPropertyType = !!formData.propertyType && (formData.propertyType !== 'other' || !!formData.propertyTypeOther);

    let budgetValid = true;
    if (formData.budgetType === 'fixed') budgetValid = !!formData.budgetAmount;
    if (formData.budgetType === 'range') budgetValid = !!formData.budgetMin && !!formData.budgetMax;
    if (formData.budgetType === 'per_sqm') budgetValid = !!formData.pricePerUnit;

    return hasCategory && hasSpecialty && hasTitle && hasDescription && hasPropertyType && budgetValid;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const uploadedMedia: { type: 'image' | 'video'; url: string }[] = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];
        setUploadProgress(Math.round((i / mediaFiles.length) * 50));
        const formDataUpload = new FormData();
        formDataUpload.append('file', mediaFile.file);
        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedMedia.push({
          type: mediaFile.type,
          url: uploadRes.data.url || uploadRes.data.filename
        });
      }

      setUploadProgress(75);

      const jobData: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        propertyType: formData.propertyType,
        budgetType: formData.budgetType,
      };

      if (formData.propertyType === 'other' && formData.propertyTypeOther) {
        jobData.propertyTypeOther = formData.propertyTypeOther;
      }
      if (formData.location) jobData.location = formData.location;
      if (formData.areaSize) jobData.areaSize = Number(formData.areaSize);
      if (formData.sizeUnit) jobData.sizeUnit = formData.sizeUnit;
      if (formData.roomCount) jobData.roomCount = Number(formData.roomCount);

      if (formData.budgetType === 'fixed' && formData.budgetAmount) {
        jobData.budgetAmount = Number(formData.budgetAmount);
      }
      if (formData.budgetType === 'range') {
        if (formData.budgetMin) jobData.budgetMin = Number(formData.budgetMin);
        if (formData.budgetMax) jobData.budgetMax = Number(formData.budgetMax);
      }
      if (formData.budgetType === 'per_sqm' && formData.pricePerUnit) {
        jobData.pricePerUnit = Number(formData.pricePerUnit);
      }
      if (formData.deadline) jobData.deadline = formData.deadline;

      if (isArchitecture) {
        if (formData.cadastralId) jobData.cadastralId = formData.cadastralId;
        if (formData.landArea) jobData.landArea = formData.landArea;
        if (formData.floorCount) jobData.floorCount = Number(formData.floorCount);
        if (formData.projectPhase) jobData.projectPhase = formData.projectPhase;
        if (formData.permitRequired) jobData.permitRequired = formData.permitRequired;
        if (formData.currentCondition) jobData.currentCondition = formData.currentCondition;
        if (formData.zoningType) jobData.zoningType = formData.zoningType;
      }

      if (isInteriorDesign) {
        const interiorSkills: string[] = [];
        if (formData.designStyles.length) interiorSkills.push(...formData.designStyles);
        if (formData.roomsToDesign.length) interiorSkills.push(...formData.roomsToDesign);
        if (interiorSkills.length) jobData.skills = interiorSkills;
      }

      const allSpecialties = [...selectedSpecialties, ...customSpecialties];
      if (allSpecialties.length > 0) {
        if (!jobData.skills) jobData.skills = [];
        jobData.skills = [...new Set([...jobData.skills, ...allSpecialties])];
      }

      if (formData.workTypes.length) jobData.workTypes = formData.workTypes;
      if (formData.materialsProvided) jobData.materialsProvided = formData.materialsProvided;
      if (formData.materialsNote) jobData.materialsNote = formData.materialsNote;
      if (formData.occupiedDuringWork) jobData.occupiedDuringWork = formData.occupiedDuringWork;

      if (uploadedMedia.length) {
        jobData.images = uploadedMedia.filter(m => m.type === 'image').map(m => m.url);
      } else if (isEditMode && existingMedia.length > 0) {
        jobData.images = existingMedia.filter(m => m.type === 'image').map(m => m.url);
      }

      setUploadProgress(90);

      if (isEditMode && editJobId) {
        await api.put(`/jobs/${editJobId}`, jobData);
      } else {
        await api.post('/jobs', jobData);
      }

      setUploadProgress(100);

      toast.success(
        isEditMode
          ? (language === 'ka' ? 'სამუშაო განახლდა' : 'Job updated')
          : (language === 'ka' ? 'სამუშაო შეიქმნა' : 'Job created'),
        isEditMode
          ? (language === 'ka' ? 'თქვენი სამუშაო წარმატებით განახლდა' : 'Your job has been successfully updated')
          : (language === 'ka' ? 'თქვენი სამუშაო წარმატებით გამოქვეყნდა' : 'Your job has been successfully posted')
      );

      router.push('/my-jobs');
    } catch (err: any) {
      console.error('Failed to save job:', err);
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} job. Please try again.`);
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        language === 'ka' ? `სამუშაოს ${isEditMode ? 'განახლება' : 'შექმნა'} ვერ მოხერხდა` : `Failed to ${isEditMode ? 'update' : 'create'} job`
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (authLoading || isLoadingCategories || isLoadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-[3px] border-neutral-200 dark:border-neutral-700"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-[3px] border-transparent border-t-forest-600 dark:border-t-primary-400 animate-spin"></div>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            {isLoadingJob
              ? (language === 'ka' ? 'სამუშაოს მონაცემები იტვირთება...' : 'Loading job data...')
              : (language === 'ka' ? 'იტვირთება...' : 'Loading...')}
          </p>
        </div>
      </div>
    );
  }

  // Section header component
  const SectionHeader = ({
    id,
    number,
    title,
    subtitle,
    isComplete,
    isRequired = true
  }: {
    id: string;
    number: number;
    title: string;
    subtitle: string;
    isComplete: boolean;
    isRequired?: boolean;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center gap-4 py-5 text-left group"
    >
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-300
        ${isComplete
          ? 'bg-gradient-to-br from-forest-500 to-forest-600 dark:from-primary-500 dark:to-primary-600 text-white shadow-lg shadow-forest-500/25 dark:shadow-primary-500/25'
          : expandedSections.has(id)
            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
        }
      `}>
        {isComplete ? <Check className="w-5 h-5" /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
            {title}
          </h2>
          {!isRequired && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
              {language === 'ka' ? 'არასავალდებულო' : 'Optional'}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
          {subtitle}
        </p>
      </div>
      <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${expandedSections.has(id) ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-[0.03] bg-gradient-to-br ${categoryConfig?.gradient || 'from-forest-500 to-emerald-600'}`} />
        <div className={`absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full blur-3xl opacity-[0.02] bg-gradient-to-tr ${categoryConfig?.gradient || 'from-forest-500 to-emerald-600'}`} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(var(--color-bg-secondary-rgb), 0.8)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/browse')}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              {language === 'ka' ? 'გაუქმება' : 'Cancel'}
            </button>
            <h1 className="text-base font-semibold text-neutral-900 dark:text-white">
              {isEditMode
                ? (language === 'ka' ? 'სამუშაოს რედაქტირება' : 'Edit Job')
                : (language === 'ka' ? 'ახალი სამუშაო' : 'New Job')}
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
            <Sparkles className="w-4 h-4" />
            {language === 'ka' ? 'იპოვე საუკეთესო სპეციალისტი' : 'Find the best professional'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
            {isEditMode
              ? (language === 'ka' ? 'განაახლეთ თქვენი პროექტი' : 'Update Your Project')
              : (language === 'ka' ? 'აღწერეთ თქვენი პროექტი' : 'Describe Your Project')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            {language === 'ka'
              ? 'შეავსეთ დეტალები და მიიღეთ შეთავაზებები სანდო სპეციალისტებისგან'
              : 'Fill in the details and receive proposals from trusted professionals'}
          </p>
        </div>

        {/* Form Sections */}
        <div className="space-y-2">
          {/* Section 1: Category */}
          <div
            ref={sectionRefs.category}
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="px-5">
              <SectionHeader
                id="category"
                number={1}
                title={language === 'ka' ? 'კატეგორია' : 'Category'}
                subtitle={
                  formData.category
                    ? `${selectedCategory?.name || formData.category}${selectedSpecialties.length > 0 ? ` • ${selectedSpecialties.length} ${language === 'ka' ? 'სპეციალობა' : 'specialty'}` : ''}`
                    : (language === 'ka' ? 'აირჩიეთ სერვისის ტიპი' : 'Choose the type of service')
                }
                isComplete={!!formData.category && (selectedSpecialties.length > 0 || customSpecialties.length > 0)}
              />
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${expandedSections.has('category') ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 space-y-6">
                {/* Category Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category, index) => {
                    const config = CATEGORY_CONFIG[category.key];
                    const isSelected = formData.category === category.key;

                    return (
                      <button
                        key={category._id}
                        onClick={() => updateFormData('category', category.key)}
                        className={`
                          group relative p-4 rounded-xl text-left transition-all duration-300
                          ${isSelected
                            ? `bg-gradient-to-br ${config?.bgGradient || 'from-neutral-50 to-neutral-100'} ring-2 ring-offset-2 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-900`
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                          }
                        `}
                        style={!isSelected ? {
                          backgroundColor: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)'
                        } : { border: '1px solid transparent' }}
                      >
                        <div className={`w-14 h-14 mb-3 ${config?.iconBg || 'bg-neutral-100 dark:bg-neutral-800'} rounded-xl flex items-center justify-center`}>
                          <CategoryIllustration categoryKey={category.key} isSelected={isSelected} />
                        </div>
                        <h3 className={`font-semibold mb-0.5 ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {language === 'ka' ? category.nameKa : category.name}
                        </h3>
                        <p className={`text-xs ${isSelected ? config?.accentColor : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {config?.tagline[language === 'ka' ? 'ka' : 'en']}
                        </p>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                            <Check className="w-4 h-4 text-white dark:text-neutral-900" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Specialties */}
                {formData.category && CATEGORY_SPECIALTIES[formData.category] && (
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'სპეციალობა' : 'Specialty'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_SPECIALTIES[formData.category].map((specialty) => (
                        <button
                          key={specialty.value}
                          onClick={() => toggleSpecialty(specialty.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            selectedSpecialties.includes(specialty.value)
                              ? `bg-gradient-to-r ${categoryConfig?.gradient || 'from-forest-500 to-forest-600'} text-white shadow-md`
                              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                          style={!selectedSpecialties.includes(specialty.value) ? {
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                          } : { border: 'none' }}
                        >
                          {language === 'ka' ? specialty.labelKa : specialty.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom specialties */}
                    {customSpecialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customSpecialties.map((specialty) => (
                          <span
                            key={specialty}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${categoryConfig?.gradient || 'from-forest-500 to-forest-600'} text-white`}
                          >
                            {specialty}
                            <button onClick={() => removeCustomSpecialty(specialty)} className="hover:bg-white/20 rounded-full p-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add custom specialty */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSpecialtyInput}
                        onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSpecialty())}
                        placeholder={language === 'ka' ? 'დაამატეთ სპეციალობა...' : 'Add custom specialty...'}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <button
                        onClick={addCustomSpecialty}
                        disabled={!customSpecialtyInput.trim() || customSpecialties.length >= 5}
                        className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {(selectedSpecialties.length === 0 && customSpecialties.length === 0) && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {language === 'ka' ? 'აირჩიეთ მინიმუმ 1 სპეციალობა' : 'Select at least 1 specialty'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Basics */}
          <div
            ref={sectionRefs.basics}
            className={`rounded-2xl overflow-hidden transition-all duration-300 ${!formData.category ? 'opacity-50 pointer-events-none' : ''}`}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="px-5">
              <SectionHeader
                id="basics"
                number={2}
                title={language === 'ka' ? 'ძირითადი ინფორმაცია' : 'Basic Information'}
                subtitle={
                  formData.title
                    ? formData.title
                    : (language === 'ka' ? 'სათაური, აღწერა და მდებარეობა' : 'Title, description and location')
                }
                isComplete={!!formData.title && !!formData.description && !!formData.propertyType}
              />
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${expandedSections.has('basics') ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'პროექტის სათაური' : 'Project Title'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder={language === 'ka' ? "მაგ., თანამედროვე ბინის რემონტი" : "e.g., Modern apartment renovation"}
                    className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'პროექტის აღწერა' : 'Description'} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder={language === 'ka' ? 'დეტალურად აღწერეთ თქვენი პროექტი...' : 'Describe your project in detail...'}
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                {/* Property Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'ქონების ტიპი' : 'Property Type'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PROPERTY_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => {
                            updateFormData('propertyType', type.value);
                            if (type.value !== 'other') updateFormData('propertyTypeOther', '');
                          }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                            formData.propertyType === type.value
                              ? 'ring-2 ring-neutral-900 dark:ring-white bg-neutral-50 dark:bg-neutral-800'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                          style={{
                            backgroundColor: formData.propertyType !== type.value ? 'var(--color-bg-tertiary)' : undefined,
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <Icon className={`w-5 h-5 ${formData.propertyType === type.value ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                          <span className={`text-xs font-medium ${formData.propertyType === type.value ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {language === 'ka' ? type.labelKa : type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {formData.propertyType === 'other' && (
                    <input
                      type="text"
                      value={formData.propertyTypeOther}
                      onChange={(e) => updateFormData('propertyTypeOther', e.target.value)}
                      placeholder={language === 'ka' ? 'მიუთითეთ ქონების ტიპი...' : 'Specify property type...'}
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  )}
                </div>

                {/* Size & Rooms */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <Ruler className="w-4 h-4 inline mr-1.5" />
                      {language === 'ka' ? 'ფართობი (მ²)' : 'Area (m²)'}
                    </label>
                    <input
                      type="number"
                      value={formData.areaSize}
                      onChange={(e) => updateFormData('areaSize', e.target.value)}
                      placeholder="100"
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <Layers className="w-4 h-4 inline mr-1.5" />
                      {language === 'ka' ? 'ოთახები' : 'Rooms'}
                    </label>
                    <input
                      type="number"
                      value={formData.roomCount}
                      onChange={(e) => updateFormData('roomCount', e.target.value)}
                      placeholder="3"
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'სასურველი ვადა' : 'Preferred Deadline'}
                  </label>
                  <DatePicker
                    value={formData.deadline}
                    onChange={(value) => updateFormData('deadline', value)}
                    min={new Date().toISOString().split('T')[0]}
                    locale={language}
                    placeholder={language === 'ka' ? 'აირჩიეთ თარიღი' : 'Select date'}
                  />
                </div>

                {/* Location */}
                <div>
                  <AddressPicker
                    value={formData.location}
                    onChange={(value) => updateFormData('location', value)}
                    locale={language}
                    label={language === 'ka' ? 'მდებარეობა' : 'Location'}
                    required={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Details */}
          <div
            ref={sectionRefs.details}
            className={`rounded-2xl overflow-hidden transition-all duration-300 ${!formData.category ? 'opacity-50 pointer-events-none' : ''}`}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="px-5">
              <SectionHeader
                id="details"
                number={3}
                title={
                  isArchitecture ? (language === 'ka' ? 'არქიტექტურის დეტალები' : 'Architecture Details') :
                  isInteriorDesign ? (language === 'ka' ? 'დიზაინის დეტალები' : 'Design Details') :
                  isCraftsmen ? (language === 'ka' ? 'სამუშაოს დეტალები' : 'Work Details') :
                  isHomeCare ? (language === 'ka' ? 'სერვისის დეტალები' : 'Service Details') :
                  (language === 'ka' ? 'დეტალები' : 'Details')
                }
                subtitle={language === 'ka' ? 'დამატებითი ინფორმაცია პროექტის შესახებ' : 'Additional project information'}
                isComplete={false}
                isRequired={false}
              />
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${expandedSections.has('details') ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 space-y-6">
                {/* Architecture-specific */}
                {isArchitecture && (
                  <>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'პროექტის ფაზა' : 'Project Phase'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {PROJECT_PHASES.map((phase) => (
                          <button
                            key={phase.value}
                            onClick={() => updateFormData('projectPhase', phase.value)}
                            className={`p-4 rounded-xl text-left transition-all duration-200 ${
                              formData.projectPhase === phase.value ? 'ring-2 ring-neutral-900 dark:ring-white' : ''
                            }`}
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            <span className={`block text-sm font-medium ${formData.projectPhase === phase.value ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                              {language === 'ka' ? phase.labelKa : phase.label}
                            </span>
                            <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {language === 'ka' ? phase.descriptionKa : phase.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'ზონირების ტიპი' : 'Zoning Type'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ZONING_TYPES.map((zone) => (
                          <button
                            key={zone.value}
                            onClick={() => updateFormData('zoningType', zone.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              formData.zoningType === zone.value
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            style={formData.zoningType !== zone.value ? {
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                            } : {}}
                          >
                            {language === 'ka' ? zone.labelKa : zone.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {language === 'ka' ? 'საკადასტრო კოდი' : 'Cadastral ID'}
                        </label>
                        <input
                          type="text"
                          value={formData.cadastralId}
                          onChange={(e) => updateFormData('cadastralId', e.target.value)}
                          placeholder="01.12.34.567.890"
                          className="w-full px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {language === 'ka' ? 'სართულები' : 'Floors'}
                        </label>
                        <input
                          type="number"
                          value={formData.floorCount}
                          onChange={(e) => updateFormData('floorCount', e.target.value)}
                          placeholder="2"
                          className="w-full px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Interior Design-specific */}
                {isInteriorDesign && (
                  <>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        <Palette className="w-4 h-4 inline mr-1.5" />
                        {language === 'ka' ? 'დიზაინის სტილი' : 'Design Style'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DESIGN_STYLES.map((style) => (
                          <button
                            key={style.value}
                            onClick={() => toggleArrayItem('designStyles', style.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              formData.designStyles.includes(style.value)
                                ? `bg-gradient-to-r ${categoryConfig?.gradient} text-white`
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            style={!formData.designStyles.includes(style.value) ? {
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                            } : {}}
                          >
                            {language === 'ka' ? style.labelKa : style.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'ოთახები დიზაინისთვის' : 'Rooms to Design'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ROOM_OPTIONS.map((room) => (
                          <button
                            key={room.value}
                            onClick={() => toggleArrayItem('roomsToDesign', room.value)}
                            disabled={room.value !== 'Entire Space' && formData.roomsToDesign.includes('Entire Space')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              formData.roomsToDesign.includes(room.value)
                                ? `bg-gradient-to-r ${categoryConfig?.gradient} text-white`
                                : room.value !== 'Entire Space' && formData.roomsToDesign.includes('Entire Space')
                                ? 'opacity-40 cursor-not-allowed'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            style={!formData.roomsToDesign.includes(room.value) ? {
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                            } : {}}
                          >
                            {language === 'ka' ? room.labelKa : room.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggle options */}
                    <div className="space-y-3">
                      {[
                        { field: 'furnitureIncluded', label: language === 'ka' ? 'ავეჯის შერჩევა' : 'Include Furniture Selection', desc: language === 'ka' ? 'დახმარება ავეჯის შერჩევაში' : 'Help selecting furniture' },
                        { field: 'visualizationNeeded', label: language === 'ka' ? '3D ვიზუალიზაცია' : '3D Visualization', desc: language === 'ka' ? '3D რენდერები' : '3D renders needed' },
                      ].map((toggle) => (
                        <div
                          key={toggle.field}
                          className="p-4 rounded-xl flex items-center justify-between"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{toggle.label}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{toggle.desc}</p>
                          </div>
                          <button
                            onClick={() => updateFormData(toggle.field, !formData[toggle.field as keyof typeof formData])}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              formData[toggle.field as keyof typeof formData] ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${
                                formData[toggle.field as keyof typeof formData] ? 'translate-x-6 bg-white dark:bg-neutral-900' : 'bg-white dark:bg-neutral-400'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* References */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        <LinkIcon className="w-4 h-4 inline mr-1.5" />
                        {language === 'ka' ? 'ინსპირაცია' : 'Inspiration & References'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newReferenceUrl}
                          onChange={(e) => setNewReferenceUrl(e.target.value)}
                          placeholder={language === 'ka' ? "Pinterest, Instagram ბმული..." : "Pinterest, Instagram URL..."}
                          className="flex-1 px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)'
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
                        />
                        <button
                          onClick={addReference}
                          className="px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {formData.references.length > 0 && (
                        <div className="space-y-2">
                          {formData.references.map((ref, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded-xl"
                              style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <LinkIcon className="w-4 h-4 text-neutral-400" />
                              <span className="flex-1 text-sm text-neutral-600 dark:text-neutral-400 truncate">
                                {ref.url}
                              </span>
                              <button onClick={() => removeReference(idx)} className="p-1 text-neutral-400 hover:text-rose-500">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Craftsmen-specific */}
                {isCraftsmen && (
                  <>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'სასწრაფოობა' : 'Urgency Level'}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'flexible', label: language === 'ka' ? 'მოქნილი' : 'Flexible', desc: language === 'ka' ? 'დროში არ ვარ შეზღუდული' : 'No rush' },
                          { value: 'soon', label: language === 'ka' ? 'მალე' : 'Soon', desc: language === 'ka' ? '1-2 კვირაში' : '1-2 weeks' },
                          { value: 'urgent', label: language === 'ka' ? 'სასწრაფო' : 'Urgent', desc: language === 'ka' ? 'დაუყოვნებლივ' : 'ASAP' },
                        ].map((urgency) => (
                          <button
                            key={urgency.value}
                            onClick={() => updateFormData('urgencyLevel', urgency.value)}
                            className={`p-4 rounded-xl text-left transition-all duration-200 ${
                              formData.urgencyLevel === urgency.value ? 'ring-2 ring-neutral-900 dark:ring-white' : ''
                            }`}
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            <span className={`block text-sm font-medium ${formData.urgencyLevel === urgency.value ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                              {urgency.label}
                            </span>
                            <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {urgency.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { field: 'materialsProvided', label: language === 'ka' ? 'მასალებს მე ვუზრუნველყოფ' : 'I will provide materials', desc: language === 'ka' ? 'მაქვს საჭირო მასალები' : 'I have the materials' },
                        { field: 'occupiedDuringWork', label: language === 'ka' ? 'ფართი დაკავებულია' : 'Space is occupied', desc: language === 'ka' ? 'ვცხოვრობ/ვმუშაობ ამ ფართში' : 'I live/work in this space' },
                      ].map((toggle) => (
                        <div
                          key={toggle.field}
                          className="p-4 rounded-xl flex items-center justify-between"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{toggle.label}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{toggle.desc}</p>
                          </div>
                          <button
                            onClick={() => updateFormData(toggle.field, !formData[toggle.field as keyof typeof formData])}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              formData[toggle.field as keyof typeof formData] ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${
                                formData[toggle.field as keyof typeof formData] ? 'translate-x-6 bg-white dark:bg-neutral-900' : 'bg-white dark:bg-neutral-400'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Home Care-specific */}
                {isHomeCare && (
                  <>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'სერვისის სიხშირე' : 'Service Frequency'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'one-time', label: language === 'ka' ? 'ერთჯერადი' : 'One-time', desc: language === 'ka' ? 'ერთჯერადი სერვისი' : 'Single service' },
                          { value: 'weekly', label: language === 'ka' ? 'ყოველკვირეული' : 'Weekly', desc: language === 'ka' ? 'ყოველ კვირა' : 'Every week' },
                          { value: 'monthly', label: language === 'ka' ? 'ყოველთვიური' : 'Monthly', desc: language === 'ka' ? 'თვეში ერთხელ' : 'Once a month' },
                          { value: 'as-needed', label: language === 'ka' ? 'საჭიროებისამებრ' : 'As Needed', desc: language === 'ka' ? 'გამოძახებით' : 'On call' },
                        ].map((freq) => (
                          <button
                            key={freq.value}
                            onClick={() => updateFormData('serviceFrequency', freq.value)}
                            className={`p-4 rounded-xl text-left transition-all duration-200 ${
                              formData.serviceFrequency === freq.value ? 'ring-2 ring-neutral-900 dark:ring-white' : ''
                            }`}
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            <span className={`block text-sm font-medium ${formData.serviceFrequency === freq.value ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                              {freq.label}
                            </span>
                            <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {freq.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'სასურველი დრო' : 'Preferred Time'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'morning', label: language === 'ka' ? 'დილა' : 'Morning' },
                          { value: 'afternoon', label: language === 'ka' ? 'შუადღე' : 'Afternoon' },
                          { value: 'evening', label: language === 'ka' ? 'საღამო' : 'Evening' },
                          { value: 'flexible', label: language === 'ka' ? 'მოქნილი' : 'Flexible' },
                        ].map((time) => (
                          <button
                            key={time.value}
                            onClick={() => updateFormData('preferredTime', time.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              formData.preferredTime === time.value
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            style={formData.preferredTime !== time.value ? {
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                            } : {}}
                          >
                            {time.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {language === 'ka' ? 'შინაური ცხოველები მყავს' : 'I have pets'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {language === 'ka' ? 'სპეციალისტმა იცოდეს' : 'Let the specialist know'}
                        </p>
                      </div>
                      <button
                        onClick={() => updateFormData('hasPets', !formData.hasPets)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                          formData.hasPets ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${
                            formData.hasPets ? 'translate-x-6 bg-white dark:bg-neutral-900' : 'bg-white dark:bg-neutral-400'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* Work Types for Craftsmen/Architecture/Interior */}
                {(isCraftsmen || isArchitecture || isInteriorDesign) && (
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'სამუშაოს ტიპები' : 'Work Types Required'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WORK_TYPES.map((work) => (
                        <button
                          key={work.value}
                          onClick={() => toggleArrayItem('workTypes', work.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            formData.workTypes.includes(work.value)
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                          style={!formData.workTypes.includes(work.value) ? {
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                          } : {}}
                        >
                          {language === 'ka' ? work.labelKa : work.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customWorkType}
                        onChange={(e) => setCustomWorkType(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomWorkType())}
                        placeholder={language === 'ka' ? 'დაამატეთ საკუთარი...' : 'Add custom type...'}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <button
                        onClick={addCustomWorkType}
                        disabled={!customWorkType.trim()}
                        className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Budget */}
          <div
            ref={sectionRefs.budget}
            className={`rounded-2xl overflow-hidden transition-all duration-300 ${!formData.category ? 'opacity-50 pointer-events-none' : ''}`}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="px-5">
              <SectionHeader
                id="budget"
                number={4}
                title={language === 'ka' ? 'ბიუჯეტი' : 'Budget'}
                subtitle={
                  formData.budgetType === 'fixed' && formData.budgetAmount
                    ? `₾${Number(formData.budgetAmount).toLocaleString()}`
                    : formData.budgetType === 'range' && formData.budgetMin && formData.budgetMax
                    ? `₾${Number(formData.budgetMin).toLocaleString()} - ₾${Number(formData.budgetMax).toLocaleString()}`
                    : formData.budgetType === 'negotiable'
                    ? (language === 'ka' ? 'შეთანხმებით' : 'Negotiable')
                    : (language === 'ka' ? 'განსაზღვრეთ ბიუჯეტი' : 'Set your budget')
                }
                isComplete={
                  formData.budgetType === 'negotiable' ||
                  (formData.budgetType === 'fixed' && !!formData.budgetAmount) ||
                  (formData.budgetType === 'range' && !!formData.budgetMin && !!formData.budgetMax) ||
                  (formData.budgetType === 'per_sqm' && !!formData.pricePerUnit)
                }
              />
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${expandedSections.has('budget') ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {BUDGET_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateFormData('budgetType', type.value)}
                      className={`p-4 rounded-xl text-left transition-all duration-200 ${
                        formData.budgetType === type.value ? 'ring-2 ring-neutral-900 dark:ring-white' : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <span className={`block text-sm font-medium ${formData.budgetType === type.value ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {language === 'ka' ? type.labelKa : type.label}
                      </span>
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {language === 'ka' ? type.descriptionKa : type.description}
                      </span>
                    </button>
                  ))}
                </div>

                {formData.budgetType === 'fixed' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'ბიუჯეტის თანხა (₾)' : 'Budget Amount (₾)'}
                    </label>
                    <input
                      type="number"
                      value={formData.budgetAmount}
                      onChange={(e) => updateFormData('budgetAmount', e.target.value)}
                      placeholder="5000"
                      className="w-full px-4 py-3.5 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                )}

                {formData.budgetType === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'მინიმუმი (₾)' : 'Minimum (₾)'}
                      </label>
                      <input
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) => updateFormData('budgetMin', e.target.value)}
                        placeholder="3000"
                        className="w-full px-4 py-3.5 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {language === 'ka' ? 'მაქსიმუმი (₾)' : 'Maximum (₾)'}
                      </label>
                      <input
                        type="number"
                        value={formData.budgetMax}
                        onChange={(e) => updateFormData('budgetMax', e.target.value)}
                        placeholder="8000"
                        className="w-full px-4 py-3.5 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                    </div>
                  </div>
                )}

                {formData.budgetType === 'per_sqm' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'ფასი კვ.მ-ზე (₾)' : 'Price per m² (₾)'}
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => updateFormData('pricePerUnit', e.target.value)}
                      placeholder="50"
                      className="w-full px-4 py-3.5 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    {formData.areaSize && formData.pricePerUnit && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {language === 'ka' ? 'სავარაუდო ჯამი' : 'Estimated total'}: <span className="font-semibold text-neutral-900 dark:text-white">₾{(Number(formData.areaSize) * Number(formData.pricePerUnit)).toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                )}

                {formData.budgetType === 'negotiable' && (
                  <div
                    className="p-6 rounded-xl text-center"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {language === 'ka'
                        ? 'შეძლებთ ბიუჯეტზე მოლაპარაკებას პროფესიონალებთან'
                        : 'You can discuss the budget with professionals who submit proposals'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Media */}
          <div
            ref={sectionRefs.media}
            className={`rounded-2xl overflow-hidden transition-all duration-300 ${!formData.category ? 'opacity-50 pointer-events-none' : ''}`}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="px-5">
              <SectionHeader
                id="media"
                number={5}
                title={language === 'ka' ? 'ფოტოები' : 'Photos'}
                subtitle={
                  mediaFiles.length > 0
                    ? `${mediaFiles.length} ${language === 'ka' ? 'ფაილი დამატებულია' : 'files added'}`
                    : existingMedia.length > 0
                    ? `${existingMedia.length} ${language === 'ka' ? 'არსებული ფაილი' : 'existing files'}`
                    : (language === 'ka' ? 'ატვირთეთ ფოტოები' : 'Upload photos')
                }
                isComplete={mediaFiles.length > 0 || existingMedia.length > 0}
                isRequired={false}
              />
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${expandedSections.has('media') ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 space-y-4">
                {/* Existing Media */}
                {isEditMode && existingMedia.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'არსებული ფაილები' : 'Current files'} ({existingMedia.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {existingMedia.map((media, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                          <img
                            src={storage.getFileUrl(media.url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-neutral-400 dark:hover:border-neutral-500 group"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7 text-neutral-400" />
                    </div>
                    <p className="text-neutral-900 dark:text-white font-medium mb-1">
                      {language === 'ka' ? 'ატვირთეთ ფოტოები' : 'Upload photos'}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      PNG, JPG, MP4
                    </p>
                  </div>
                </div>

                {/* New Files Preview */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {mediaFiles.map((media, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                        {media.type === 'image' ? (
                          <img src={media.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={media.preview} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => removeMediaFile(idx)}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 backdrop-blur-xl border-t" style={{ backgroundColor: 'rgba(var(--color-bg-secondary-rgb), 0.9)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
            className={`
              w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all duration-300
              ${canSubmit() && !isSubmitting
                ? `bg-gradient-to-r ${categoryConfig?.gradient || 'from-forest-500 to-forest-600'} text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]`
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {uploadProgress > 0 && <span>{uploadProgress}%</span>}
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {isEditMode
                  ? (language === 'ka' ? 'ცვლილებების შენახვა' : 'Save Changes')
                  : (language === 'ka' ? 'გამოქვეყნება' : 'Publish Job')}
              </>
            )}
          </button>

          {!canSubmit() && (
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {!formData.category ? (language === 'ka' ? 'აირჩიეთ კატეგორია' : 'Select a category') :
               (selectedSpecialties.length === 0 && customSpecialties.length === 0) ? (language === 'ka' ? 'აირჩიეთ სპეციალობა' : 'Select a specialty') :
               !formData.title ? (language === 'ka' ? 'დაამატეთ სათაური' : 'Add a title') :
               !formData.description ? (language === 'ka' ? 'დაამატეთ აღწერა' : 'Add a description') :
               !formData.propertyType ? (language === 'ka' ? 'აირჩიეთ ქონების ტიპი' : 'Select property type') :
               (language === 'ka' ? 'შეავსეთ ყველა სავალდებულო ველი' : 'Fill all required fields')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
