'use client';

import { Check, ChevronDown, Plus, Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Category {
  _id: string;
  key: string;
  name: string;
  nameKa: string;
  description?: string;
  descriptionKa?: string;
  icon?: string;
}

interface Specialty {
  value: string;
  label: string;
  labelKa: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryKey: string) => void;
  selectedSpecialties: string[];
  onSpecialtyToggle: (value: string) => void;
  customSpecialties: string[];
  onAddCustomSpecialty: (specialty: string) => void;
  onRemoveCustomSpecialty: (specialty: string) => void;
  language: string;
  isEditMode?: boolean;
}

// Category visual configurations - editorial, refined aesthetic
const CATEGORY_CONFIG: Record<string, {
  gradient: string;
  bgColor: string;
  accentColor: string;
  borderColor: string;
  tagline: { en: string; ka: string };
}> = {
  'interior-design': {
    gradient: 'from-rose-400 via-fuchsia-500 to-violet-600',
    bgColor: 'bg-gradient-to-br from-rose-50 via-fuchsia-50 to-violet-50 dark:from-rose-950/40 dark:via-fuchsia-950/40 dark:to-violet-950/40',
    accentColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
    tagline: { en: 'Transform spaces into experiences', ka: 'სივრცე გამოცდილებად' },
  },
  'architecture': {
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/40 dark:to-indigo-950/40',
    accentColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    tagline: { en: 'Blueprint your vision', ka: 'შენი ხედვის პროექტი' },
  },
  'craftsmen': {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    bgColor: 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-red-950/40',
    accentColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    tagline: { en: 'Skilled hands, lasting quality', ka: 'ოსტატობა და ხარისხი' },
  },
  'home-care': {
    gradient: 'from-[#E07B4F] via-[#E8956A] to-[#DEB887]',
    bgColor: 'bg-gradient-to-br from-[#E07B4F]/5 via-[#E8956A]/5 to-[#DEB887]/5 dark:from-[#E07B4F]/20 dark:via-[#E8956A]/20 dark:to-[#DEB887]/20',
    accentColor: 'text-[#E07B4F] dark:text-[#E8956A]',
    borderColor: 'border-[#E07B4F]/20 dark:border-[#E8956A]/30',
    tagline: { en: 'Care for your sanctuary', ka: 'შენი თავშესაფრის მოვლა' },
  },
};

