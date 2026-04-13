/**
 * Per-subcategory configuration for UI customization across the platform.
 * Used by: profile setup, invite SMS, admin panel, public profiles, etc.
 *
 * Usage:
 *   import { getSubcategoryConfig } from '@/constants/subcategoryConfig';
 *   const config = getSubcategoryConfig('plumbing');
 *   // config.skills.placeholder.ka → "მაგ: წყლის მილების მონტაჟი"
 */

export interface SubcategoryConfig {
  key: string;
  bio: {
    placeholder: { en: string; ka: string; ru: string };
  };
  skills: {
    description: { en: string; ka: string; ru: string };
    placeholder: { en: string; ka: string; ru: string };
    suggestions: string[]; // Pre-defined skill suggestions (Georgian)
  };
  sms: {
    template: { ka: string }; // Georgian SMS template — {name} and {url} are interpolated
  };
  pricing: {
    unit: { en: string; ka: string; ru: string }; // e.g. "per m²", "per hour"
    showSquareMeters?: boolean;
  };
  portfolio: {
    description: { en: string; ka: string; ru: string };
  };
}

type Localized = { en: string; ka: string; ru: string };

const l = (en: string, ka: string, ru: string): Localized => ({ en, ka, ru });

const SUBCATEGORY_CONFIGS: Record<string, SubcategoryConfig> = {
  // ── RENOVATION ──────────────────────────

  plumbing: {
    key: "plumbing",
    bio: {
      placeholder: l(
        "e.g.: I am a plumber with 10 years of experience in Tbilisi, I do heating, plumbing and drainage...",
        "მაგ: სანტექნიკი ვარ 10 წლის გამოცდილებით, ვმუშაობ თბილისში, ვაკეთებ გათბობას, წყალგაყვანილობას და კანალიზაციას...",
        "напр.: Сантехник с 10-летним опытом в Тбилиси, занимаюсь отоплением, водоснабжением и канализацией...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: pipe installation, leak repair",
        "დაამატეთ უნარები, მაგ: მილების მონტაჟი, გაჟონვის შეკეთება",
        "Добавьте навыки, напр.: монтаж труб, устранение протечек",
      ),
      placeholder: l(
        "e.g. pipe installation...",
        "მაგ: მილების მონტაჟი...",
        "напр. монтаж труб...",
      ),
      suggestions: [
        "მილების მონტაჟი",
        "გაჟონვის შეკეთება",
        "ონკანის შეცვლა",
        "კანალიზაცია",
        "წყალგაყვანილობა",
        "გათბობის სისტემა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე კლიენტები სანტექნიკს ეძებენ. თქვენი პროფილი მზადაა — გააქტიურეთ და მიიღეთ შეკვეთები: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show your plumbing work — before & after photos",
        "აჩვენეთ სანტექნიკური სამუშაოები — სურათები",
        "Покажите сантехнические работы — фото до и после",
      ),
    },
  },

  electricity: {
    key: "electricity",
    bio: {
      placeholder: l(
        "e.g.: Electrician with 8 years experience, wiring, panels, lighting...",
        "მაგ: ელექტრიკი ვარ 8 წლის გამოცდილებით, ვაკეთებ გაყვანილობას, ავტომატებს, განათებას...",
        "напр.: Электрик с 8-летним опытом, проводка, автоматы, освещение...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: wiring, panel installation",
        "დაამატეთ უნარები, მაგ: გაყვანილობა, ავტომატების მონტაჟი",
        "Добавьте навыки, напр.: проводка, установка автоматов",
      ),
      placeholder: l(
        "e.g. wiring...",
        "მაგ: გაყვანილობა...",
        "напр. проводка...",
      ),
      suggestions: [
        "გაყვანილობა",
        "ავტომატების მონტაჟი",
        "განათების მონტაჟი",
        "როზეტების დაყენება",
        "ელექტრო პანელი",
        "მოკლე შერთვის შეკეთება",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ელექტრიკოსის მოთხოვნა მაღალია. გააქტიურეთ პროფილი და დაიწყეთ შეკვეთების მიღება: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show your electrical work",
        "აჩვენეთ ელექტრო სამუშაოები",
        "Покажите электромонтажные работы",
      ),
    },
  },

  mural: {
    key: "mural",
    bio: {
      placeholder: l(
        "e.g.: Painter with 5 years experience, wallpaper, putty, decorative painting...",
        "მაგ: მალიარი ვარ 5 წლის გამოცდილებით, ვაკეთებ შპალერს, ფითხვას, დეკორატიულ შეღებვას...",
        "напр.: Маляр с 5-летним опытом, обои, шпаклёвка, декоративная покраска...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: wallpaper, painting, putty",
        "დაამატეთ უნარები, მაგ: შპალერის გაკვრა, ფითხვა, შეღებვა",
        "Добавьте навыки, напр.: обои, покраска, шпаклёвка",
      ),
      placeholder: l(
        "e.g. wallpaper...",
        "მაგ: შპალერის გაკვრა...",
        "напр. обои...",
      ),
      suggestions: [
        "შპალერის გაკვრა",
        "ფითხვა",
        "შეღებვა",
        "დეკორატიული მალიარი",
        "ფასადის შეღებვა",
        "ანტიკორუზიული დაფარვა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, კლიენტები Homico-ზე მხატვარ-მალიარს ეძებენ. თქვენი პროფილი მზადაა: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show painting & wallpaper projects",
        "აჩვენეთ სამალიარო სამუშაოები",
        "Покажите малярные работы",
      ),
    },
  },

  tiling: {
    key: "tiling",
    bio: {
      placeholder: l(
        "e.g.: Tile worker with 7 years experience, floor and wall tiles, mosaic...",
        "მაგ: კაფელ-მეტლახის ოსტატი ვარ 7 წლის გამოცდილებით, იატაკი და კედელი...",
        "напр.: Плиточник с 7-летним опытом, напольная и настенная плитка, мозаика...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: floor tiles, wall tiles, mosaic",
        "დაამატეთ უნარები, მაგ: იატაკის კაფელი, კედლის კაფელი, მოზაიკა",
        "Добавьте навыки, напр.: напольная плитка, мозаика",
      ),
      placeholder: l(
        "e.g. floor tiles...",
        "მაგ: იატაკის კაფელი...",
        "напр. напольная плитка...",
      ),
      suggestions: [
        "იატაკის კაფელი",
        "კედლის კაფელი",
        "მოზაიკა",
        "გრანიტი",
        "მარმარილო",
        "კაფელის ჭრა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, კლიენტები Homico-ზე კაფელ-მეტლახის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your tiling projects",
        "აჩვენეთ კაფელ-მეტლახის სამუშაოები",
        "Покажите плиточные работы",
      ),
    },
  },

  flooring: {
    key: "flooring",
    bio: {
      placeholder: l(
        "e.g.: Flooring specialist, laminate, parquet, screed, 6 years experience...",
        "მაგ: იატაკის ოსტატი ვარ 6 წლის გამოცდილებით, ლამინატი, პარკეტი, სტიაშკა...",
        "напр.: Специалист по полам с 6-летним опытом, ламинат, паркет, стяжка...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: laminate, parquet, screed",
        "დაამატეთ უნარები, მაგ: ლამინატი, პარკეტი, სტიაშკა",
        "Добавьте навыки, напр.: ламинат, паркет, стяжка",
      ),
      placeholder: l(
        "e.g. laminate...",
        "მაგ: ლამინატი...",
        "напр. ламинат...",
      ),
      suggestions: [
        "ლამინატი",
        "პარკეტი",
        "სტიაშკა",
        "ციკლოვკა",
        "ხის იატაკი",
        "ეპოქსიდი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე იატაკის ოსტატს ეძებენ. თქვენი პროფილი მზადაა: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your flooring projects",
        "აჩვენეთ იატაკის სამუშაოები",
        "Покажите работы по полам",
      ),
    },
  },

  plastering: {
    key: "plastering",
    bio: {
      placeholder: l(
        "e.g.: Plasterer with 10 years experience, interior and exterior...",
        "მაგ: მლესავი ვარ 10 წლის გამოცდილებით, შიდა და გარე ლესვა...",
        "напр.: Штукатур с 10-летним опытом, внутренняя и наружная штукатурка...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: interior plastering, decorative plaster",
        "დაამატეთ უნარები, მაგ: შიდა ლესვა, დეკორატიული ლესვა",
        "Добавьте навыки, напр.: внутренняя штукатурка, декоративная",
      ),
      placeholder: l(
        "e.g. plastering...",
        "მაგ: შიდა ლესვა...",
        "напр. штукатурка...",
      ),
      suggestions: [
        "შიდა ლესვა",
        "გარე ლესვა",
        "დეკორატიული ლესვა",
        "ბრიზგი",
        "ატკოსების ლესვა",
        "მანქანური ლესვა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე სათიხი/ლესვის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your plastering work",
        "აჩვენეთ ლესვის სამუშაოები",
        "Покажите штукатурные работы",
      ),
    },
  },

  roofing: {
    key: "roofing",
    bio: {
      placeholder: l(
        "e.g.: Roofer with 8 years experience, metal roofing, waterproofing...",
        "მაგ: სახურავის ოსტატი ვარ 8 წლის გამოცდილებით, ტოლი, ჰიდროიზოლაცია...",
        "напр.: Кровельщик с 8-летним опытом, металлическая кровля, гидроизоляция...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: metal roof, waterproofing",
        "დაამატეთ უნარები, მაგ: ტოლით გადახურვა, ჰიდროიზოლაცია",
        "Добавьте навыки, напр.: металлическая кровля, гидроизоляция",
      ),
      placeholder: l(
        "e.g. metal roof...",
        "მაგ: ტოლით გადახურვა...",
        "напр. металлическая кровля...",
      ),
      suggestions: [
        "ტოლით გადახურვა",
        "ჰიდროიზოლაცია",
        "თბოიზოლაცია",
        "სახურავის შეკეთება",
        "ტერასის გადახურვა",
        "მეტალოჩერეპიცა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე სახურავის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your roofing projects",
        "აჩვენეთ სახურავის სამუშაოები",
        "Покажите кровельные работы",
      ),
    },
  },

  hvac: {
    key: "hvac",
    bio: {
      placeholder: l(
        "e.g.: HVAC specialist, AC installation and heating systems, 5 years...",
        "მაგ: კონდიციონერის და გათბობის ოსტატი ვარ 5 წლის გამოცდილებით...",
        "напр.: Специалист по кондиционерам и отоплению с 5-летним опытом...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: AC installation, heating systems",
        "დაამატეთ უნარები, მაგ: კონდიციონერის მონტაჟი, გათბობის სისტემა",
        "Добавьте навыки, напр.: монтаж кондиционера, отопление",
      ),
      placeholder: l(
        "e.g. AC installation...",
        "მაგ: კონდიციონერის მონტაჟი...",
        "напр. монтаж кондиционера...",
      ),
      suggestions: [
        "კონდიციონერის მონტაჟი",
        "გათბობის სისტემა",
        "რადიატორის მონტაჟი",
        "იატაკის გათბობა",
        "ვენტილაცია",
        "კონდიციონერის შეკეთება",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე კონდიციონერის/გათბობის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per unit", "ერთეულზე", "за единицу"),
    },
    portfolio: {
      description: l(
        "Show HVAC installations",
        "აჩვენეთ გათბობა/გაგრილების სამუშაოები",
        "Покажите работы по HVAC",
      ),
    },
  },

  iron: {
    key: "iron",
    bio: {
      placeholder: l(
        "e.g.: Welder and metalworker, gates, railings, stairs, 10 years...",
        "მაგ: შემდუღებელი და ლითონის ოსტატი ვარ 10 წლის გამოცდილებით, კარი, მოაჯირი...",
        "напр.: Сварщик и металлист с 10-летним опытом, ворота, перила, лестницы...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: welding, metal gates, railings",
        "დაამატეთ უნარები, მაგ: შედუღება, ლითონის კარი, მოაჯირი",
        "Добавьте навыки, напр.: сварка, металлические ворота, перила",
      ),
      placeholder: l("e.g. welding...", "მაგ: შედუღება...", "напр. сварка..."),
      suggestions: [
        "შედუღება",
        "ლითონის კარი",
        "მოაჯირი",
        "ღობე",
        "არგონის სვარკა",
        "ლითონის კიბე",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე შემდუღებლის მოთხოვნა მაღალია. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show your metalwork projects",
        "აჩვენეთ ლითონის სამუშაოები",
        "Покажите работы по металлу",
      ),
    },
  },

  woodwork: {
    key: "woodwork",
    bio: {
      placeholder: l(
        "e.g.: Carpenter, custom furniture and restoration, 8 years...",
        "მაგ: დურგალი ვარ 8 წლის გამოცდილებით, ავეჯის დამზადება და რესტავრაცია...",
        "напр.: Столяр с 8-летним опытом, мебель на заказ и реставрация...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: custom furniture, restoration",
        "დაამატეთ უნარები, მაგ: ავეჯის დამზადება, რესტავრაცია",
        "Добавьте навыки, напр.: мебель на заказ, реставрация",
      ),
      placeholder: l(
        "e.g. custom furniture...",
        "მაგ: ავეჯის დამზადება...",
        "напр. мебель на заказ...",
      ),
      suggestions: [
        "ავეჯის დამზადება",
        "ავეჯის რესტავრაცია",
        "ხის კარი",
        "ხის კიბე",
        "ჩაშენებული კარადა",
        "სამზარეულო",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე დურგალს ეძებენ. გააქტიურეთ პროფილი და მიიღეთ შეკვეთები: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show your woodwork projects",
        "აჩვენეთ ხის სამუშაოები",
        "Покажите работы по дереву",
      ),
    },
  },

  glasswork: {
    key: "glasswork",
    bio: {
      placeholder: l(
        "e.g.: Glass worker, partitions, mirrors, shower cabins...",
        "მაგ: მინის ოსტატი ვარ, ვაკეთებ ტიხრებს, სარკეებს, შხაპკაბინებს...",
        "напр.: Стекольщик, перегородки, зеркала, душевые кабины...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: glass partitions, mirrors, shower cabins",
        "დაამატეთ უნარები, მაგ: მინის ტიხრები, სარკეები, შხაპკაბინა",
        "Добавьте навыки, напр.: стеклянные перегородки, зеркала",
      ),
      placeholder: l(
        "e.g. glass partitions...",
        "მაგ: მინის ტიხრები...",
        "напр. стеклянные перегородки...",
      ),
      suggestions: [
        "მინის ტიხრები",
        "სარკეები",
        "შხაპკაბინა",
        "ფასადის მოჭიქვა",
        "მინის კარი",
        "ვიტრაჟი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე მინის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your glass work",
        "აჩვენეთ მინის სამუშაოები",
        "Покажите стекольные работы",
      ),
    },
  },

  tile: {
    key: "tile",
    bio: {
      placeholder: l(
        "e.g.: Ceiling specialist, stretch ceilings, drywall, armstrong...",
        "მაგ: ჭერის ოსტატი ვარ, გასაჭიმი ჭერი, გიფსოკარდონი, ამსტრონგი...",
        "напр.: Специалист по потолкам, натяжные, гипсокартон, армстронг...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: stretch ceiling, drywall, armstrong",
        "დაამატეთ უნარები, მაგ: გასაჭიმი ჭერი, გიფსოკარდონი, ამსტრონგი",
        "Добавьте навыки, напр.: натяжной потолок, гипсокартон",
      ),
      placeholder: l(
        "e.g. stretch ceiling...",
        "მაგ: გასაჭიმი ჭერი...",
        "напр. натяжной потолок...",
      ),
      suggestions: [
        "გასაჭიმი ჭერი",
        "გიფსოკარდონი",
        "ამსტრონგი",
        "ხის ჭერი",
        "მრავალდონიანი ჭერი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ჭერის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your ceiling projects",
        "აჩვენეთ ჭერის სამუშაოები",
        "Покажите работы с потолками",
      ),
    },
  },

  demolition: {
    key: "demolition",
    bio: {
      placeholder: l(
        "e.g.: Demolition specialist, wall removal, concrete cutting...",
        "მაგ: დემონტაჟის სპეციალისტი ვარ, კედლის დანგრევა, ბეტონის ჭრა...",
        "напр.: Специалист по демонтажу, снос стен, резка бетона...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: wall demolition, concrete cutting",
        "დაამატეთ უნარები, მაგ: კედლის დანგრევა, ბეტონის ჭრა",
        "Добавьте навыки, напр.: снос стен, резка бетона",
      ),
      placeholder: l(
        "e.g. wall demolition...",
        "მაგ: კედლის დანგრევა...",
        "напр. снос стен...",
      ),
      suggestions: [
        "კედლის დანგრევა",
        "ბეტონის ჭრა",
        "ხვრეტა",
        "პერფორატორით სამუშაო",
        "იატაკის დემონტაჟი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, კლიენტები Homico-ზე დემონტაჟის სპეციალისტს ეძებენ. გააქტიურეთ: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show demolition projects",
        "აჩვენეთ დემონტაჟის სამუშაოები",
        "Покажите демонтажные работы",
      ),
    },
  },

  masonry: {
    key: "masonry",
    bio: {
      placeholder: l(
        "e.g.: Mason, brick and block walls, 10 years experience...",
        "მაგ: კედლის ოსტატი ვარ 10 წლის გამოცდილებით, აგური, ბლოკი...",
        "напр.: Каменщик с 10-летним опытом, кирпич, блоки...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: brick walls, block walls",
        "დაამატეთ უნარები, მაგ: აგურის წყობა, ბლოკის წყობა",
        "Добавьте навыки, напр.: кирпичная кладка, блоки",
      ),
      placeholder: l(
        "e.g. brick walls...",
        "მაგ: აგურის წყობა...",
        "напр. кирпичная кладка...",
      ),
      suggestions: [
        "აგურის წყობა",
        "ბლოკის წყობა",
        "კედლის აშენება",
        "ტიხარის აშენება",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე კედლის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your masonry work",
        "აჩვენეთ კედლის სამუშაოები",
        "Покажите кладочные работы",
      ),
    },
  },

  construction: {
    key: "construction",
    bio: {
      placeholder: l(
        "e.g.: Builder, house construction from foundation to roof...",
        "მაგ: მშენებელი ვარ, სახლის მშენებლობა საძირკვლიდან სახურავამდე...",
        "напр.: Строитель, возведение домов от фундамента до крыши...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: house building, foundation, framing",
        "დაამატეთ უნარები, მაგ: სახლის მშენებლობა, საძირკველი, კარკასი",
        "Добавьте навыки, напр.: строительство дома, фундамент",
      ),
      placeholder: l(
        "e.g. house building...",
        "მაგ: სახლის მშენებლობა...",
        "напр. строительство дома...",
      ),
      suggestions: [
        "სახლის მშენებლობა",
        "საძირკველი",
        "კარკასი",
        "ბლოკის წყობა",
        "არმატურა",
        "სახლის პროექტი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე მშენებლობის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your construction projects",
        "აჩვენეთ მშენებლობის სამუშაოები",
        "Покажите строительные работы",
      ),
    },
  },

  "doors-windows": {
    key: "doors-windows",
    bio: {
      placeholder: l(
        "e.g.: Door and window installer, metal-plastic, blinds...",
        "მაგ: კარ-ფანჯრის ოსტატი ვარ, მეტალოპლასტმასი, ჟალუზი...",
        "напр.: Установщик дверей и окон, металлопластик, жалюзи...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: door installation, window frames",
        "დაამატეთ უნარები, მაგ: კარის მონტაჟი, ფანჯრის ჩარჩო",
        "Добавьте навыки, напр.: установка дверей, оконные рамы",
      ),
      placeholder: l(
        "e.g. door installation...",
        "მაგ: კარის მონტაჟი...",
        "напр. установка дверей...",
      ),
      suggestions: [
        "კარის მონტაჟი",
        "ფანჯრის მონტაჟი",
        "მეტალოპლასტმასი",
        "ჟალუზი",
        "კარის შეკეთება",
        "საკეტის შეცვლა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე კარ-ფანჯრის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per unit", "ერთეულზე", "за единицу"),
    },
    portfolio: {
      description: l(
        "Show your door & window installations",
        "აჩვენეთ კარ-ფანჯრის სამუშაოები",
        "Покажите работы по дверям и окнам",
      ),
    },
  },

  gas: {
    key: "gas",
    bio: {
      placeholder: l(
        "e.g.: Licensed gas worker, pipe installation, boiler setup...",
        "მაგ: ლიცენზირებული გაზის ოსტატი ვარ, მილების მონტაჟი, ქვაბი...",
        "напр.: Лицензированный газовщик, монтаж труб, установка котлов...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: gas pipe installation, boiler setup",
        "დაამატეთ უნარები, მაგ: გაზის მილების მონტაჟი, ქვაბის დაყენება",
        "Добавьте навыки, напр.: газовые трубы, установка котла",
      ),
      placeholder: l(
        "e.g. gas pipes...",
        "მაგ: გაზის მილები...",
        "напр. газовые трубы...",
      ),
      suggestions: [
        "გაზის მილების მონტაჟი",
        "ქვაბის მონტაჟი",
        "გაზქურის შეერთება",
        "გაზის ლიცენზია",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე გაზის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show your gas work projects",
        "აჩვენეთ გაზის სამუშაოები",
        "Покажите газовые работы",
      ),
    },
  },

  fireplace: {
    key: "fireplace",
    bio: {
      placeholder: l(
        "e.g.: Fireplace builder and chimney specialist, 8 years...",
        "მაგ: ბუხრის ოსტატი ვარ 8 წლის გამოცდილებით, აშენება და გაწმენდა...",
        "напр.: Специалист по каминам и дымоходам с 8-летним опытом...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: fireplace building, chimney repair",
        "დაამატეთ უნარები, მაგ: ბუხრის აშენება, საკვამურის შეკეთება",
        "Добавьте навыки, напр.: кладка камина, ремонт дымохода",
      ),
      placeholder: l(
        "e.g. fireplace...",
        "მაგ: ბუხრის აშენება...",
        "напр. кладка камина...",
      ),
      suggestions: [
        "ბუხრის აშენება",
        "საკვამურის გაწმენდა",
        "ბუხრის მოპირკეთება",
        "საკვამურის შეკეთება",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ბუხრის ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show your fireplace projects",
        "აჩვენეთ ბუხრის სამუშაოები",
        "Покажите работы по каминам",
      ),
    },
  },

  measurement: {
    key: "measurement",
    bio: {
      placeholder: l(
        "e.g.: Measurement specialist, floor plans, laser measurement...",
        "მაგ: აზომვის სპეციალისტი ვარ, გეგმარების ნახაზები, ლაზერული აზომვა...",
        "напр.: Специалист по замерам, планировки, лазерные замеры...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: floor plans, laser measurement",
        "დაამატეთ უნარები, მაგ: გეგმარების ნახაზი, ლაზერული აზომვა",
        "Добавьте навыки, напр.: планировки, лазерные замеры",
      ),
      placeholder: l(
        "e.g. floor plans...",
        "მაგ: გეგმარების ნახაზი...",
        "напр. планировки...",
      ),
      suggestions: [
        "აზომვითი ნახაზი",
        "ლაზერული აზომვა",
        "დაკვალვა",
        "3D აზომვა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე აზომვის სპეციალისტს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show measurement samples",
        "აჩვენეთ აზომვის ნიმუშები",
        "Покажите примеры замеров",
      ),
    },
  },

  // ── DESIGN ──────────────────────────

  interior: {
    key: "interior",
    bio: {
      placeholder: l(
        "e.g.: Interior designer, 2D/3D projects, color schemes, furniture selection...",
        "მაგ: ინტერიერის დიზაინერი ვარ, ვაკეთებ 2D/3D პროექტებს, ფერთა სქემებს...",
        "напр.: Дизайнер интерьера, 2D/3D проекты, цветовые схемы, подбор мебели...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: 2D design, 3D visualization",
        "დაამატეთ უნარები, მაგალითად: ვაკეთებ 2D დიზაინს ან სხვა",
        "Добавьте навыки, напр.: 2D дизайн, 3D визуализация",
      ),
      placeholder: l(
        "e.g. 2D design...",
        "დაამატეთ სხვა უნარი...",
        "напр. 2D дизайн...",
      ),
      suggestions: [
        "2D დიზაინი",
        "3D ვიზუალიზაცია",
        "ფერთა სქემა",
        "ავეჯის შერჩევა",
        "განათების დიზაინი",
        "სამზარეულოს დიზაინი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ინტერიერის დიზაინერს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your design projects — renders, mood boards",
        "აჩვენეთ დიზაინის პროექტები — რენდერები, კონცეფცია",
        "Покажите дизайн-проекты — рендеры, мудборды",
      ),
    },
  },

  exterior: {
    key: "exterior",
    bio: {
      placeholder: l(
        "e.g.: Exterior designer, landscape, facade, terrace design...",
        "მაგ: ექსტერიერის დიზაინერი ვარ, ლანდშაფტი, ფასადი, ტერასის დიზაინი...",
        "напр.: Дизайнер экстерьера, ландшафт, фасады, дизайн террас...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: landscape design, facade design",
        "დაამატეთ უნარები, მაგ: ლანდშაფტის დიზაინი, ფასადის დიზაინი",
        "Добавьте навыки, напр.: ландшафтный дизайн, фасады",
      ),
      placeholder: l(
        "e.g. landscape...",
        "მაგ: ლანდშაფტის დიზაინი...",
        "напр. ландшафтный дизайн...",
      ),
      suggestions: [
        "ლანდშაფტის დიზაინი",
        "ფასადის დიზაინი",
        "ეზოს დაგეგმარება",
        "ტერასის დიზაინი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ექსტერიერის დიზაინერს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per project", "პროექტზე", "за проект"),
    },
    portfolio: {
      description: l(
        "Show exterior design projects",
        "აჩვენეთ ექსტერიერის პროექტები",
        "Покажите проекты экстерьера",
      ),
    },
  },

  // ── ARCHITECTURE ──────────────────────────

  "residential-architecture": {
    key: "residential-architecture",
    bio: {
      placeholder: l(
        "e.g.: Architect, residential projects, permits, 3D modeling...",
        "მაგ: არქიტექტორი ვარ, საცხოვრებელი პროექტები, ნებართვები, 3D მოდელირება...",
        "напр.: Архитектор, жилые проекты, разрешения, 3D моделирование...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: house design, floor plans, permits",
        "დაამატეთ უნარები, მაგ: სახლის პროექტი, გეგმარება, ნებართვა",
        "Добавьте навыки, напр.: проект дома, планировки, разрешения",
      ),
      placeholder: l(
        "e.g. house design...",
        "მაგ: სახლის პროექტი...",
        "напр. проект дома...",
      ),
      suggestions: [
        "სახლის პროექტი",
        "გეგმარება",
        "მშენებლობის ნებართვა",
        "3D მოდელი",
        "საინჟინრო პროექტი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე არქიტექტორს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your architectural projects",
        "აჩვენეთ არქიტექტურული პროექტები",
        "Покажите архитектурные проекты",
      ),
    },
  },

  // ── SERVICES ──────────────────────────

  cleaning: {
    key: "cleaning",
    bio: {
      placeholder: l(
        "e.g.: Professional cleaner, apartments, offices, post-renovation, 3 years...",
        "მაგ: პროფესიონალი დამლაგებელი ვარ, ბინები, ოფისები, რემონტის შემდგომი, 3 წელი...",
        "напр.: Профессиональный клинер, квартиры, офисы, после ремонта, 3 года...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: deep cleaning, post-renovation, window cleaning",
        "დაამატეთ უნარები, მაგ: გენერალური დალაგება, რემონტის შემდგომი, ფანჯრების წმენდა",
        "Добавьте навыки, напр.: генеральная уборка, после ремонта",
      ),
      placeholder: l(
        "e.g. deep cleaning...",
        "მაგ: გენერალური დალაგება...",
        "напр. генеральная уборка...",
      ),
      suggestions: [
        "გენერალური დალაგება",
        "რემონტის შემდგომი",
        "ფანჯრების წმენდა",
        "ოფისის დალაგება",
        "ავეჯის ქიმწმენდა",
        "ფასადის გაწმენდა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე კლიენტები დამლაგებელს ეძებენ. გააქტიურეთ პროფილი და მიიღეთ შეკვეთები: {url}",
      },
    },
    pricing: {
      unit: l("per visit", "ვიზიტზე", "за визит"),
    },
    portfolio: {
      description: l(
        "Show before & after cleaning results",
        "აჩვენეთ დალაგების შედეგები — მანამდე და შემდეგ",
        "Покажите результаты уборки — до и после",
      ),
    },
  },

  moving: {
    key: "moving",
    bio: {
      placeholder: l(
        "e.g.: Moving service, furniture transport, debris removal...",
        "მაგ: გადაზიდვის სერვისი, ავეჯის ტრანსპორტირება, ნაგვის გატანა...",
        "напр.: Грузоперевозки, транспортировка мебели, вывоз мусора...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: furniture moving, debris removal",
        "დაამატეთ უნარები, მაგ: ავეჯის გადაზიდვა, ნაგვის გატანა",
        "Добавьте навыки, напр.: перевозка мебели, вывоз мусора",
      ),
      placeholder: l(
        "e.g. furniture moving...",
        "მაგ: ავეჯის გადაზიდვა...",
        "напр. перевозка мебели...",
      ),
      suggestions: [
        "ავეჯის გადაზიდვა",
        "სამშენებლო ნაგვის გატანა",
        "მასალების მიტანა",
        "ტვირთის გადაზიდვა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ტვირთის გადაზიდვის მოთხოვნა მაღალია. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per trip", "რეისზე", "за рейс"),
    },
    portfolio: {
      description: l(
        "Show your moving service",
        "აჩვენეთ გადაზიდვის სერვისი",
        "Покажите транспортные услуги",
      ),
    },
  },

  "appliance-repair": {
    key: "appliance-repair",
    bio: {
      placeholder: l(
        "e.g.: Appliance repair technician, washing machines, fridges, TVs...",
        "მაგ: ტექნიკის შემკეთებელი ვარ, სარეცხი მანქანა, მაცივარი, ტელევიზორი...",
        "напр.: Мастер по ремонту техники, стиральные машины, холодильники, ТВ...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: washing machine, fridge, TV repair",
        "დაამატეთ უნარები, მაგ: სარეცხი მანქანის, მაცივრის, ტელევიზორის შეკეთება",
        "Добавьте навыки, напр.: стиральная машина, холодильник, ТВ",
      ),
      placeholder: l(
        "e.g. washing machine repair...",
        "მაგ: სარეცხი მანქანის შეკეთება...",
        "напр. ремонт стиральных машин...",
      ),
      suggestions: [
        "სარეცხი მანქანა",
        "მაცივარი",
        "გაზქურა",
        "ტელევიზორი",
        "კომპიუტერი",
        "კონდიციონერი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ტექნიკის შემკეთებელს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per repair", "შეკეთებაზე", "за ремонт"),
    },
    portfolio: {
      description: l(
        "Show your repair work",
        "აჩვენეთ შეკეთების სამუშაოები",
        "Покажите ремонтные работы",
      ),
    },
  },

  "pest-control": {
    key: "pest-control",
    bio: {
      placeholder: l(
        "e.g.: Pest control specialist, disinfection, rodent control...",
        "მაგ: დეზინსექციის სპეციალისტი ვარ, დეზინფექცია, მღრღნელების კონტროლი...",
        "напр.: Специалист по дезинсекции, дезинфекция, борьба с грызунами...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: disinfection, rodent control",
        "დაამატეთ უნარები, მაგ: დეზინფექცია, მღრღნელების კონტროლი",
        "Добавьте навыки, напр.: дезинфекция, борьба с грызунами",
      ),
      placeholder: l(
        "e.g. disinfection...",
        "მაგ: დეზინფექცია...",
        "напр. дезинфекция...",
      ),
      suggestions: [
        "დეზინფექცია",
        "დეზინსექცია",
        "მღრღნელების კონტროლი",
        "ტერმიტების მოშორება",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე დეზინსექციის სპეციალისტს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per m²", "კვ.მ", "за м²"),
      showSquareMeters: true,
    },
    portfolio: {
      description: l(
        "Show your pest control work",
        "აჩვენეთ დეზინსექციის სამუშაოები",
        "Покажите работы по дезинсекции",
      ),
    },
  },

  locksmith: {
    key: "locksmith",
    bio: {
      placeholder: l(
        "e.g.: Locksmith, lock replacement, key making, door opening...",
        "მაგ: საკეტების ოსტატი ვარ, საკეტის შეცვლა, გასაღების დამზადება...",
        "напр.: Слесарь, замена замков, изготовление ключей, вскрытие дверей...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: lock replacement, key making",
        "დაამატეთ უნარები, მაგ: საკეტის შეცვლა, გასაღების დამზადება",
        "Добавьте навыки, напр.: замена замков, изготовление ключей",
      ),
      placeholder: l(
        "e.g. lock replacement...",
        "მაგ: საკეტის შეცვლა...",
        "напр. замена замков...",
      ),
      suggestions: [
        "საკეტის შეცვლა",
        "გასაღების დამზადება",
        "კარის გაღება",
        "სეიფის გაღება",
        "ავტო გასაღები",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე საკეტების ოსტატს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per job", "შეკვეთაზე", "за работу"),
    },
    portfolio: {
      description: l(
        "Show your locksmith work",
        "აჩვენეთ საკეტების სამუშაოები",
        "Покажите слесарные работы",
      ),
    },
  },

  "furniture-cleaning": {
    key: "furniture-cleaning",
    bio: {
      placeholder: l(
        "e.g.: Furniture cleaning specialist, sofas, carpets, car interiors...",
        "მაგ: ავეჯის ქიმწმენდის სპეციალისტი ვარ, დივნები, ხალიჩები, ავტო სალონი...",
        "напр.: Специалист по химчистке мебели, диваны, ковры, автосалон...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: sofa cleaning, carpet cleaning",
        "დაამატეთ უნარები, მაგ: დივნის ქიმწმენდა, ხალიჩის ქიმწმენდა",
        "Добавьте навыки, напр.: чистка диванов, чистка ковров",
      ),
      placeholder: l(
        "e.g. sofa cleaning...",
        "მაგ: დივნის ქიმწმენდა...",
        "напр. чистка диванов...",
      ),
      suggestions: [
        "დივნის ქიმწმენდა",
        "ხალიჩის ქიმწმენდა",
        "მატრასის ქიმწმენდა",
        "სავარძლის ქიმწმენდა",
        "ავტო სალონის ქიმწმენდა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ავეჯის ქიმწმენდის სპეციალისტს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per item", "ერთეულზე", "за единицу"),
    },
    portfolio: {
      description: l(
        "Show before & after cleaning results",
        "აჩვენეთ ქიმწმენდის შედეგები",
        "Покажите результаты химчистки",
      ),
    },
  },

  gardening: {
    key: "gardening",
    bio: {
      placeholder: l(
        "e.g.: Gardener, lawn care, tree trimming, garden design...",
        "მაგ: მებაღე ვარ, ბალახის მოვლა, ხეების გასხვლა, ეზოს დიზაინი...",
        "напр.: Садовник, уход за газоном, обрезка деревьев, дизайн сада...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: lawn mowing, tree trimming, garden design",
        "დაამატეთ უნარები, მაგ: ბალახის თიბვა, ხეების გასხვლა, ეზოს მოწყობა",
        "Добавьте навыки, напр.: стрижка газона, обрезка деревьев",
      ),
      placeholder: l(
        "e.g. lawn mowing...",
        "მაგ: ბალახის თიბვა...",
        "напр. стрижка газона...",
      ),
      suggestions: [
        "ბალახის თიბვა",
        "ხეების გასხვლა",
        "ეზოს მოწყობა",
        "მორწყვის სისტემა",
        "ყვავილების დარგვა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე მებაღეს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per visit", "ვიზიტზე", "за визит"),
    },
    portfolio: {
      description: l(
        "Show your gardening work",
        "აჩვენეთ მებაღეობის სამუშაოები",
        "Покажите садовые работы",
      ),
    },
  },

  security: {
    key: "security",
    bio: {
      placeholder: l(
        "e.g.: Security systems installer, CCTV, alarms, access control...",
        "მაგ: უსაფრთხოების სისტემების ოსტატი ვარ, კამერები, სიგნალიზაცია...",
        "напр.: Специалист по системам безопасности, камеры, сигнализация...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: CCTV installation, alarm systems",
        "დაამატეთ უნარები, მაგ: კამერების მონტაჟი, სიგნალიზაცია",
        "Добавьте навыки, напр.: установка камер, сигнализация",
      ),
      placeholder: l(
        "e.g. CCTV...",
        "მაგ: კამერების მონტაჟი...",
        "напр. видеонаблюдение...",
      ),
      suggestions: [
        "კამერების მონტაჟი",
        "სიგნალიზაცია",
        "დომოფონი",
        "წვდომის კონტროლი",
        "დაცვის სისტემა",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე უსაფრთხოების სპეციალისტს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per system", "სისტემაზე", "за систему"),
    },
    portfolio: {
      description: l(
        "Show your security installations",
        "აჩვენეთ უსაფრთხოების სისტემები",
        "Покажите охранные системы",
      ),
    },
  },

  "smart-home": {
    key: "smart-home",
    bio: {
      placeholder: l(
        "e.g.: Smart home specialist, automation, smart lighting, voice control...",
        "მაგ: ჭკვიანი სახლის სპეციალისტი ვარ, ავტომატიზაცია, ჭკვიანი განათება...",
        "напр.: Специалист по умному дому, автоматизация, умное освещение...",
      ),
    },
    skills: {
      description: l(
        "Add skills, e.g.: smart lighting, home automation",
        "დაამატეთ უნარები, მაგ: ჭკვიანი განათება, ავტომატიზაცია",
        "Добавьте навыки, напр.: умное освещение, автоматизация",
      ),
      placeholder: l(
        "e.g. smart lighting...",
        "მაგ: ჭკვიანი განათება...",
        "напр. умное освещение...",
      ),
      suggestions: [
        "ჭკვიანი განათება",
        "სახლის ავტომატიზაცია",
        "ხმოვანი კონტროლი",
        "ჭკვიანი თერმოსტატი",
      ],
    },
    sms: {
      template: {
        ka: "{name}, Homico-ზე ჭკვიანი სახლის სპეციალისტს ეძებენ. გააქტიურეთ პროფილი: {url}",
      },
    },
    pricing: {
      unit: l("per system", "სისტემაზე", "за систему"),
    },
    portfolio: {
      description: l(
        "Show your smart home projects",
        "აჩვენეთ ჭკვიანი სახლის პროექტები",
        "Покажите проекты умного дома",
      ),
    },
  },
};

// ── Default config for unconfigured subcategories ──────────────────────────

const DEFAULT_CONFIG: SubcategoryConfig = {
  key: "_default",
  bio: {
    placeholder: l(
      "Describe yourself, your experience, and what services you offer...",
      "აღწერეთ საკუთარი თავი, გამოცდილება და რა სერვისებს სთავაზობთ...",
      "Опишите себя, свой опыт и какие услуги вы предлагаете...",
    ),
  },
  skills: {
    description: l(
      "Add your professional skills",
      "დაამატეთ თქვენი პროფესიული უნარები",
      "Добавьте ваши профессиональные навыки",
    ),
    placeholder: l(
      "Add a skill...",
      "დაამატეთ სხვა უნარი...",
      "Добавьте навык...",
    ),
    suggestions: [],
  },
  sms: {
    template: {
      ka: "{name}, Homico-ზე სპეციალისტს ეძებენ. გააქტიურეთ პროფილი და მიიღეთ შეკვეთები: {url}",
    },
  },
  pricing: {
    unit: l("per job", "შეკვეთაზე", "за работу"),
  },
  portfolio: {
    description: l(
      "Show your best work",
      "აჩვენეთ თქვენი საუკეთესო სამუშაოები",
      "Покажите ваши лучшие работы",
    ),
  },
};

// ── Public API ──────────────────────────

/**
 * Get subcategory config. Falls back to default if not configured.
 */
export function getSubcategoryConfig(
  subcategoryKey: string,
): SubcategoryConfig {
  return SUBCATEGORY_CONFIGS[subcategoryKey] || DEFAULT_CONFIG;
}

/**
 * Get a localized string from a config field.
 */
export function getLocalizedField(
  field: { en: string; ka: string; ru: string },
  locale: string,
): string {
  return field[locale as keyof typeof field] || field.en;
}

/**
 * Get all configured subcategory keys.
 */
export function getConfiguredSubcategories(): string[] {
  return Object.keys(SUBCATEGORY_CONFIGS);
}
