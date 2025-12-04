export interface Subcategory {
  key: string;
  name: string;
  nameKa: string;
}

export interface CategoryDefinition {
  key: string;
  name: string;
  nameKa: string;
  description: string;
  descriptionKa: string;
  icon: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    key: 'interior-design',
    name: 'Designer',
    nameKa: 'დიზაინერი',
    description: 'Interior and exterior designers',
    descriptionKa: 'ინტერიერისა და ექსტერიერის დიზაინერები',
    icon: 'designer',
    subcategories: [
      { key: 'interior', name: 'Interior Design', nameKa: 'ინტერიერი' },
      { key: 'exterior', name: 'Exterior Design', nameKa: 'ექსტერიერი' },
      { key: 'landscape-design', name: 'Landscape Design', nameKa: 'ლანდშაფტის დიზაინი' },
      { key: '3d-visualization', name: '3D Visualization', nameKa: '3D ვიზუალიზაცია' },
      { key: 'furniture-design', name: 'Furniture Design', nameKa: 'ავეჯის დიზაინი' },
    ],
  },
  {
    key: 'architecture',
    name: 'Architect',
    nameKa: 'არქიტექტორი',
    description: 'Architects and structural engineers',
    descriptionKa: 'არქიტექტორები და კონსტრუქტორები',
    icon: 'architect',
    subcategories: [
      { key: 'residential-arch', name: 'Residential', nameKa: 'საცხოვრებელი' },
      { key: 'commercial-arch', name: 'Commercial', nameKa: 'კომერციული' },
      { key: 'industrial-arch', name: 'Industrial', nameKa: 'სამრეწველო' },
      { key: 'reconstruction', name: 'Reconstruction', nameKa: 'რეკონსტრუქცია' },
      { key: 'project-documentation', name: 'Project Documentation', nameKa: 'საპროექტო დოკუმენტაცია' },
    ],
  },
  {
    key: 'craftsmen',
    name: 'Craftsmen',
    nameKa: 'ხელოსანი',
    description: 'Skilled tradespeople',
    descriptionKa: 'კვალიფიციური ხელოსნები',
    icon: 'craftsmen',
    subcategories: [
      { key: 'electrical', name: 'Electrician', nameKa: 'ელექტრიკოსი' },
      { key: 'plumbing', name: 'Plumber', nameKa: 'სანტექნიკოსი' },
      { key: 'painting', name: 'Painter', nameKa: 'მხატვარი' },
      { key: 'tiling', name: 'Tiler', nameKa: 'მოკაფელე' },
      { key: 'flooring', name: 'Flooring', nameKa: 'იატაკის სპეციალისტი' },
      { key: 'plastering', name: 'Plasterer', nameKa: 'მლესავი' },
      { key: 'carpentry', name: 'Carpenter', nameKa: 'დურგალი' },
      { key: 'welding', name: 'Welder', nameKa: 'შემდუღებელი' },
      { key: 'hvac', name: 'HVAC', nameKa: 'გათბობა/გაგრილება' },
      { key: 'roofing', name: 'Roofer', nameKa: 'გადამხურავი' },
    ],
  },
  {
    key: 'home-care',
    name: 'Services',
    nameKa: 'სერვისები',
    description: 'Home services and maintenance',
    descriptionKa: 'სახლის მომსახურება და მოვლა',
    icon: 'homecare',
    subcategories: [
      { key: 'cleaning', name: 'Cleaning', nameKa: 'დალაგება' },
      { key: 'moving', name: 'Moving', nameKa: 'გადაზიდვა' },
      { key: 'gardening', name: 'Gardening', nameKa: 'მებაღეობა' },
      { key: 'appliance-repair', name: 'Appliance Repair', nameKa: 'ტექნიკის შეკეთება' },
      { key: 'pest-control', name: 'Pest Control', nameKa: 'დეზინსექცია' },
      { key: 'window-cleaning', name: 'Window Cleaning', nameKa: 'ფანჯრების წმენდა' },
    ],
  },
];

export const getCategoryByKey = (key: string): CategoryDefinition | undefined => {
  return CATEGORIES.find(cat => cat.key === key);
};

export const getSubcategoriesForCategory = (categoryKey: string): Subcategory[] => {
  const category = getCategoryByKey(categoryKey);
  return category?.subcategories || [];
};

export const getAllSubcategoryKeys = (): string[] => {
  return CATEGORIES.flatMap(cat => cat.subcategories.map(sub => sub.key));
};
