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
  ArrowRight,
  Building2,
  Camera,
  Castle,
  Check,
  CheckCircle2,
  ChevronLeft,
  HelpCircle,
  Home,
  Layers,
  Link as LinkIcon,
  MapPin,
  Palette,
  Plus,
  Ruler,
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

type Step = 'category' | 'basics' | 'details' | 'budget' | 'media' | 'review';

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

// Specialties for each category - what type of specialist do they need (matches backend categories)
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

const EXISTING_FURNITURE_OPTIONS = [
  { value: 'keep_all', label: 'Keep All', labelKa: 'ყველა დარჩება', description: 'Keep existing furniture', descriptionKa: 'არსებული ავეჯის შენახვა' },
  { value: 'keep_some', label: 'Keep Some', labelKa: 'ნაწილი დარჩება', description: 'Selective replacement', descriptionKa: 'შერჩევითი ჩანაცვლება' },
  { value: 'replace_all', label: 'Replace All', labelKa: 'ყველა შეიცვლება', description: 'Complete refresh', descriptionKa: 'სრული განახლება' },
];

const BUDGET_TYPES = [
  { value: 'fixed', label: 'Fixed Budget', labelKa: 'ფიქსირებული ბიუჯეტი', description: 'I have a specific amount', descriptionKa: 'კონკრეტული თანხა მაქვს' },
  { value: 'range', label: 'Budget Range', labelKa: 'ბიუჯეტის დიაპაზონი', description: 'Flexible within a range', descriptionKa: 'მოქნილი ფასის დიაპაზონი' },
  { value: 'per_sqm', label: 'Per Square Meter', labelKa: 'კვადრატულ მეტრზე', description: 'Based on area size', descriptionKa: 'ფართობის მიხედვით' },
  { value: 'negotiable', label: 'Negotiable', labelKa: 'შეთანხმებით', description: 'Open to discussion', descriptionKa: 'ფასზე შეთანხმება' },
];

