export interface Subcategory {
  key: string;
  name: string;
  nameKa: string;
  /** Search keywords/aliases for better search - both English and Georgian */
  keywords?: string[];
}

export interface CategoryDefinition {
  key: string;
  name: string;
  nameKa: string;
  description: string;
  descriptionKa: string;
  icon: string;
  /** Search keywords/aliases for the category */
  keywords?: string[];
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
    keywords: ['design', 'დიზაინი', 'პროექტი', 'project'],
    subcategories: [
      { key: 'interior', name: 'Interior Design', nameKa: 'ინტერიერი', keywords: ['შიდა', 'ბინა', 'ოთახი', 'სახლი', 'apartment', 'room', 'home', 'indoor'] },
      { key: 'exterior', name: 'Exterior Design', nameKa: 'ექსტერიერი', keywords: ['გარე', 'ფასადი', 'facade', 'outdoor', 'outside'] },
      { key: 'landscape-design', name: 'Landscape Design', nameKa: 'ლანდშაფტის დიზაინი', keywords: ['ბაღი', 'ეზო', 'გამწვანება', 'garden', 'yard', 'landscaping', 'plants'] },
      { key: '3d-visualization', name: '3D Visualization', nameKa: '3D ვიზუალიზაცია', keywords: ['რენდერი', 'render', 'modeling', 'მოდელირება', 'visualize'] },
      { key: 'furniture-design', name: 'Furniture Design', nameKa: 'ავეჯის დიზაინი', keywords: ['მაგიდა', 'სკამი', 'კარადა', 'საწოლი', 'table', 'chair', 'cabinet', 'bed', 'sofa', 'დივანი'] },
    ],
  },
  {
    key: 'architecture',
    name: 'Architect',
    nameKa: 'არქიტექტორი',
    description: 'Architects and structural engineers',
    descriptionKa: 'არქიტექტორები და კონსტრუქტორები',
    icon: 'architect',
    keywords: ['კონსტრუქცია', 'შენობა', 'building', 'construction', 'პროექტი', 'project'],
    subcategories: [
      { key: 'residential-arch', name: 'Residential', nameKa: 'საცხოვრებელი', keywords: ['სახლი', 'ბინა', 'კოტეჯი', 'house', 'apartment', 'cottage', 'villa', 'ვილა'] },
      { key: 'commercial-arch', name: 'Commercial', nameKa: 'კომერციული', keywords: ['ოფისი', 'მაღაზია', 'office', 'shop', 'store', 'business', 'ბიზნესი'] },
      { key: 'industrial-arch', name: 'Industrial', nameKa: 'სამრეწველო', keywords: ['ქარხანა', 'საწარმო', 'factory', 'warehouse', 'საწყობი'] },
      { key: 'reconstruction', name: 'Reconstruction', nameKa: 'რეკონსტრუქცია', keywords: ['რემონტი', 'აღდგენა', 'renovation', 'restore', 'rebuild', 'გადაკეთება'] },
      { key: 'project-documentation', name: 'Project Documentation', nameKa: 'საპროექტო დოკუმენტაცია', keywords: ['ნახაზი', 'გეგმა', 'drawing', 'plan', 'blueprint', 'documentation', 'ნებართვა', 'permit'] },
    ],
  },
  {
    key: 'craftsmen',
    name: 'Craftsmen',
    nameKa: 'ხელოსანი',
    description: 'Skilled tradespeople',
    descriptionKa: 'კვალიფიციური ხელოსნები',
    icon: 'craftsmen',
    keywords: ['რემონტი', 'repair', 'fix', 'შეკეთება', 'მონტაჟი', 'installation'],
    subcategories: [
      { key: 'electrical', name: 'Electrician', nameKa: 'ელექტრიკოსი', keywords: ['დენი', 'კაბელი', 'გაყვანილობა', 'ჩამრთველი', 'როზეტი', 'electricity', 'wire', 'wiring', 'socket', 'switch', 'light', 'განათება', 'ლუსტრა'] },
      { key: 'plumbing', name: 'Plumber', nameKa: 'სანტექნიკოსი', keywords: ['წყალი', 'მილი', 'ონკანი', 'უნიტაზი', 'აბაზანა', 'შხაპი', 'კანალიზაცია', 'water', 'pipe', 'faucet', 'toilet', 'bathroom', 'shower', 'sink', 'ნიჟარა', 'წყალგაყვანილობა'] },
      { key: 'painting', name: 'Painter', nameKa: 'მხატვარი', keywords: ['საღებავი', 'შპაკლი', 'კედელი', 'ჭერი', 'paint', 'wall', 'ceiling', 'color', 'ფერი', 'შეღებვა', 'მოხატვა'] },
      { key: 'tiling', name: 'Tiler', nameKa: 'მოკაფელე', keywords: ['კაფელი', 'ფილა', 'მეტლახი', 'tile', 'ceramic', 'კერამიკა', 'აბაზანა', 'სამზარეულო', 'bathroom', 'kitchen', 'გრანიტი', 'მარმარილო', 'granite', 'marble'] },
      { key: 'flooring', name: 'Flooring', nameKa: 'იატაკის სპეციალისტი', keywords: ['იატაკი', 'პარკეტი', 'ლამინატი', 'ხე', 'floor', 'parquet', 'laminate', 'wood', 'hardwood', 'linoleum', 'ლინოლეუმი', 'carpet', 'ხალიჩა', 'მოპირკეთება'] },
      { key: 'plastering', name: 'Plasterer', nameKa: 'მლესავი', keywords: ['ლესვა', 'შპაკლი', 'თაბაშირი', 'ბათქაში', 'plaster', 'stucco', 'drywall', 'გიფსოკარდონი', 'თაბაშირმუყაო', 'კედელი', 'wall'] },
      { key: 'carpentry', name: 'Carpenter', nameKa: 'დურგალი', keywords: ['ხე', 'კარი', 'ფანჯარა', 'ავეჯი', 'wood', 'door', 'window', 'furniture', 'cabinet', 'კარადა', 'თარო', 'shelf', 'ხის სამუშაო'] },
      { key: 'welding', name: 'Welder', nameKa: 'შემდუღებელი', keywords: ['რკინა', 'ლითონი', 'კარიბჭე', 'მოაჯირი', 'metal', 'iron', 'steel', 'gate', 'fence', 'ღობე', 'კიბე', 'stairs', 'welding'] },
      { key: 'hvac', name: 'HVAC', nameKa: 'გათბობა/გაგრილება', keywords: ['გათბობა', 'კონდიციონერი', 'ვენტილაცია', 'რადიატორი', 'ქვაბი', 'heating', 'cooling', 'air conditioning', 'AC', 'ventilation', 'radiator', 'boiler', 'იატაკის გათბობა'] },
      { key: 'roofing', name: 'Roofer', nameKa: 'გადამხურავი', keywords: ['სახურავი', 'ჭერი', 'კრამიტი', 'თუნუქი', 'roof', 'rooftop', 'tile', 'shingle', 'გადახურვა', 'იზოლაცია', 'insulation', 'წვიმა', 'rain', 'leak', 'გაჟონვა'] },
    ],
  },
  {
    key: 'home-care',
    name: 'Services',
    nameKa: 'სერვისები',
    description: 'Home services and maintenance',
    descriptionKa: 'სახლის მომსახურება და მოვლა',
    icon: 'homecare',
    keywords: ['მომსახურება', 'service', 'მოვლა', 'care', 'maintenance'],
    subcategories: [
      { key: 'cleaning', name: 'Cleaning', nameKa: 'დალაგება', keywords: ['სისუფთავე', 'წმენდა', 'დამლაგებელი', 'clean', 'cleaner', 'housekeeping', 'მტვერი', 'dust', 'სანიტარია'] },
      { key: 'moving', name: 'Moving', nameKa: 'გადაზიდვა', keywords: ['ტვირთი', 'გადატანა', 'მოვერი', 'move', 'mover', 'transport', 'ტრანსპორტი', 'ავეჯის გადატანა', 'furniture'] },
      { key: 'gardening', name: 'Gardening', nameKa: 'მებაღეობა', keywords: ['ბაღი', 'მცენარე', 'ეზო', 'ბალახი', 'garden', 'plant', 'yard', 'lawn', 'grass', 'tree', 'ხე', 'გასხვლა', 'pruning'] },
      { key: 'appliance-repair', name: 'Appliance Repair', nameKa: 'ტექნიკის შეკეთება', keywords: ['მაცივარი', 'სარეცხი', 'ღუმელი', 'ჩაშენებული', 'fridge', 'refrigerator', 'washer', 'oven', 'dishwasher', 'ჭურჭლის სარეცხი', 'appliance', 'ტექნიკა'] },
      { key: 'pest-control', name: 'Pest Control', nameKa: 'დეზინსექცია', keywords: ['მწერი', 'ტარაკანი', 'თაგვი', 'pest', 'insect', 'cockroach', 'mouse', 'rat', 'ვირთხა', 'დეზინფექცია', 'disinfection'] },
      { key: 'window-cleaning', name: 'Window Cleaning', nameKa: 'ფანჯრების წმენდა', keywords: ['ფანჯარა', 'მინა', 'შუშა', 'window', 'glass', 'ალპინისტი', 'მაღალი', 'high-rise'] },
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