// Specialties for each category
const CATEGORY_SPECIALTIES: Record<string, Specialty[]> = {
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

// Elegant Illustrated Category Icons
const CategoryIllustration = ({ categoryKey, isSelected }: { categoryKey: string; isSelected: boolean }) => {
  const baseClass = `w-full h-full transition-all duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-102'}`;

  switch (categoryKey) {
    case 'interior-design':
      return (
        <svg className={baseClass} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Room perspective */}
          <defs>
            <linearGradient id="interior-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="interior-floor" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fce7f3" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>

          {/* Floor */}
          <path d="M10 75 L60 100 L110 75 L60 55 Z" fill="url(#interior-floor)" opacity="0.6"/>

          {/* Back wall */}
          <path d="M20 30 L100 30 L100 75 L60 55 L20 75 Z" fill="url(#interior-grad)" opacity="0.15"/>

          {/* Modern Sofa */}
          <g className={`transition-transform duration-700 ${isSelected ? 'translate-y-0' : 'translate-y-1'}`}>
            <rect x="30" y="60" width="60" height="22" rx="6" fill="url(#interior-grad)" opacity="0.9"/>
            <rect x="28" y="55" width="16" height="30" rx="4" fill="url(#interior-grad)" opacity="0.7"/>
            <rect x="76" y="55" width="16" height="30" rx="4" fill="url(#interior-grad)" opacity="0.7"/>
            {/* Cushions */}
            <ellipse cx="45" cy="65" rx="10" ry="6" fill="white" opacity="0.4"/>
            <ellipse cx="75" cy="65" rx="10" ry="6" fill="white" opacity="0.4"/>
          </g>

          {/* Modern Art Frame */}
          <g className={`transition-transform duration-500 ${isSelected ? 'translate-y-0' : 'translate-y-0.5'}`}>
            <rect x="45" y="20" width="30" height="24" rx="2" stroke="url(#interior-grad)" strokeWidth="2" fill="white" opacity="0.9"/>
            <circle cx="55" cy="30" r="4" fill="url(#interior-grad)" opacity="0.6"/>
            <circle cx="70" cy="35" r="3" fill="url(#interior-grad)" opacity="0.4"/>
            <path d="M48 38 Q55 32 62 38 Q69 32 72 38" stroke="url(#interior-grad)" strokeWidth="1.5" fill="none" opacity="0.5"/>
          </g>

          {/* Floor Lamp */}
          <g className={`transition-all duration-600 ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
            <line x1="100" y1="85" x2="100" y2="45" stroke="url(#interior-grad)" strokeWidth="2"/>
            <path d="M90 45 Q100 35 110 45 L105 50 L95 50 Z" fill="url(#interior-grad)" opacity="0.8"/>
            {/* Light glow */}
            <circle cx="100" cy="48" r="8" fill="url(#interior-grad)" opacity="0.2"/>
          </g>

          {/* Plant */}
          <g className={`transition-transform duration-700 delay-100 ${isSelected ? 'scale-100' : 'scale-95'}`} style={{ transformOrigin: '20px 80px' }}>
            <rect x="14" y="78" width="12" height="14" rx="2" fill="url(#interior-grad)" opacity="0.6"/>
            <ellipse cx="20" cy="70" rx="8" ry="10" fill="#22c55e" opacity="0.7"/>
            <ellipse cx="16" cy="68" rx="5" ry="7" fill="#22c55e" opacity="0.5"/>
            <ellipse cx="24" cy="66" rx="4" ry="6" fill="#22c55e" opacity="0.6"/>
          </g>

          {/* Decorative circles */}
          <circle cx="15" cy="25" r="3" fill="url(#interior-grad)" opacity="0.3"/>
          <circle cx="105" cy="22" r="2" fill="url(#interior-grad)" opacity="0.25"/>
        </svg>
      );

    case 'architecture':
      return (
        <svg className={baseClass} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="arch-sky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>

          {/* Sky background */}
          <rect x="10" y="10" width="100" height="100" rx="8" fill="url(#arch-sky)" opacity="0.3"/>

          {/* Main Building */}
          <g className={`transition-all duration-500 ${isSelected ? 'translate-y-0' : 'translate-y-1'}`}>
            {/* Building body */}
            <path d="M25 100 L25 40 L60 20 L95 40 L95 100 Z" fill="url(#arch-grad)" opacity="0.2" stroke="url(#arch-grad)" strokeWidth="2"/>

            {/* Roof detail */}
            <path d="M25 40 L60 20 L95 40" stroke="url(#arch-grad)" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <line x1="60" y1="20" x2="60" y2="10" stroke="url(#arch-grad)" strokeWidth="2" strokeLinecap="round"/>

            {/* Windows row 1 */}
            <rect x="32" y="48" width="12" height="14" rx="1" fill="white" opacity="0.9" stroke="url(#arch-grad)" strokeWidth="1.5"/>
            <rect x="54" y="48" width="12" height="14" rx="1" fill="white" opacity="0.9" stroke="url(#arch-grad)" strokeWidth="1.5"/>
            <rect x="76" y="48" width="12" height="14" rx="1" fill="white" opacity="0.9" stroke="url(#arch-grad)" strokeWidth="1.5"/>

            {/* Windows row 2 */}
            <rect x="32" y="68" width="12" height="14" rx="1" fill="white" opacity="0.9" stroke="url(#arch-grad)" strokeWidth="1.5"/>
            <rect x="76" y="68" width="12" height="14" rx="1" fill="white" opacity="0.9" stroke="url(#arch-grad)" strokeWidth="1.5"/>

            {/* Door */}
            <rect x="50" y="75" width="20" height="25" rx="2" fill="url(#arch-grad)" opacity="0.6"/>
            <rect x="52" y="77" width="16" height="18" rx="1" fill="white" opacity="0.4"/>
            <circle cx="64" cy="88" r="1.5" fill="url(#arch-grad)"/>
          </g>

          {/* Blueprint lines */}
          <g className={`transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
            <line x1="10" y1="100" x2="110" y2="100" stroke="url(#arch-grad)" strokeWidth="1" strokeDasharray="4 2"/>
            <line x1="15" y1="105" x2="105" y2="105" stroke="url(#arch-grad)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5"/>
          </g>

          {/* Compass rose */}
          <g className={`transition-transform duration-700 ${isSelected ? 'rotate-0' : '-rotate-12'}`} style={{ transformOrigin: '100px 20px' }}>
            <circle cx="100" cy="20" r="8" stroke="url(#arch-grad)" strokeWidth="1" fill="white" opacity="0.8"/>
            <path d="M100 14 L102 20 L100 26 L98 20 Z" fill="url(#arch-grad)" opacity="0.8"/>
            <line x1="94" y1="20" x2="106" y2="20" stroke="url(#arch-grad)" strokeWidth="1"/>
          </g>

          {/* Ruler marks */}
          <g opacity="0.4">
            <line x1="20" y1="108" x2="20" y2="112" stroke="url(#arch-grad)" strokeWidth="1"/>
            <line x1="40" y1="108" x2="40" y2="112" stroke="url(#arch-grad)" strokeWidth="1"/>
            <line x1="60" y1="108" x2="60" y2="114" stroke="url(#arch-grad)" strokeWidth="1.5"/>
            <line x1="80" y1="108" x2="80" y2="112" stroke="url(#arch-grad)" strokeWidth="1"/>
            <line x1="100" y1="108" x2="100" y2="112" stroke="url(#arch-grad)" strokeWidth="1"/>
          </g>
        </svg>
      );

    case 'craftsmen':
      return (
        <svg className={baseClass} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="craft-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="craft-wood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>

          {/* Workbench */}
          <rect x="15" y="85" width="90" height="8" rx="2" fill="url(#craft-wood)" opacity="0.8"/>
          <rect x="20" y="93" width="8" height="18" rx="1" fill="url(#craft-wood)" opacity="0.6"/>
          <rect x="92" y="93" width="8" height="18" rx="1" fill="url(#craft-wood)" opacity="0.6"/>

          {/* Hammer */}
          <g className={`transition-transform duration-500 ${isSelected ? 'rotate-0' : '-rotate-6'}`} style={{ transformOrigin: '35px 60px' }}>
            <rect x="30" y="45" width="10" height="35" rx="2" fill="url(#craft-wood)" opacity="0.9"/>
            <rect x="22" y="35" width="26" height="14" rx="3" fill="url(#craft-grad)"/>
            <rect x="22" y="38" width="26" height="4" fill="white" opacity="0.2"/>
          </g>

          {/* Wrench */}
          <g className={`transition-transform duration-600 delay-100 ${isSelected ? 'rotate-0' : 'rotate-6'}`} style={{ transformOrigin: '75px 55px' }}>
            <rect x="72" y="40" width="6" height="40" rx="2" fill="url(#craft-grad)" opacity="0.9"/>
            <circle cx="75" cy="35" r="12" stroke="url(#craft-grad)" strokeWidth="6" fill="none"/>
            <circle cx="75" cy="35" r="5" fill="white" opacity="0.3"/>
          </g>

          {/* Screwdriver */}
          <g className={`transition-all duration-500 delay-200 ${isSelected ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`}>
            <rect x="52" y="25" width="5" height="50" rx="1" fill="url(#craft-grad)" opacity="0.8"/>
            <rect x="50" y="60" width="9" height="15" rx="2" fill="url(#craft-wood)"/>
            <path d="M54.5 25 L52 18 L57 18 Z" fill="url(#craft-grad)"/>
          </g>

          {/* Gear */}
          <g className={`transition-transform duration-1000 ${isSelected ? 'rotate-45' : 'rotate-0'}`} style={{ transformOrigin: '100px 30px' }}>
            <circle cx="100" cy="30" r="12" fill="url(#craft-grad)" opacity="0.3"/>
            <circle cx="100" cy="30" r="8" stroke="url(#craft-grad)" strokeWidth="3" fill="white" opacity="0.8"/>
            <circle cx="100" cy="30" r="3" fill="url(#craft-grad)"/>
            {/* Gear teeth */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <rect
                key={i}
                x="98"
                y="16"
                width="4"
                height="6"
                rx="1"
                fill="url(#craft-grad)"
                opacity="0.8"
                transform={`rotate(${angle} 100 30)`}
              />
            ))}
          </g>

          {/* Sparks */}
          <g className={`transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-40'}`}>
            <circle cx="45" cy="28" r="2" fill="url(#craft-grad)"/>
            <circle cx="38" cy="24" r="1.5" fill="url(#craft-grad)" opacity="0.7"/>
            <circle cx="50" cy="22" r="1" fill="url(#craft-grad)" opacity="0.5"/>
            <path d="M42 30 L44 26 M46 25 L48 21" stroke="url(#craft-grad)" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
          </g>

          {/* Nails */}
          <g opacity="0.5">
            <line x1="25" y1="82" x2="25" y2="78" stroke="url(#craft-grad)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="95" y1="82" x2="95" y2="78" stroke="url(#craft-grad)" strokeWidth="2" strokeLinecap="round"/>
          </g>
        </svg>
      );

    case 'home-care':
      return (
        <svg className={baseClass} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="home-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="home-warm" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>

          {/* House */}
          <g className={`transition-transform duration-500 ${isSelected ? 'scale-100' : 'scale-98'}`} style={{ transformOrigin: '60px 60px' }}>
            {/* Roof */}
            <path d="M60 15 L15 50 L25 50 L25 95 L95 95 L95 50 L105 50 Z" fill="url(#home-grad)" opacity="0.15" stroke="url(#home-grad)" strokeWidth="2.5" strokeLinejoin="round"/>

            {/* Roof shingles detail */}
            <path d="M60 15 L15 50 L105 50 Z" fill="url(#home-grad)" opacity="0.25"/>
            <path d="M60 22 L25 50 L95 50 Z" fill="url(#home-grad)" opacity="0.1"/>

            {/* Chimney */}
            <rect x="75" y="25" width="12" height="20" rx="1" fill="url(#home-grad)" opacity="0.6"/>

            {/* Windows with warm glow */}
            <rect x="32" y="55" width="16" height="16" rx="2" fill="url(#home-warm)" stroke="url(#home-grad)" strokeWidth="1.5"/>
            <line x1="40" y1="55" x2="40" y2="71" stroke="url(#home-grad)" strokeWidth="1"/>
            <line x1="32" y1="63" x2="48" y2="63" stroke="url(#home-grad)" strokeWidth="1"/>

            <rect x="72" y="55" width="16" height="16" rx="2" fill="url(#home-warm)" stroke="url(#home-grad)" strokeWidth="1.5"/>
            <line x1="80" y1="55" x2="80" y2="71" stroke="url(#home-grad)" strokeWidth="1"/>
            <line x1="72" y1="63" x2="88" y2="63" stroke="url(#home-grad)" strokeWidth="1"/>

            {/* Door */}
            <rect x="50" y="65" width="20" height="30" rx="3" fill="url(#home-grad)" opacity="0.5"/>
            <circle cx="66" cy="82" r="2" fill="url(#home-grad)"/>

            {/* Heart */}
            <g className={`transition-all duration-700 ${isSelected ? 'scale-110 translate-y-0' : 'scale-100 translate-y-1'}`} style={{ transformOrigin: '60px 40px' }}>
              <path
                d="M60 35 C58 32 52 32 52 38 C52 44 60 50 60 50 C60 50 68 44 68 38 C68 32 62 32 60 35 Z"
                fill="url(#home-grad)"
                opacity="0.8"
                className={isSelected ? 'animate-pulse' : ''}
              />
            </g>
          </g>

          {/* Garden elements */}
          <g className={`transition-transform duration-600 delay-100 ${isSelected ? 'translate-y-0' : 'translate-y-1'}`}>
            {/* Tree */}
            <rect x="10" y="80" width="4" height="15" fill="url(#home-grad)" opacity="0.4"/>
            <ellipse cx="12" cy="72" rx="10" ry="12" fill="url(#home-grad)" opacity="0.5"/>
            <ellipse cx="8" cy="75" rx="6" ry="8" fill="url(#home-grad)" opacity="0.3"/>

            {/* Bush */}
            <ellipse cx="100" cy="88" rx="12" ry="8" fill="url(#home-grad)" opacity="0.4"/>
            <ellipse cx="106" cy="85" rx="8" ry="6" fill="url(#home-grad)" opacity="0.3"/>
          </g>

          {/* Sparkles for clean home */}
          <g className={`transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'opacity-40'}`}>
            <path d="M100 20 L102 25 L107 23 L102 26 L104 31 L100 27 L96 31 L98 26 L93 23 L98 25 Z" fill="url(#home-grad)" opacity="0.7"/>
            <circle cx="20" cy="35" r="2" fill="url(#home-grad)" opacity="0.5"/>
            <circle cx="25" cy="30" r="1" fill="url(#home-grad)" opacity="0.4"/>
          </g>

          {/* Ground line */}
          <line x1="5" y1="95" x2="115" y2="95" stroke="url(#home-grad)" strokeWidth="1" opacity="0.3"/>
          <ellipse cx="60" cy="100" rx="40" ry="5" fill="url(#home-grad)" opacity="0.1"/>
        </svg>
      );

    default:
      return (
        <svg className={baseClass} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="80" height="80" rx="12" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
        </svg>
      );
  }
};