const STEPS: { id: Step; label: string; labelKa: string }[] = [
  { id: 'category', label: 'Category', labelKa: 'კატეგორია' },
  { id: 'basics', label: 'Basics', labelKa: 'საფუძვლები' },
  { id: 'details', label: 'Details', labelKa: 'დეტალები' },
  { id: 'budget', label: 'Budget', labelKa: 'ბიუჯეტი' },
  { id: 'media', label: 'Media', labelKa: 'მედია' },
  { id: 'review', label: 'Review', labelKa: 'მიმოხილვა' },
];

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

  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    category: '',
    title: '',
    description: '',
    location: '',
    propertyType: '',
    propertyTypeOther: '',

    // Size info
    areaSize: '',
    sizeUnit: 'sqm',
    roomCount: '',

    // Architecture fields
    cadastralId: '',
    landArea: '',
    floorCount: '',
    projectPhase: '',
    permitRequired: false,
    currentCondition: '',
    zoningType: '',

    // Interior design fields
    designStyles: [] as string[],
    roomsToDesign: [] as string[],
    furnitureIncluded: false,
    visualizationNeeded: false,
    preferredColors: [] as string[],

    // Renovation/Craftsmen fields
    workTypes: [] as string[],
    materialsProvided: false,
    materialsNote: '',
    occupiedDuringWork: false,
    urgencyLevel: '',

    // Home Care fields
    serviceFrequency: '',
    preferredTime: '',
    accessInstructions: '',
    hasPets: false,

    // Budget
    budgetType: 'negotiable',
    budgetAmount: '',
    budgetMin: '',
    budgetMax: '',
    pricePerUnit: '',

    // Timeline
    deadline: '',

    // References
    references: [] as Reference[],
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [newReferenceUrl, setNewReferenceUrl] = useState('');
  const [customWorkType, setCustomWorkType] = useState('');

  // Specialties state
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
  const [showCustomSpecialtyInput, setShowCustomSpecialtyInput] = useState(false);

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

        // Prefill form data from job
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
          // Architecture fields
          cadastralId: job.cadastralId || '',
          landArea: job.landArea || '',
          floorCount: job.floorCount?.toString() || '',
          projectPhase: job.projectPhase || '',
          permitRequired: job.permitRequired || false,
          currentCondition: job.currentCondition || '',
          zoningType: job.zoningType || '',
          // Interior design fields
          designStyles: job.designStyles || job.designStyle ? [job.designStyle] : [],
          roomsToDesign: job.roomsToDesign || [],
          furnitureIncluded: job.furnitureIncluded || false,
          visualizationNeeded: job.visualizationNeeded || false,
          preferredColors: job.preferredColors || [],
          // Renovation/Craftsmen fields
          workTypes: job.workTypes || [],
          materialsProvided: job.materialsProvided || false,
          materialsNote: job.materialsNote || '',
          occupiedDuringWork: job.occupiedDuringWork || false,
          urgencyLevel: job.urgencyLevel || '',
          // Home Care fields
          serviceFrequency: job.serviceFrequency || '',
          preferredTime: job.preferredTime || '',
          accessInstructions: job.accessInstructions || '',
          hasPets: job.hasPets || false,
          // Budget
          budgetType: job.budgetType || 'negotiable',
          budgetAmount: job.budgetAmount?.toString() || '',
          budgetMin: job.budgetMin?.toString() || '',
          budgetMax: job.budgetMax?.toString() || '',
          pricePerUnit: job.pricePerUnit?.toString() || '',
          // Timeline
          deadline: job.deadline ? job.deadline.split('T')[0] : '',
          // References
          references: job.references || [],
        }));

        // Extract specialties from skills array
        // Skills stored in job may include specialties - try to match them
        if (job.skills && job.skills.length > 0 && job.category) {
          const categorySpecialties = CATEGORY_SPECIALTIES[job.category] || [];
          const predefinedValues = categorySpecialties.map(s => s.value);

          const matchedSpecialties: string[] = [];
          const customSpecs: string[] = [];

          job.skills.forEach((skill: string) => {
            if (predefinedValues.includes(skill)) {
              matchedSpecialties.push(skill);
            } else {
              // Check if it's not a design style or room (for interior design)
              const isDesignStyle = DESIGN_STYLES.some(ds => ds.value === skill);
              const isRoom = ROOM_OPTIONS.some(r => r.value === skill);
              if (!isDesignStyle && !isRoom) {
                customSpecs.push(skill);
              }
            }
          });

          setSelectedSpecialties(matchedSpecialties);
          setCustomSpecialties(customSpecs.slice(0, 5)); // Max 5 custom
        }

        // Set existing media (images/videos already uploaded)
        if (job.media && job.media.length > 0) {
          setExistingMedia(job.media);
        } else if (job.images && job.images.length > 0) {
          setExistingMedia(job.images.map((url: string) => ({ type: 'image' as const, url })));
        }

        // Mark initial load as done to prevent resetting specialties
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

  // Auth check - allow clients and pro users in client mode
  useEffect(() => {
    const isClient = user?.role === 'client';
    const isProInClientMode = user?.role === 'pro' && isClientMode;
    if (!authLoading && (!isAuthenticated || (!isClient && !isProInClientMode))) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, isClientMode]);

  const selectedCategory = categories.find(c => c.key === formData.category);
  const isArchitecture = formData.category === 'architecture';
  const isInteriorDesign = formData.category === 'interior-design';
  const isCraftsmen = formData.category === 'craftsmen';
  const isHomeCare = formData.category === 'home-care';

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string, exclusive = false) => {
    setFormData(prev => {
      const arr = prev[field as keyof typeof prev] as string[];

      // Special handling for 'Entire Space' in roomsToDesign
      if (field === 'roomsToDesign') {
        if (item === 'Entire Space') {
          // If selecting Entire Space, clear all others
          if (arr.includes('Entire Space')) {
            return { ...prev, [field]: [] };
          }
          return { ...prev, [field]: ['Entire Space'] };
        } else {
          // If selecting a room, remove Entire Space
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

  const addCustomWorkType = () => {
    const trimmed = customWorkType.trim();
    if (!trimmed) return;
    if (formData.workTypes.includes(trimmed)) {
      setCustomWorkType('');
      return;
    }
    setFormData(prev => ({
      ...prev,
      workTypes: [...prev.workTypes, trimmed]
    }));
    setCustomWorkType('');
  };

  // Specialty helper functions
  const toggleSpecialty = (value: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(value)
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const addCustomSpecialty = () => {
    const trimmed = customSpecialtyInput.trim();
    if (!trimmed) return;
    if (customSpecialties.includes(trimmed) || selectedSpecialties.includes(trimmed)) {
      setCustomSpecialtyInput('');
      return;
    }
    if (customSpecialties.length >= 5) return;
    setCustomSpecialties(prev => [...prev, trimmed]);
    setCustomSpecialtyInput('');
  };

  const removeCustomSpecialty = (specialty: string) => {
    setCustomSpecialties(prev => prev.filter(s => s !== specialty));
  };

  const handleCustomSpecialtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSpecialty();
    }
  };

  // Reset specialties when category changes (but not on initial edit mode load)
  useEffect(() => {
    // In edit mode, skip the first reset after initial load
    if (isEditMode && !initialLoadDoneRef.current) {
      return;
    }
    // Only reset if user manually changed category after initial load
    if (isEditMode && initialLoadDoneRef.current) {
      // Reset only if this is a subsequent category change (not initial)
      setSelectedSpecialties([]);
      setCustomSpecialties([]);
      setCustomSpecialtyInput('');
      setShowCustomSpecialtyInput(false);
    } else if (!isEditMode) {
      // In create mode, always reset on category change
      setSelectedSpecialties([]);
      setCustomSpecialties([]);
      setCustomSpecialtyInput('');
      setShowCustomSpecialtyInput(false);
    }
  }, [formData.category, isEditMode]);

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'category':
        // Require category AND at least 1 specialty (from predefined or custom)
        return !!formData.category && (selectedSpecialties.length > 0 || customSpecialties.length > 0);
      case 'basics':
        const hasPropertyType = !!formData.propertyType && (formData.propertyType !== 'other' || !!formData.propertyTypeOther);
        return !!formData.title && !!formData.description && hasPropertyType;
      case 'details':
        return true; // All optional
      case 'budget':
        if (formData.budgetType === 'fixed') return !!formData.budgetAmount;
        if (formData.budgetType === 'range') return !!formData.budgetMin && !!formData.budgetMax;
        if (formData.budgetType === 'per_sqm') return !!formData.pricePerUnit;
        return true;
      case 'media':
        return true; // Optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  };

  const prevStep = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Upload media files first
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

      // Prepare job data
      const jobData: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        propertyType: formData.propertyType,
        budgetType: formData.budgetType,
      };

      // Add propertyTypeOther if property type is "other"
      if (formData.propertyType === 'other' && formData.propertyTypeOther) {
        jobData.propertyTypeOther = formData.propertyTypeOther;
      }

      // Add location if provided
      if (formData.location) jobData.location = formData.location;

      // Add size info
      if (formData.areaSize) jobData.areaSize = Number(formData.areaSize);
      if (formData.sizeUnit) jobData.sizeUnit = formData.sizeUnit;
      if (formData.roomCount) jobData.roomCount = Number(formData.roomCount);

      // Add budget based on type
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

      // Add deadline
      if (formData.deadline) jobData.deadline = formData.deadline;

      // Add architecture fields
      if (isArchitecture) {
        if (formData.cadastralId) jobData.cadastralId = formData.cadastralId;
        if (formData.landArea) jobData.landArea = formData.landArea;
        if (formData.floorCount) jobData.floorCount = Number(formData.floorCount);
        if (formData.projectPhase) jobData.projectPhase = formData.projectPhase;
        if (formData.permitRequired) jobData.permitRequired = formData.permitRequired;
        if (formData.currentCondition) jobData.currentCondition = formData.currentCondition;
        if (formData.zoningType) jobData.zoningType = formData.zoningType;
      }

      // Add interior design fields as skills (backend doesn't have separate fields for these)
      if (isInteriorDesign) {
        // Add design styles and rooms as skills since backend doesn't have designStyles/roomsToDesign fields
        const interiorSkills: string[] = [];
        if (formData.designStyles.length) interiorSkills.push(...formData.designStyles);
        if (formData.roomsToDesign.length) interiorSkills.push(...formData.roomsToDesign);
        if (interiorSkills.length) jobData.skills = interiorSkills;

        // These fields may need backend support - only include if backend accepts them
        // if (formData.furnitureIncluded) jobData.furnitureIncluded = formData.furnitureIncluded;
        // if (formData.visualizationNeeded) jobData.visualizationNeeded = formData.visualizationNeeded;
        // if (formData.preferredColors.length) jobData.preferredColors = formData.preferredColors;
        // if (formData.references.length) jobData.references = formData.references;
      }

      // Add specialties to skills for searchability (backend doesn't have specialties field)
      const allSpecialties = [...selectedSpecialties, ...customSpecialties];
      if (allSpecialties.length > 0) {
        if (!jobData.skills) jobData.skills = [];
        jobData.skills = [...new Set([...jobData.skills, ...allSpecialties])];
      }

      // Add renovation fields (can apply to both categories)
      if (formData.workTypes.length) jobData.workTypes = formData.workTypes;
      if (formData.materialsProvided) jobData.materialsProvided = formData.materialsProvided;
      if (formData.materialsNote) jobData.materialsNote = formData.materialsNote;
      if (formData.occupiedDuringWork) jobData.occupiedDuringWork = formData.occupiedDuringWork;

      // Add images (backend only accepts images array, not media)
      if (uploadedMedia.length) {
        // New files uploaded - use them
        jobData.images = uploadedMedia.filter(m => m.type === 'image').map(m => m.url);
      } else if (isEditMode && existingMedia.length > 0) {
        // No new files, keep existing media in edit mode
        jobData.images = existingMedia.filter(m => m.type === 'image').map(m => m.url);
      }

      setUploadProgress(90);

      if (isEditMode && editJobId) {
        await api.put(`/jobs/${editJobId}`, jobData);
      } else {
        await api.post('/jobs', jobData);
      }

      setUploadProgress(100);

      // Show success toast
      toast.success(
        isEditMode
          ? (language === 'ka' ? 'სამუშაო განახლდა' : 'Job updated')
          : (language === 'ka' ? 'სამუშაო შეიქმნა' : 'Job created'),
        isEditMode
          ? (language === 'ka' ? 'თქვენი სამუშაო წარმატებით განახლდა' : 'Your job has been successfully updated')
          : (language === 'ka' ? 'თქვენი სამუშაო წარმატებით გამოქვეყნდა' : 'Your job has been successfully posted')
      );

      // Redirect to my jobs
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Progress Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step Indicator */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => router.push('/browse')}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {language === 'ka' ? `ნაბიჯი ${currentStepIndex + 1}/${STEPS.length}` : `Step ${currentStepIndex + 1} of ${STEPS.length}`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-forest-500 to-forest-600 dark:from-primary-400 dark:to-primary-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step Labels */}
            <div className="flex justify-between mt-3">
              {STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                  disabled={idx > currentStepIndex}
                  className={`text-xs font-medium transition-all duration-200 ${
                    idx === currentStepIndex
                      ? 'text-forest-600 dark:text-primary-400'
                      : idx < currentStepIndex
                      ? 'text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-forest-600 dark:hover:text-primary-400'
                      : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <span className="hidden sm:inline">{language === 'ka' ? step.labelKa : step.label}</span>
                  <span className="sm:hidden">{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Step: Category Selection */}
        {currentStep === 'category' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                {isEditMode
                  ? (language === 'ka' ? 'პროექტის კატეგორიის რედაქტირება' : 'Edit Project Category')
                  : (language === 'ka' ? 'რა ტიპის პროექტია?' : 'What type of project?')}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                {isEditMode
                  ? (language === 'ka' ? 'განაახლეთ თქვენი პროექტის კატეგორია' : 'Update the category for your project')
                  : (language === 'ka' ? 'აირჩიეთ კატეგორია, რომელიც საუკეთესოდ აღწერს თქვენს პროექტს' : 'Select the category that best describes your project')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {categories.map((category, idx) => {
                // Custom SVG icons for each category
                const getCategoryIcon = (key: string) => {
                  if (key === 'architecture') {
                    return (
                      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 4L4 18V44H18V32H30V44H44V18L24 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M24 4V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M18 22H22V28H18V22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M26 22H30V28H26V22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 18L24 4L44 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    );
                  }
                  if (key === 'interior-design') {
                    return (
                      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="24" width="36" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 40V44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M38 40V44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M6 28C6 28 10 24 16 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M42 28C42 28 38 24 32 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        <rect x="14" y="8" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="24" cy="14" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    );
                  }
                  // Default icon
                  return (
                    <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2.5"/>
                      <path d="M6 18H42" stroke="currentColor" strokeWidth="2.5"/>
                      <path d="M18 18V42" stroke="currentColor" strokeWidth="2.5"/>
                    </svg>
                  );
                };

                return (
                  <button
                    key={category._id}
                    onClick={() => updateFormData('category', category.key)}
                    className={`group relative p-6 rounded-2xl text-left transition-all duration-300 ${
                      formData.category === category.key
                        ? 'ring-2 ring-forest-500 dark:ring-primary-400 shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      animationDelay: `${idx * 100}ms`
                    }}
                  >
                    {/* Selected indicator */}
                    {formData.category === category.key && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-forest-500 dark:bg-primary-400 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className={`mb-4 ${formData.category === category.key ? 'text-forest-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'} transition-colors`}>
                      {getCategoryIcon(category.key)}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                      {language === 'ka' ? category.nameKa : category.name}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {language === 'ka' ? category.descriptionKa : category.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Specialty Selection - appears after category is selected */}
            {formData.category && CATEGORY_SPECIALTIES[formData.category] && (
              <div className="mt-10 max-w-2xl mx-auto animate-fadeIn">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                    {language === 'ka' ? 'რისი სპეციალისტი გჭირდებათ?' : 'What specialist do you need?'}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {language === 'ka'
                      ? 'აირჩიეთ მინიმუმ 1 სპეციალობა ან დაამატეთ საკუთარი'
                      : 'Select at least 1 specialty or add your own'}
                  </p>
                </div>

                {/* Predefined Specialties */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {CATEGORY_SPECIALTIES[formData.category].map((specialty) => {
                    const isSelected = selectedSpecialties.includes(specialty.value);
                    return (
                      <button
                        key={specialty.value}
                        type="button"
                        onClick={() => toggleSpecialty(specialty.value)}
                        className={`
                          px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                          ${isSelected
                            ? 'bg-forest-500 dark:bg-primary-500 text-white shadow-md scale-105'
                            : 'hover:scale-105'
                          }
                        `}
                        style={{
                          backgroundColor: isSelected ? undefined : 'var(--color-bg-secondary)',
                          border: `1px solid ${isSelected ? 'transparent' : 'var(--color-border)'}`,
                          color: isSelected ? undefined : 'var(--color-text-primary)',
                        }}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4" />}
                          {language === 'ka' ? specialty.labelKa : specialty.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Specialty Section */}
                <div
                  className="p-5 rounded-2xl border-2 border-dashed transition-all duration-300"
                  style={{
                    borderColor: showCustomSpecialtyInput ? 'var(--color-accent)' : 'var(--color-border)',
                    background: showCustomSpecialtyInput
                      ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)'
                      : 'var(--color-bg-secondary)',
                  }}
                >
                  {/* Custom specialties display */}
                  {customSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {customSpecialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeCustomSpecialty(specialty)}
                            className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {!showCustomSpecialtyInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomSpecialtyInput(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                      disabled={customSpecialties.length >= 5}
                    >
                      <Plus className="w-4 h-4" />
                      {language === 'ka'
                        ? (customSpecialties.length >= 5 ? 'მაქსიმუმ 5 სპეციალობა' : 'დამატეთ უნიკალური სპეციალობა')
                        : (customSpecialties.length >= 5 ? 'Maximum 5 specialties' : 'Add custom specialty')}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                          <input
                            type="text"
                            value={customSpecialtyInput}
                            onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                            onKeyDown={handleCustomSpecialtyKeyDown}
                            placeholder={language === 'ka' ? 'მაგ., 3D ვიზუალიზაცია' : 'e.g., 3D Visualization'}
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            style={{
                              backgroundColor: 'var(--color-bg-primary)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)',
                            }}
                            maxLength={50}
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addCustomSpecialty}
                          disabled={!customSpecialtyInput.trim() || customSpecialties.length >= 5}
                          className="px-4 py-3 rounded-xl font-medium text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          }}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomSpecialtyInput(false);
                            setCustomSpecialtyInput('');
                          }}
                          className="px-3 py-3 rounded-xl transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Marketing note */}
                      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
                        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {language === 'ka'
                            ? 'ეძებეთ უნიკალური სპეციალისტი! თქვენი მოთხოვნა გამოჩნდება პროფესიონალების საძიებო შედეგებში, თუმცა კატეგორიების ფილტრში არ გამოჩნდება.'
                            : 'Looking for a unique specialist! Your request will appear in professional search results, but won\'t show in category filters.'}
                        </p>
                      </div>

                      <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                        {language === 'ka'
                          ? `${customSpecialties.length}/5 სპეციალობა დამატებულია`
                          : `${customSpecialties.length}/5 specialties added`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Requirement note */}
                {(selectedSpecialties.length === 0 && customSpecialties.length === 0) && (
                  <p className="text-center text-sm mt-4 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {language === 'ka'
                      ? 'აირჩიეთ მინიმუმ 1 სპეციალობა გასაგრძელებლად'
                      : 'Select at least 1 specialty to continue'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: Basics */}
        {currentStep === 'basics' && (
          <div className="animate-fadeIn space-y-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                {language === 'ka' ? 'ძირითადი ინფორმაცია' : 'Basic Information'}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                {language === 'ka' ? 'მოგვიყევით თქვენი პროექტის შესახებ' : 'Tell us about your project'}
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {language === 'ka' ? 'პროექტის სათაური' : 'Project Title'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder={language === 'ka'
                  ? (isInteriorDesign ? "მაგ., თანამედროვე ბინის ინტერიერის დიზაინი" : "მაგ., ორსართულიანი საცხოვრებელი სახლის პროექტი")
                  : (isInteriorDesign ? "e.g., Modern apartment interior design" : "e.g., Two-story residential building design")}
                className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
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
                placeholder={language === 'ka' ? 'დეტალურად აღწერეთ თქვენი პროექტი. მიუთითეთ კონკრეტული მოთხოვნები, პრეფერენციები ან შეზღუდვები...' : 'Describe your project in detail. Include any specific requirements, preferences, or constraints...'}
                rows={5}
                className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400 resize-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            {/* Property Type */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {language === 'ka' ? 'ქონების ტიპი' : 'Property Type'} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PROPERTY_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        updateFormData('propertyType', type.value);
                        if (type.value !== 'other') {
                          updateFormData('propertyTypeOther', '');
                        }
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                        formData.propertyType === type.value
                          ? 'ring-2 ring-forest-500 dark:ring-primary-400'
                          : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Icon className={`w-6 h-6 ${formData.propertyType === type.value ? 'text-forest-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
                      <span className={`text-xs font-medium ${formData.propertyType === type.value ? 'text-forest-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
                        {language === 'ka' ? type.labelKa : type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Custom property type input when "other" is selected */}
              {formData.propertyType === 'other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={formData.propertyTypeOther}
                    onChange={(e) => updateFormData('propertyTypeOther', e.target.value)}
                    placeholder={language === 'ka' ? 'მიუთითეთ ქონების ტიპი...' : 'Specify property type...'}
                    className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Size Info - Two rows for better layout */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Ruler className="w-4 h-4 inline mr-1.5" />
                    {language === 'ka' ? 'ფართობი (მ²)' : 'Area Size (m²)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.areaSize}
                      onChange={(e) => updateFormData('areaSize', e.target.value)}
                      placeholder="100"
                      className="w-full px-4 py-3 pr-12 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                      მ²
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Layers className="w-4 h-4 inline mr-1.5" />
                    {language === 'ka' ? 'ოთახების რაოდენობა' : 'Number of Rooms'}
                  </label>
                  <input
                    type="number"
                    value={formData.roomCount}
                    onChange={(e) => updateFormData('roomCount', e.target.value)}
                    placeholder="3"
                    className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
              </div>

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
                {formData.deadline && (
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {language === 'ka' ? 'არჩეულია' : 'Selected'}: <span className="font-medium text-forest-600 dark:text-primary-400">
                      {new Date(formData.deadline).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Location - Optional */}
            <div>
              <AddressPicker
                value={formData.location}
                onChange={(value) => updateFormData('location', value)}
                locale={language}
                label={language === 'ka' ? 'პროექეტის მდებარეობა' : 'Location'}
                required={false}
              />
            </div>
          </div>
        )}

        {/* Step: Details (Category-specific) */}
        {currentStep === 'details' && (
          <div className="animate-fadeIn space-y-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                {isArchitecture
                  ? (language === 'ka' ? 'არქიტექტურის დეტალები' : 'Architecture Details')
                  : isInteriorDesign
                    ? (language === 'ka' ? 'დიზაინის დეტალები' : 'Design Details')
                    : isCraftsmen
                      ? (language === 'ka' ? 'სამუშაოს დეტალები' : 'Work Details')
                      : isHomeCare
                        ? (language === 'ka' ? 'სერვისის დეტალები' : 'Service Details')
                        : (language === 'ka' ? 'პროექტის დეტალები' : 'Project Details')}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                {isArchitecture
                  ? (language === 'ka' ? 'მოგვიყევით მეტი თქვენი არქიტექტურული პროექტის შესახებ' : 'Tell us more about your architectural project')
                  : isInteriorDesign
                    ? (language === 'ka' ? 'გაგვიზიარეთ თქვენი დიზაინის პრეფერენციები და მოთხოვნები' : 'Share your design preferences and requirements')
                    : isCraftsmen
                      ? (language === 'ka' ? 'აღწერეთ რა სამუშაოა შესასრულებელი' : 'Describe what work needs to be done')
                      : isHomeCare
                        ? (language === 'ka' ? 'აღწერეთ რა სერვისი გჭირდებათ' : 'Describe what service you need')
                        : (language === 'ka' ? 'მოგვიყევით მეტი თქვენი პროექტის შესახებ' : 'Tell us more about your project')}
              </p>
            </div>

            {/* Architecture-specific fields */}
            {isArchitecture && (
              <div className="space-y-6">
                {/* Project Phase */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'პროექტის ფაზა' : 'Project Phase'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PROJECT_PHASES.map((phase) => (
                      <button
                        key={phase.value}
                        type="button"
                        onClick={() => updateFormData('projectPhase', phase.value)}
                        className={`p-4 rounded-xl text-left transition-all duration-200 ${
                          formData.projectPhase === phase.value
                            ? 'ring-2 ring-forest-500 dark:ring-primary-400'
                            : ''
                        }`}
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <span className={`block text-sm font-medium ${formData.projectPhase === phase.value ? 'text-forest-600 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                          {language === 'ka' ? phase.labelKa : phase.label}
                        </span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {language === 'ka' ? phase.descriptionKa : phase.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoning Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'ზონირების ტიპი' : 'Zoning Type'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ZONING_TYPES.map((zone) => (
                      <button
                        key={zone.value}
                        type="button"
                        onClick={() => updateFormData('zoningType', zone.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          formData.zoningType === zone.value
                            ? 'bg-forest-600 dark:bg-primary-500 text-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        style={formData.zoningType !== zone.value ? {
                          backgroundColor: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        } : {}}
                      >
                        {language === 'ka' ? zone.labelKa : zone.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'საკადასტრო კოდი' : 'Cadastral ID'}
                    </label>
                    <input
                      type="text"
                      value={formData.cadastralId}
                      onChange={(e) => updateFormData('cadastralId', e.target.value)}
                      placeholder={language === 'ka' ? "მაგ., 01.12.34.567.890" : "e.g., 01.12.34.567.890"}
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'მიწის ფართობი' : 'Land Area'}
                    </label>
                    <input
                      type="text"
                      value={formData.landArea}
                      onChange={(e) => updateFormData('landArea', e.target.value)}
                      placeholder={language === 'ka' ? "მაგ., 500 მ²" : "e.g., 500 m²"}
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'სართულების რაოდენობა' : 'Number of Floors'}
                    </label>
                    <input
                      type="number"
                      value={formData.floorCount}
                      onChange={(e) => updateFormData('floorCount', e.target.value)}
                      placeholder="2"
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'მიმდინარე მდგომარეობა' : 'Current Condition'}
                    </label>
                    <input
                      type="text"
                      value={formData.currentCondition}
                      onChange={(e) => updateFormData('currentCondition', e.target.value)}
                      placeholder={language === 'ka' ? "მაგ., ცარიელი მიწა, ძველი შენობა" : "e.g., Empty land, Old building"}
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* Toggle */}
                <div
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{language === 'ka' ? 'საჭიროა მშენებლობის ნებართვა' : 'Building Permit Required'}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'სჭირდება თუ არა ამ პროექტს ნებართვა?' : 'Does this project need a permit?'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateFormData('permitRequired', !formData.permitRequired)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.permitRequired ? 'bg-forest-600 dark:bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        formData.permitRequired ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Interior Design-specific fields */}
            {isInteriorDesign && (
              <div className="space-y-6">
                {/* Design Style - Multi-select */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Palette className="w-4 h-4 inline mr-1.5" />
                    {language === 'ka' ? 'დიზაინის სტილი (აირჩიეთ რამდენიმე)' : 'Design Style (select multiple)'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DESIGN_STYLES.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => toggleArrayItem('designStyles', style.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          formData.designStyles.includes(style.value)
                            ? 'bg-forest-600 dark:bg-primary-500 text-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        style={!formData.designStyles.includes(style.value) ? {
                          backgroundColor: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        } : {}}
                      >
                        {language === 'ka' ? style.labelKa : style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rooms to Design */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'ოთახები დიზაინისთვის' : 'Rooms to Design'}
                  </label>

                  {/* Entire Space - Special Option */}
                  <button
                    type="button"
                    onClick={() => toggleArrayItem('roomsToDesign', 'Entire Space')}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-3 ${
                      formData.roomsToDesign.includes('Entire Space')
                        ? 'bg-forest-600 dark:bg-primary-500 text-white ring-2 ring-forest-500 dark:ring-primary-400'
                        : ''
                    }`}
                    style={!formData.roomsToDesign.includes('Entire Space') ? {
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    } : {}}
                  >
                    <Layers className="w-5 h-5" />
                    <div>
                      <span className="block text-sm font-medium">
                        {language === 'ka' ? 'სრული ფართი' : 'Entire Space'}
                      </span>
                      <span className={`block text-xs mt-0.5 ${
                        formData.roomsToDesign.includes('Entire Space')
                          ? 'text-white/80'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {language === 'ka' ? 'დიზაინი მთლიანი ფართისთვის' : 'Design for the whole space'}
                      </span>
                    </div>
                    {formData.roomsToDesign.includes('Entire Space') && (
                      <Check className="w-5 h-5 ml-auto" />
                    )}
                  </button>

                  {/* Divider with OR */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 border-t" style={{ borderColor: 'var(--color-border)' }} />
                    <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase">
                      {language === 'ka' ? 'ან' : 'or'}
                    </span>
                    <div className="flex-1 border-t" style={{ borderColor: 'var(--color-border)' }} />
                  </div>

                  {/* Individual Rooms */}
                  <div className="flex flex-wrap gap-2">
                    {ROOM_OPTIONS.filter(room => room.value !== 'Entire Space').map((room) => (
                      <button
                        key={room.value}
                        type="button"
                        onClick={() => toggleArrayItem('roomsToDesign', room.value)}
                        disabled={formData.roomsToDesign.includes('Entire Space')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          formData.roomsToDesign.includes(room.value)
                            ? 'bg-forest-600 dark:bg-primary-500 text-white'
                            : formData.roomsToDesign.includes('Entire Space')
                            ? 'opacity-40 cursor-not-allowed'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        style={!formData.roomsToDesign.includes(room.value) ? {
                          backgroundColor: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        } : {}}
                      >
                        {language === 'ka' ? room.labelKa : room.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{language === 'ka' ? 'ავეჯის შერჩევა' : 'Include Furniture Selection'}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'გჭირდებათ დახმარება ავეჯის შერჩევაში/შეძენაში?' : 'Need help selecting/purchasing furniture?'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateFormData('furnitureIncluded', !formData.furnitureIncluded)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        formData.furnitureIncluded ? 'bg-forest-600 dark:bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                          formData.furnitureIncluded ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{language === 'ka' ? '3D ვიზუალიზაცია' : '3D Visualization'}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'გჭირდებათ დიზაინის 3D რენდერები?' : 'Do you need 3D renders of the design?'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateFormData('visualizationNeeded', !formData.visualizationNeeded)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        formData.visualizationNeeded ? 'bg-forest-600 dark:bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                          formData.visualizationNeeded ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* References */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <LinkIcon className="w-4 h-4 inline mr-1.5" />
                    {language === 'ka' ? 'ინსპირაცია და მაგალითები' : 'Inspiration & References'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newReferenceUrl}
                      onChange={(e) => setNewReferenceUrl(e.target.value)}
                      placeholder={language === 'ka' ? "Pinterest, Instagram ან ნებისმიერი ბმული..." : "Paste Pinterest, Instagram, or any URL..."}
                      className="flex-1 px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
                    />
                    <button
                      type="button"
                      onClick={addReference}
                      className="px-4 py-3 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {formData.references.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {formData.references.map((ref, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <span className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--color-text-tertiary)' }}>
                            {ref.type === 'pinterest' ? (
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.43l1.4-5.9s-.34-.7-.34-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.5.76 1.5 1.66 0 1-.65 2.52-.98 3.92-.28 1.17.6 2.13 1.75 2.13 2.1 0 3.7-2.2 3.7-5.4 0-2.82-2.02-4.8-4.92-4.8-3.35 0-5.32 2.5-5.32 5.1 0 1 .4 2.1.88 2.7.1.12.1.22.08.34l-.33 1.33c-.05.22-.17.27-.4.16-1.5-.7-2.42-2.88-2.42-4.64 0-3.78 2.75-7.25 7.93-7.25 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.46-6.22 7.46-1.22 0-2.36-.63-2.75-1.38l-.75 2.84c-.27 1.05-1 2.36-1.5 3.17A12 12 0 1 0 12 0z"/></svg>
                            ) : ref.type === 'instagram' ? (
                              <Camera className="w-5 h-5" />
                            ) : (
                              <LinkIcon className="w-5 h-5" />
                            )}
                          </span>
                          <span className="flex-1 text-sm text-neutral-600 dark:text-neutral-400 truncate">
                            {ref.url}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeReference(idx)}
                            className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Craftsmen-specific fields */}
            {isCraftsmen && (
              <div className="space-y-6">
                {/* Urgency Level */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'სასწრაფოობა' : 'Urgency Level'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'flexible', label: 'Flexible', labelKa: 'მოქნილი', description: 'No rush', descriptionKa: 'დროში არ ვარ შეზღუდული' },
                      { value: 'soon', label: 'Soon', labelKa: 'მალე', description: 'Within 1-2 weeks', descriptionKa: '1-2 კვირაში' },
                      { value: 'urgent', label: 'Urgent', labelKa: 'სასწრაფო', description: 'ASAP needed', descriptionKa: 'რაც შეიძლება მალე' },
                    ].map((urgency) => (
                      <button
                        key={urgency.value}
                        type="button"
                        onClick={() => updateFormData('urgencyLevel', urgency.value)}
                        className={`p-4 rounded-xl text-left transition-all duration-200 ${
                          formData.urgencyLevel === urgency.value
                            ? 'ring-2 ring-forest-500 dark:ring-primary-400'
                            : ''
                        }`}
                        style={{
                          backgroundColor: formData.urgencyLevel === urgency.value
                            ? 'var(--color-accent-soft)'
                            : 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <span className={`block text-sm font-medium ${formData.urgencyLevel === urgency.value ? 'text-forest-600 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                          {language === 'ka' ? urgency.labelKa : urgency.label}
                        </span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {language === 'ka' ? urgency.descriptionKa : urgency.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materials Toggle */}
                <div
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {language === 'ka' ? 'მასალებს მე ვუზრუნველყოფ' : 'I will provide materials'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {language === 'ka' ? 'მაქვს საჭირო მასალები ხელოსნისთვის' : 'I have the necessary materials for the craftsman'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateFormData('materialsProvided', !formData.materialsProvided)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.materialsProvided ? 'bg-forest-600 dark:bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        formData.materialsProvided ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Materials note */}
                {formData.materialsProvided && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {language === 'ka' ? 'მასალების შენიშვნა' : 'Materials Note'}
                    </label>
                    <input
                      type="text"
                      value={formData.materialsNote}
                      onChange={(e) => updateFormData('materialsNote', e.target.value)}
                      placeholder={language === 'ka' ? 'მაგ., კაფელი და წებო უკვე მაქვს...' : 'e.g., I already have tiles and adhesive...'}
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                )}

                {/* Occupied During Work */}
                <div
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {language === 'ka' ? 'ფართი დაკავებულია' : 'Space is occupied'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {language === 'ka' ? 'ვცხოვრობ/ვმუშაობ ამ ფართში სამუშაოების დროს' : 'I live/work in this space during the work'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateFormData('occupiedDuringWork', !formData.occupiedDuringWork)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.occupiedDuringWork ? 'bg-forest-600 dark:bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        formData.occupiedDuringWork ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Home Care-specific fields */}
            {isHomeCare && (
              <div className="space-y-6">
                {/* Service Frequency */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'სერვისის სიხშირე' : 'Service Frequency'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: 'one-time', label: 'One-time', labelKa: 'ერთჯერადი', description: 'Single service', descriptionKa: 'ერთჯერადი სერვისი' },
                      { value: 'weekly', label: 'Weekly', labelKa: 'ყოველკვირეული', description: 'Regular weekly', descriptionKa: 'რეგულარულად ყოველ კვირა' },
                      { value: 'monthly', label: 'Monthly', labelKa: 'ყოველთვიური', description: 'Once per month', descriptionKa: 'თვეში ერთხელ' },
                      { value: 'as-needed', label: 'As Needed', labelKa: 'საჭიროებისამებრ', description: 'On-call basis', descriptionKa: 'გამოძახებით' },
                    ].map((freq) => (
                      <button
                        key={freq.value}
                        type="button"
                        onClick={() => updateFormData('serviceFrequency', freq.value)}
                        className={`p-4 rounded-xl text-left transition-all duration-200 ${
                          formData.serviceFrequency === freq.value
                            ? 'ring-2 ring-forest-500 dark:ring-primary-400'
                            : ''
                        }`}
                        style={{
                          backgroundColor: formData.serviceFrequency === freq.value
                            ? 'var(--color-accent-soft)'
                            : 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <span className={`block text-sm font-medium ${formData.serviceFrequency === freq.value ? 'text-forest-600 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                          {language === 'ka' ? freq.labelKa : freq.label}
                        </span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {language === 'ka' ? freq.descriptionKa : freq.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Time */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'სასურველი დრო' : 'Preferred Time'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'morning', label: 'Morning', labelKa: 'დილა' },
                      { value: 'afternoon', label: 'Afternoon', labelKa: 'შუადღე' },
                      { value: 'evening', label: 'Evening', labelKa: 'საღამო' },
                      { value: 'flexible', label: 'Flexible', labelKa: 'მოქნილი' },
                    ].map((time) => (
                      <button
                        key={time.value}
                        type="button"
                        onClick={() => updateFormData('preferredTime', time.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          formData.preferredTime === time.value
                            ? 'bg-forest-600 dark:bg-primary-500 text-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        style={formData.preferredTime !== time.value ? {
                          backgroundColor: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        } : {}}
                      >
                        {language === 'ka' ? time.labelKa : time.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Access Instructions */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {language === 'ka' ? 'წვდომის ინსტრუქციები' : 'Access Instructions'}
                  </label>
                  <textarea
                    value={formData.accessInstructions || ''}
                    onChange={(e) => updateFormData('accessInstructions', e.target.value)}
                    placeholder={language === 'ka'
                      ? 'მაგ., დარეკეთ მისვლისას, გასაღები მეზობელთანაა...'
                      : 'e.g., Call upon arrival, key is with neighbor...'}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400 resize-none"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                {/* Pet Friendly */}
                <div
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {language === 'ka' ? 'შინაური ცხოველები მყავს' : 'I have pets'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {language === 'ka' ? 'სპეციალისტმა იცოდეს შინაური ცხოველების შესახებ' : 'Let the specialist know about pets'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateFormData('hasPets', !formData.hasPets)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.hasPets ? 'bg-forest-600 dark:bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        formData.hasPets ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Work Types - for Craftsmen and Architecture/Interior */}
            {(isCraftsmen || isArchitecture || isInteriorDesign) && (
            <div className="space-y-3 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {language === 'ka' ? 'სამუშაოს ტიპები' : 'Work Types Required'}
              </label>

              {/* Predefined work types */}
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((work) => (
                  <button
                    key={work.value}
                    type="button"
                    onClick={() => toggleArrayItem('workTypes', work.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      formData.workTypes.includes(work.value)
                        ? 'bg-forest-600 dark:bg-primary-500 text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    style={!formData.workTypes.includes(work.value) ? {
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    } : {}}
                  >
                    {language === 'ka' ? work.labelKa : work.label}
                  </button>
                ))}
              </div>

              {/* Custom work types - show selected custom types */}
              {formData.workTypes.filter(w => !WORK_TYPES.some(wt => wt.value === w)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.workTypes.filter(w => !WORK_TYPES.some(wt => wt.value === w)).map((work) => (
                    <button
                      key={work}
                      type="button"
                      onClick={() => toggleArrayItem('workTypes', work)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-forest-600 dark:bg-primary-500 text-white flex items-center gap-2"
                    >
                      {work}
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}

              {/* Add custom work type input */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={customWorkType}
                  onChange={(e) => setCustomWorkType(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomWorkType())}
                  placeholder={language === 'ka' ? 'დაამატეთ საკუთარი...' : 'Add custom type...'}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomWorkType}
                  disabled={!customWorkType.trim()}
                  className="px-4 py-2.5 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Step: Budget */}
        {currentStep === 'budget' && (
          <div className="animate-fadeIn space-y-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                {language === 'ka' ? 'ბიუჯეტი' : 'Budget'}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                {language === 'ka' ? 'განსაზღვრეთ თქვენი ბიუჯეტი' : 'Set your budget expectations'}
              </p>
            </div>

            {/* Budget Type */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {language === 'ka' ? 'ბიუჯეტის ტიპი' : 'Budget Type'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUDGET_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('budgetType', type.value)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      formData.budgetType === type.value
                        ? 'ring-2 ring-forest-500 dark:ring-primary-400'
                        : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span className={`block text-sm font-medium ${formData.budgetType === type.value ? 'text-forest-600 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                      {language === 'ka' ? type.labelKa : type.label}
                    </span>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {language === 'ka' ? type.descriptionKa : type.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Amount Fields */}
            {formData.budgetType === 'fixed' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {language === 'ka' ? 'ბიუჯეტის თანხა (₾)' : 'Budget Amount (₾)'}
                </label>
                <input
                  type="number"
                  value={formData.budgetAmount}
                  onChange={(e) => updateFormData('budgetAmount', e.target.value)}
                  placeholder={language === 'ka' ? "შეიყვანეთ ბიუჯეტი" : "Enter your budget"}
                  className="w-full px-4 py-3.5 rounded-xl text-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            )}

            {formData.budgetType === 'range' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Minimum (₾)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => updateFormData('budgetMin', e.target.value)}
                    placeholder={language === 'ka' ? "მინ" : "Min"}
                    className="w-full px-4 py-3.5 rounded-xl text-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Maximum (₾)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => updateFormData('budgetMax', e.target.value)}
                    placeholder={language === 'ka' ? "მაქს" : "Max"}
                    className="w-full px-4 py-3.5 rounded-xl text-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
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
                  Price per m² (₾)
                </label>
                <input
                  type="number"
                  value={formData.pricePerUnit}
                  onChange={(e) => updateFormData('pricePerUnit', e.target.value)}
                  placeholder={language === 'ka' ? "შეიყვანეთ ფასი კვ.მ-ზე" : "Enter price per square meter"}
                  className="w-full px-4 py-3.5 rounded-xl text-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-400"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                {formData.areaSize && formData.pricePerUnit && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                    Estimated total: <span className="font-medium text-forest-600 dark:text-primary-400">₾{(Number(formData.areaSize) * Number(formData.pricePerUnit)).toLocaleString()}</span>
                  </p>
                )}
              </div>
            )}

            {formData.budgetType === 'negotiable' && (
              <div
                className="p-6 rounded-xl text-center"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Sparkles className="w-8 h-8 text-forest-600 dark:text-primary-400 mx-auto mb-3" />
                <p className="text-neutral-600 dark:text-neutral-400">
                  You'll be able to discuss the budget with professionals who submit proposals.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Media */}
        {currentStep === 'media' && (
          <div className="animate-fadeIn space-y-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                {language === 'ka' ? 'ფოტოები და ვიდეოები' : 'Photos & Videos'}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                {isEditMode
                  ? (language === 'ka' ? 'განაახლეთ ფოტოები ან ვიდეოები თქვენი პროექტისთვის' : 'Update photos or videos for your project')
                  : (language === 'ka' ? 'დაამატეთ ფოტოები ან ვიდეოები, რომ პროფესიონალებმა უკეთ გაიგონ თქვენი პროექტი' : 'Add photos or videos of your space to help professionals understand your project')}
              </p>
            </div>

            {/* Existing Media (Edit Mode) */}
            {isEditMode && existingMedia.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Current Media ({existingMedia.length} files)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {existingMedia.map((media, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      {media.type === 'image' ? (
                        <img
                          src={storage.getFileUrl(media.url)}
                          alt={`Existing ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={storage.getFileUrl(media.url)}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-forest-600/80 rounded text-xs text-white">
                        Existing
                      </div>
                      {media.type === 'video' && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                          Video
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Note: Adding new files will replace all existing media
                </p>
              </div>
            )}

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-forest-400 dark:hover:border-primary-400 group"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-50 dark:from-forest-900/30 dark:to-forest-900/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Camera className="w-8 h-8 text-forest-600 dark:text-forest-400" />
                </div>
                <p className="text-neutral-900 dark:text-neutral-50 font-medium mb-1">
                  {isEditMode && existingMedia.length > 0
                    ? (language === 'ka' ? 'ატვირთეთ ახალი ფაილები არსებულის შესაცვლელად' : 'Upload new files to replace existing')
                    : (language === 'ka' ? 'ჩააგდეთ ფაილები ან დააკლიკეთ ასატვირთად' : 'Drop files here or click to upload')}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {language === 'ka' ? 'PNG, JPG, MP4 50MB-მდე თითოეული' : 'PNG, JPG, MP4 up to 50MB each'}
                </p>
              </div>
            </div>

            {/* New Files Preview Grid */}
            {mediaFiles.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  New Files to Upload ({mediaFiles.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaFiles.map((media, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      {media.type === 'image' ? (
                        <img
                          src={media.preview}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.preview}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeMediaFile(idx)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </button>
                      </div>
                      {media.type === 'video' && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                          Video
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Review */}
        {currentStep === 'review' && (
          <div className="animate-fadeIn space-y-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                {isEditMode
                  ? (language === 'ka' ? 'ცვლილებების მიმოხილვა' : 'Review Changes')
                  : (language === 'ka' ? 'გადახედეთ თქვენს განცხადებას' : 'Review Your Job')}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                {isEditMode
                  ? (language === 'ka' ? 'დარწმუნდით, რომ ყველაფერი კარგად გამოიყურება შენახვამდე' : 'Make sure everything looks good before saving')
                  : (language === 'ka' ? 'დარწმუნდით, რომ ყველაფერი კარგად გამოიყურება გამოქვეყნებამდე' : 'Make sure everything looks good before posting')}
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}

            {/* Summary Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {/* Header */}
              <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-forest-100 dark:bg-forest-900/30 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-forest-600 dark:text-forest-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-forest-600 dark:text-primary-400 font-medium uppercase tracking-wide mb-1">
                      {language === 'ka' ? selectedCategory?.nameKa : selectedCategory?.name}
                    </p>
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {formData.title}
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {formData.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{language === 'ka' ? 'აღწერა' : 'Description'}</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{language === 'ka' ? 'ქონება' : 'Property'}</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 capitalize">
                      {formData.propertyType === 'other' ? formData.propertyTypeOther : formData.propertyType}
                    </p>
                  </div>
                  {formData.areaSize && (
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{language === 'ka' ? 'ზომა' : 'Size'}</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{formData.areaSize} {formData.sizeUnit}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{language === 'ka' ? 'ბიუჯეტი' : 'Budget'}</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {formData.budgetType === 'fixed' && formData.budgetAmount && `₾${Number(formData.budgetAmount).toLocaleString()}`}
                      {formData.budgetType === 'range' && `₾${Number(formData.budgetMin).toLocaleString()} - ₾${Number(formData.budgetMax).toLocaleString()}`}
                      {formData.budgetType === 'per_sqm' && formData.pricePerUnit && `₾${formData.pricePerUnit}/m²`}
                      {formData.budgetType === 'negotiable' && (language === 'ka' ? 'შეთანხმებით' : 'Negotiable')}
                    </p>
                  </div>
                  {formData.deadline && (
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{language === 'ka' ? 'ვადა' : 'Deadline'}</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {new Date(formData.deadline).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Category-specific details */}
                {isInteriorDesign && formData.designStyles.length > 0 && (
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{language === 'ka' ? 'დიზაინის სტილი' : 'Design Styles'}</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.designStyles.map((style) => {
                        const styleObj = DESIGN_STYLES.find(s => s.value === style);
                        return (
                          <span key={style} className="px-3 py-1 rounded-full text-xs font-medium bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300">
                            {language === 'ka' && styleObj ? styleObj.labelKa : style}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.roomsToDesign.length > 0 && (
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{language === 'ka' ? 'ოთახები' : 'Rooms'}</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.roomsToDesign.map((room) => {
                        const roomObj = ROOM_OPTIONS.find(r => r.value === room);
                        return (
                          <span key={room} className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {language === 'ka' && roomObj ? roomObj.labelKa : room}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Work Types */}
                {formData.workTypes.length > 0 && (
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{language === 'ka' ? 'სამუშაოს ტიპები' : 'Work Types'}</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.workTypes.map((work) => {
                        const workObj = WORK_TYPES.find(w => w.value === work);
                        return (
                          <span key={work} className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            {language === 'ka' && workObj ? workObj.labelKa : work}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                {(formData.furnitureIncluded || formData.visualizationNeeded || formData.materialsProvided) && (
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{language === 'ka' ? 'დამატებითი' : 'Additional'}</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.furnitureIncluded && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {language === 'ka' ? 'ავეჯის შერჩევა' : 'Furniture Selection'}
                        </span>
                      )}
                      {formData.visualizationNeeded && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {language === 'ka' ? '3D ვიზუალიზაცია' : '3D Visualization'}
                        </span>
                      )}
                      {formData.materialsProvided && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          {language === 'ka' ? 'მასალები უზრუნველყოფილია' : 'Materials Provided'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* References */}
                {formData.references.length > 0 && (
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{language === 'ka' ? 'ინსპირაცია' : 'References'} ({formData.references.length})</p>
                    <div className="space-y-1">
                      {formData.references.slice(0, 3).map((ref, idx) => (
                        <p key={idx} className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {ref.url}
                        </p>
                      ))}
                      {formData.references.length > 3 && (
                        <p className="text-xs text-neutral-400">+{formData.references.length - 3} {language === 'ka' ? 'სხვა' : 'more'}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Media Preview */}
                {(mediaFiles.length > 0 || existingMedia.length > 0) && (
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                      {language === 'ka' ? 'მედია' : 'Media'} ({mediaFiles.length > 0
                        ? (language === 'ka' ? `${mediaFiles.length} ახალი ფაილი` : `${mediaFiles.length} new files`)
                        : (language === 'ka' ? `${existingMedia.length} ფაილი` : `${existingMedia.length} files`)})
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {/* Show new media files if any */}
                      {mediaFiles.length > 0 ? (
                        <>
                          {mediaFiles.slice(0, 5).map((media, idx) => (
                            <div key={idx} className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                              {media.type === 'image' ? (
                                <img src={media.preview} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <video src={media.preview} className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                          {mediaFiles.length > 5 && (
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                +{mediaFiles.length - 5}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Show existing media in edit mode */
                        <>
                          {existingMedia.slice(0, 5).map((media, idx) => (
                            <div key={idx} className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                              {media.type === 'image' ? (
                                <img src={storage.getFileUrl(media.url)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <video src={storage.getFileUrl(media.url)} className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                          {existingMedia.length > 5 && (
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                +{existingMedia.length - 5}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {currentStepIndex > 0 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                {language === 'ka' ? 'უკან' : 'Back'}
              </button>
            ) : (
              <div />
            )}

            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:bg-forest-700 dark:hover:bg-primary-600 transition-all font-medium min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadProgress > 0 && <span>{uploadProgress}%</span>}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {isEditMode
                      ? (language === 'ka' ? 'ცვლილებების შენახვა' : 'Save Changes')
                      : (language === 'ka' ? 'გამოქვეყნება' : 'Post Job')}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:bg-forest-700 dark:hover:bg-primary-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'ka' ? 'გაგრძელება' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