export default function CategorySelector({
  categories,
  selectedCategory,
  onCategorySelect,
  selectedSpecialties,
  onSpecialtyToggle,
  customSpecialties,
  onAddCustomSpecialty,
  onRemoveCustomSpecialty,
  language,
  isEditMode = false,
}: CategorySelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(selectedCategory || null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setExpandedCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const handleCategoryClick = (categoryKey: string) => {
    onCategorySelect(categoryKey);
    setExpandedCategory(categoryKey);
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customSpecialties.includes(trimmed) && !selectedSpecialties.includes(trimmed)) {
      onAddCustomSpecialty(trimmed);
      setCustomInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const config = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : null;
  const specialties = selectedCategory ? CATEGORY_SPECIALTIES[selectedCategory] || [] : [];

  return (
    <div className="space-y-10">
      {/* Elegant Header */}
      <div className="text-center space-y-4">
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500">
          {language === 'ka' ? 'ნაბიჯი 1' : 'Step 1'}
        </p>
        <h1 className="text-4xl sm:text-5xl font-serif font-light text-neutral-900 dark:text-neutral-50 tracking-tight">
          {isEditMode
            ? (language === 'ka' ? 'კატეგორია' : 'Category')
            : (language === 'ka' ? 'რას ეძებთ?' : 'What are you looking for?')}
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto font-light">
          {language === 'ka'
            ? 'აირჩიეთ კატეგორია თქვენი პროექტისთვის'
            : 'Choose the category that fits your project'}
        </p>
      </div>

      {/* Category Cards - 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {categories.map((category, idx) => {
          const catConfig = CATEGORY_CONFIG[category.key] || CATEGORY_CONFIG['home-care'];
          const isSelected = selectedCategory === category.key;
          const isExpanded = expandedCategory === category.key && isSelected;
          const catSpecialties = CATEGORY_SPECIALTIES[category.key] || [];

          return (
            <div
              key={category._id}
              className={`
                relative overflow-hidden rounded-3xl transition-all duration-500
                ${isSelected ? 'ring-2 ring-offset-4 ring-offset-[var(--color-bg-primary)] ring-neutral-900 dark:ring-white shadow-2xl' : 'shadow-lg hover:shadow-xl'}
              `}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${idx * 100}ms`,
              }}
            >
              {/* Card Header - Always Visible */}
              <button
                onClick={() => handleCategoryClick(category.key)}
                className={`
                  w-full text-left transition-all duration-500 group
                  ${isSelected ? catConfig.bgColor : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)]'}
                `}
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-5">
                    {/* Illustration */}
                    <div className={`
                      flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden transition-all duration-500
                      ${isSelected ? 'bg-white/80 dark:bg-black/20 shadow-inner' : 'bg-neutral-100 dark:bg-neutral-800'}
                    `}>
                      <CategoryIllustration categoryKey={category.key} isSelected={isSelected} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={`
                            text-xl sm:text-2xl font-semibold tracking-tight transition-colors duration-300
                            ${isSelected ? catConfig.accentColor : 'text-neutral-900 dark:text-neutral-50'}
                          `}>
                            {language === 'ka' ? category.nameKa : category.name}
                          </h3>
                          <p className={`
                            mt-1 text-sm font-medium transition-colors duration-300
                            ${isSelected ? catConfig.accentColor + ' opacity-70' : 'text-neutral-400 dark:text-neutral-500'}
                          `}>
                            {language === 'ka' ? catConfig.tagline.ka : catConfig.tagline.en}
                          </p>
                        </div>

                        {/* Selected Indicator */}
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                          ${isSelected
                            ? `bg-gradient-to-br ${catConfig.gradient} shadow-lg`
                            : 'bg-neutral-200 dark:bg-neutral-700 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-600'}
                        `}>
                          {isSelected ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {language === 'ka' ? category.descriptionKa : category.description}
                      </p>

                      {/* Expand indicator */}
                      {isSelected && (
                        <div className={`flex items-center gap-2 mt-4 text-sm font-medium ${catConfig.accentColor}`}>
                          <span>{language === 'ka' ? 'აირჩიეთ სპეციალისტი' : 'Choose a specialist'}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Specialties Panel */}
              <div className={`
                overflow-hidden transition-all duration-500 ease-out
                ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
              `}>
                <div className={`p-6 pt-0 ${catConfig.bgColor}`}>
                  <div className="pt-4 border-t border-neutral-200/50 dark:border-neutral-700/50">
                    {/* Specialty Pills */}
                    <div className="flex flex-wrap gap-2">
                      {catSpecialties.map((specialty) => {
                        const isSpecSelected = selectedSpecialties.includes(specialty.value);
                        return (
                          <button
                            key={specialty.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSpecialtyToggle(specialty.value);
                            }}
                            className={`
                              px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                              ${isSpecSelected
                                ? `bg-gradient-to-r ${catConfig.gradient} text-white shadow-lg scale-105`
                                : 'bg-white/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:scale-102 shadow-sm'
                              }
                            `}
                          >
                            <span className="flex items-center gap-2">
                              {isSpecSelected && <Check className="w-4 h-4" />}
                              {language === 'ka' ? specialty.labelKa : specialty.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Specialties */}
                    {customSpecialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {customSpecialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {specialty}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveCustomSpecialty(specialty);
                              }}
                              className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add Custom */}
                    <div className="mt-4">
                      {!showCustomInput ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCustomInput(true);
                          }}
                          disabled={customSpecialties.length >= 5}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                          {language === 'ka' ? 'სხვა სპეციალობა' : 'Other specialty'}
                        </button>
                      ) : (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex-1 relative">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                            <input
                              type="text"
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder={language === 'ka' ? 'სპეციალობა...' : 'Specialty...'}
                              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-neutral-100"
                              maxLength={50}
                              autoFocus
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddCustom}
                            disabled={!customInput.trim()}
                            className="px-4 py-2.5 rounded-full font-medium text-sm text-white bg-gradient-to-r from-amber-400 to-orange-500 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomInput(false);
                              setCustomInput('');
                            }}
                            className="px-3 py-2.5 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedCategory && (selectedSpecialties.length > 0 || customSpecialties.length > 0) && config && (
        <div className="max-w-4xl mx-auto animate-fadeIn">
          <div className={`
            p-5 rounded-2xl border-2 ${config.borderColor} ${config.bgColor}
            flex flex-col sm:flex-row items-start sm:items-center gap-4
          `}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.gradient} shadow-lg`}>
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {language === 'ka' ? 'მზადაა გასაგრძელებლად' : 'Ready to continue'}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {selectedSpecialties.length + customSpecialties.length} {language === 'ka' ? 'სპეციალობა არჩეულია' : 'specialties selected'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...selectedSpecialties, ...customSpecialties].slice(0, 4).map((spec, idx) => {
                const found = specialties.find(s => s.value === spec);
                const label = found ? (language === 'ka' ? found.labelKa : found.label) : spec;
                return (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-sm"
                  >
                    {label}
                  </span>
                );
              })}
              {(selectedSpecialties.length + customSpecialties.length) > 4 && (
                <span className="px-3 py-1.5 text-xs font-medium text-neutral-500">
                  +{(selectedSpecialties.length + customSpecialties.length) - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
