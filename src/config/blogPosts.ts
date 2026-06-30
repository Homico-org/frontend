/**
 * Blog / Journal content. PLACEHOLDER copy + Unsplash images - replace freely.
 *
 * Each post carries title/excerpt/body in all three locales so the page reads
 * naturally in en/ka/ru (rendered via `pick(...)`). Swap `image` for your own
 * uploaded asset URL, edit the text, add/remove posts. The page derives the
 * featured post from `featured: true` (falls back to the first item).
 */

export type BlogCategory =
  | "renovation"
  | "design"
  | "budget"
  | "guides"
  | "stories";

export interface BlogAuthor {
  name: string;
  role: { en: string; ka: string; ru: string };
  avatar?: string;
}

export interface BlogPost {
  slug: string;
  category: BlogCategory;
  /** Cover image - replace with your own. */
  image: string;
  /** ISO date string. */
  date: string;
  /** Estimated read time, minutes. */
  readMin: number;
  author: BlogAuthor;
  featured?: boolean;
  title: { en: string; ka: string; ru: string };
  excerpt: { en: string; ka: string; ru: string };
  /** Body paragraphs, per locale. */
  body: { en: string[]; ka: string[]; ru: string[] };
}

// 1200x630 (1.91:1) - same as the Open Graph / social share size, so one
// asset doubles as the post cover and the share image. Replace freely.
const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&h=630&q=70`;

const NINO: BlogAuthor = {
  name: "Nino Beridze",
  role: { en: "Interior designer", ka: "ინტერიერის დიზაინერი", ru: "Дизайнер интерьера" },
  avatar: IMG("1544005313-94ddf0286df2"),
};
const LEVAN: BlogAuthor = {
  name: "Levan Kapanadze",
  role: { en: "Site manager", ka: "სამუშაოს ხელმძღვანელი", ru: "Прораб" },
  avatar: IMG("1507003211169-0a1dd7228f2d"),
};
const TEAM: BlogAuthor = {
  name: "Homico",
  role: { en: "Editorial team", ka: "რედაქცია", ru: "Редакция" },
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "bathroom-renovation-budget-tbilisi",
    category: "budget",
    image: IMG("1620626011761-996317b8d101"),
    date: "2026-05-28",
    readMin: 6,
    author: NINO,
    featured: true,
    title: {
      en: "What a bathroom renovation really costs in Tbilisi",
      ka: "რა ჯდება სააბაზანოს რემონტი თბილისში",
      ru: "Сколько на самом деле стоит ремонт ванной в Тбилиси",
    },
    excerpt: {
      en: "A line-by-line breakdown - demolition, plumbing, tiling, fixtures - so the final number holds no surprises.",
      ka: "პუნქტობრივი დაშლა - დემონტაჟი, სანტექნიკა, ფილა, ნაკეთობები - რომ საბოლოო თანხა მოულოდნელი არ იყოს.",
      ru: "Разбор по пунктам - демонтаж, сантехника, плитка, оборудование - чтобы итог не стал сюрпризом.",
    },
    body: {
      en: [
        "A standard 4 m² bathroom in Tbilisi runs from roughly 3 000 to 8 000 ₾, depending on what's behind the walls. The spread comes almost entirely from two things: how much you re-route, and the finish level you choose.",
        "Demolition and rough plumbing are where budgets quietly grow. If the layout stays put, you save. The moment you move the toilet or the riser, add labour and days.",
        "Tiles and fixtures are the visible half of the bill, and the easiest to plan. Pick the tile first, price the field, then let everything else follow. A clear scope up front is what keeps the final invoice honest.",
      ],
      ka: [
        "თბილისში სტანდარტული 4 მ² სააბაზანო დაახლოებით 3 000-დან 8 000 ₾-მდე ჯდება - დამოკიდებულია იმაზე, რა იმალება კედლებში. სხვაობას ორი რამ ქმნის: რამდენს გადააადგილებთ და რა ხარისხს ირჩევთ.",
        "დემონტაჟი და სანტექნიკის გაყვანა ის ეტაპია, სადაც ბიუჯეტი ჩუმად იზრდება. თუ განლაგება უცვლელია, დაზოგავთ. როგორც კი უნიტაზს ან სტოიაკს გადააადგილებთ, ემატება სამუშაო და დღეები.",
        "ფილა და სანტექნიკის ნაკეთობები ხარჯის ხილული ნაწილია და ყველაზე ადვილად დასაგეგმი. ჯერ ფილა აირჩიეთ, შემდეგ დანარჩენი მას მიჰყვება. წინასწარ მკაფიო გეგმა ინახავს საბოლოო ანგარიშს რეალურად.",
      ],
      ru: [
        "Стандартная ванная 4 м² в Тбилиси обходится примерно от 3 000 до 8 000 ₾ - всё зависит от того, что скрыто в стенах. Разброс создают две вещи: сколько вы переносите и какой уровень отделки выбираете.",
        "Демонтаж и черновая сантехника - этап, где бюджет тихо растёт. Если планировка остаётся прежней, вы экономите. Как только переносите унитаз или стояк - добавляются работы и дни.",
        "Плитка и оборудование - видимая половина счёта и самая предсказуемая. Сначала выберите плитку, затем всё остальное подстроится. Чёткий план заранее удерживает итог честным.",
      ],
    },
  },
  {
    slug: "structural-engineer-before-you-start",
    category: "guides",
    image: IMG("1503387762-592deb58ef4e"),
    date: "2026-05-21",
    readMin: 5,
    author: LEVAN,
    title: {
      en: "5 signs you need a structural engineer first",
      ka: "5 ნიშანი, რომ ჯერ ინჟინერი გჭირდებათ",
      ru: "5 признаков, что сначала нужен инженер",
    },
    excerpt: {
      en: "Before you knock down a single wall, here's how to tell load-bearing from decorative.",
      ka: "სანამ ერთ კედელსაც დაანგრევთ - როგორ გაარჩიოთ მზიდი კედელი დეკორატიულისგან.",
      ru: "Прежде чем снести стену - как отличить несущую от декоративной.",
    },
    body: {
      en: [
        "Not every wall is just a partition. In Tbilisi's older blocks, the wall you want gone is often holding up the flat above you.",
        "If a wall is thicker than 20 cm, sits above another wall on the floor below, or carries a beam, treat it as load-bearing until an engineer says otherwise.",
        "A short structural assessment costs far less than the repair after a mistake - and on Homico you can attach the engineer's report to your project so every trade works from the same drawing.",
      ],
      ka: [
        "ყველა კედელი მხოლოდ ტიხარი არ არის. თბილისის ძველ კორპუსებში კედელი, რომლის მოშორებაც გსურთ, ხშირად ზემო ბინას იჭერს.",
        "თუ კედელი 20 სმ-ზე სქელია, ქვედა სართულის კედლის ზემოთ დგას ან კოჭს ეყრდნობა, ჩათვალეთ მზიდად, სანამ ინჟინერი სხვას არ იტყვის.",
        "მოკლე სტრუქტურული შეფასება ბევრად იაფია, ვიდრე შეცდომის შემდეგ აღდგენა - Homico-ზე კი ინჟინრის დასკვნა პროექტს მიამაგრებთ, რომ ყველა ოსტატი ერთი ნახაზით მუშაობდეს.",
      ],
      ru: [
        "Не каждая стена - просто перегородка. В старых домах Тбилиси стена, которую вы хотите убрать, нередко держит квартиру сверху.",
        "Если стена толще 20 см, стоит над стеной нижнего этажа или несёт балку - считайте её несущей, пока инженер не скажет иначе.",
        "Короткая экспертиза стоит намного меньше, чем устранение последствий ошибки - а на Homico заключение инженера прикрепляется к проекту, чтобы все мастера работали по одному чертежу.",
      ],
    },
  },
  {
    slug: "choosing-tiles-designer-shortlist",
    category: "design",
    image: IMG("1556911220-bff31c812dba"),
    date: "2026-05-14",
    readMin: 4,
    author: NINO,
    title: {
      en: "Choosing tiles: a designer's shortlist",
      ka: "ფილის არჩევა: დიზაინერის სია",
      ru: "Выбор плитки: список от дизайнера",
    },
    excerpt: {
      en: "Format, finish, grout. Three decisions that change how a whole room reads.",
      ka: "ფორმატი, ფაქტურა, ნაკერი. სამი გადაწყვეტა, რომელიც მთელ ოთახს ცვლის.",
      ru: "Формат, фактура, затирка. Три решения, меняющие всю комнату.",
    },
    body: {
      en: [
        "Big-format tiles read calm and modern; small ones read crafted and warm. Neither is wrong - pick the mood first, the product second.",
        "Matte hides water spots and fingerprints; gloss bounces light into a dark room. In a north-facing Tbilisi flat, a touch of gloss goes a long way.",
        "Grout colour is the detail nobody plans and everybody notices. Match it to the tile to make the surface disappear; contrast it to make a pattern sing.",
      ],
      ka: [
        "დიდი ფორმატის ფილა მშვიდად და თანამედროვედ აღიქმება; პატარა - ხელნაკეთად და თბილად. არცერთი არ არის არასწორი - ჯერ განწყობა აირჩიეთ, შემდეგ პროდუქტი.",
        "მქრქალი ფაქტურა მალავს წყლის კვალს და თითის ანაბეჭდს; პრიალა სინათლეს ბნელ ოთახში აბრუნებს. ჩრდილოეთით მიმართულ თბილისურ ბინაში პრიალა ბევრს შველის.",
        "ნაკერის ფერი ის დეტალია, რომელსაც არავინ გეგმავს და ყველა ამჩნევს. ფილას რომ შეუხამოთ, ზედაპირი ქრება; რომ დაუპირისპიროთ, ნახატი ცოცხლდება.",
      ],
      ru: [
        "Крупный формат читается спокойно и современно; мелкий - рукотворно и тепло. Ни то ни другое не ошибка - сначала настроение, потом продукт.",
        "Матовая поверхность скрывает следы воды и отпечатки; глянец возвращает свет в тёмную комнату. В тбилисской квартире на север немного глянца решает многое.",
        "Цвет затирки - деталь, которую никто не планирует, но все замечают. Совпадает с плиткой - поверхность исчезает; контрастирует - рисунок оживает.",
      ],
    },
  },
  {
    slug: "empty-shell-to-finished-flat-vake",
    category: "stories",
    image: IMG("1600585154340-be6161a56a0c"),
    date: "2026-05-06",
    readMin: 7,
    author: TEAM,
    title: {
      en: "From empty shell to finished flat: a Vake story",
      ka: "შავი კარკასიდან მზა ბინამდე: ვაკის ისტორია",
      ru: "От бетонной коробки до готовой квартиры: история из Ваке",
    },
    excerpt: {
      en: "Eleven weeks, four trades, one project board. How a 78 m² flat came together.",
      ka: "თერთმეტი კვირა, ოთხი ოსტატი, ერთი პროექტი. როგორ შეიკრა 78 მ² ბინა.",
      ru: "Одиннадцать недель, четыре мастера, одна доска проекта. Как собралась квартира 78 м².",
    },
    body: {
      en: [
        "When Ana bought a bare-shell flat in Vake, she had a floor plan and not much else. The first real decision wasn't a colour - it was sequence.",
        "Electrics and plumbing went in before a single wall was closed. Then plaster, then floors, then the kitchen. Each trade booked the next on the shared project board, so nobody waited on a phone call.",
        "Eleven weeks later the flat was ready. The budget held within 6% of the estimate - not because nothing changed, but because every change was logged the day it happened.",
      ],
      ka: [
        "როცა ანამ ვაკეში შავი კარკასის ბინა იყიდა, ხელთ მხოლოდ გეგმა ჰქონდა. პირველი ნამდვილი გადაწყვეტა ფერი არ ყოფილა - თანმიმდევრობა იყო.",
        "ელექტრობა და სანტექნიკა ჩაიდო მანამ, სანამ ერთი კედელი დაიხურებოდა. შემდეგ შელესვა, იატაკი, სამზარეულო. ყველა ოსტატი მომდევნოს საერთო პროექტში ჯავშნიდა - ზარის მოლოდინი არავის უწევდა.",
        "თერთმეტი კვირის შემდეგ ბინა მზად იყო. ბიუჯეტი შეფასებას 6%-ში ჩაეტია - არა იმიტომ, რომ არაფერი შეცვლილა, არამედ იმიტომ, რომ ყველა ცვლილება იმავე დღეს იწერებოდა.",
      ],
      ru: [
        "Когда Ана купила квартиру без отделки в Ваке, у неё был план - и почти ничего больше. Первым настоящим решением был не цвет, а последовательность.",
        "Электрика и сантехника легли до того, как закрыли хоть одну стену. Потом штукатурка, полы, кухня. Каждый мастер бронировал следующего на общей доске проекта - никто не ждал звонка.",
        "Через одиннадцать недель квартира была готова. Бюджет уложился в 6% от сметы - не потому что ничего не менялось, а потому что каждое изменение фиксировалось в тот же день.",
      ],
    },
  },
  {
    slug: "real-timeline-full-apartment-renovation",
    category: "renovation",
    image: IMG("1631679706909-1844bbd07221"),
    date: "2026-04-29",
    readMin: 6,
    author: LEVAN,
    title: {
      en: "The real timeline of a full apartment renovation",
      ka: "ბინის სრული რემონტის რეალური ვადა",
      ru: "Реальные сроки полного ремонта квартиры",
    },
    excerpt: {
      en: "Phase by phase, where the weeks actually go - and where they slip.",
      ka: "ეტაპობრივად, სად მიდის კვირები სინამდვილეში - და სად იკარგება.",
      ru: "По этапам - куда на самом деле уходят недели и где они теряются.",
    },
    body: {
      en: [
        "People plan renovations in colours and forget they happen in weeks. A full two-bedroom flat is rarely under ten weeks of actual work - and the delays are almost always the same two.",
        "Material lead times and client decisions. A tile that's three weeks out, a sink that's still 'maybe' - those stall a whole crew. The fix is boring and effective: decide early, order earlier.",
        "Demolition is fast. Finishing is slow. Budget your patience for the last two weeks, when the visible progress shrinks and the punch-list grows.",
      ],
      ka: [
        "რემონტს ფერებში გეგმავენ და ავიწყდებათ, რომ ის კვირებში ხდება. ორ საძინებლიანი ბინა იშვიათად თუ მოითხოვს ათ კვირაზე ნაკლებ რეალურ სამუშაოს - დაყოვნება კი თითქმის ყოველთვის ერთი და იგივეა.",
        "მასალის მოწოდების ვადა და კლიენტის გადაწყვეტილებები. ფილა, რომელიც სამ კვირაში მოვა, ნიჟარა, რომელიც ჯერ 'იქნებ' - ეს მთელ ბრიგადას აჩერებს. გამოსავალი მარტივია: ადრე გადაწყვიტეთ, კიდევ უფრო ადრე შეუკვეთეთ.",
        "დემონტაჟი სწრაფია. მოპირკეთება ნელი. მოთმინება ბოლო ორი კვირისთვის შეინახეთ, როცა ხილული პროგრესი მცირდება და წვრილმანების სია იზრდება.",
      ],
      ru: [
        "Ремонт планируют в цветах и забывают, что он измеряется неделями. Полная двушка редко занимает меньше десяти недель реальной работы - и задержки почти всегда одни и те же.",
        "Сроки поставки материалов и решения клиента. Плитка, которая придёт через три недели, раковина, которая всё ещё «возможно», - и встаёт вся бригада. Решение скучное и рабочее: решайте рано, заказывайте ещё раньше.",
        "Демонтаж быстрый. Отделка медленная. Запасите терпение на последние две недели, когда видимый прогресс уменьшается, а список доделок растёт.",
      ],
    },
  },
  {
    slug: "verified-pro-vs-friend-of-a-friend",
    category: "guides",
    image: IMG("1581092918056-0c4c3acd3789"),
    date: "2026-04-22",
    readMin: 4,
    author: TEAM,
    title: {
      en: "Verified pro vs. a friend-of-a-friend",
      ka: "გადამოწმებული ოსტატი vs. ნაცნობის ნაცნობი",
      ru: "Проверенный мастер против «знакомого знакомого»",
    },
    excerpt: {
      en: "Word-of-mouth is comfortable. Here's what it quietly costs you.",
      ka: "რეკომენდაცია კომფორტულია. აი, რა გიჯდებათ ის ჩუმად.",
      ru: "Сарафанное радио удобно. Вот что оно тихо вам стоит.",
    },
    body: {
      en: [
        "The friend-of-a-friend feels safe because someone vouched once. But you inherit no record, no reviews, and no recourse if the work stalls halfway.",
        "A verified pro carries a profile you can actually read: past projects, real ratings, a clear price. The trust is built from evidence, not a favour.",
        "And when money moves through the platform, it's held until the milestone is done - so 'they disappeared with the deposit' simply isn't on the table.",
      ],
      ka: [
        "ნაცნობის ნაცნობი უსაფრთხოდ მოგეჩვენებათ, რადგან ვიღაცამ ერთხელ დააფასა. მაგრამ თქვენ არ რჩებათ არც ჩანაწერი, არც შეფასება, არც გასაჩივრების გზა, თუ სამუშაო შუა გზაზე გაჩერდა.",
        "გადამოწმებულ ოსტატს აქვს პროფილი, რომელსაც ნამდვილად წაიკითხავთ: წინა პროექტები, რეალური შეფასებები, მკაფიო ფასი. ნდობა მტკიცებულებაზე დგას, არა სიკეთეზე.",
        "და როცა თანხა პლატფორმაში გადის, ის ეტაპის დასრულებამდე ინახება - ასე რომ, 'წინასწარ აიღო და გაქრა' უბრალოდ გამორიცხულია.",
      ],
      ru: [
        "«Знакомый знакомого» кажется безопасным, потому что кто-то однажды поручился. Но вам не достаётся ни истории, ни отзывов, ни возможности что-то предъявить, если работа встанет на полпути.",
        "У проверенного мастера есть профиль, который можно прочитать: прошлые проекты, реальные оценки, понятная цена. Доверие строится на фактах, а не на одолжении.",
        "А когда деньги идут через платформу, они удерживаются до завершения этапа - так что «взяли предоплату и исчезли» просто исключено.",
      ],
    },
  },
];

export const BLOG_CATEGORY_KEYS: BlogCategory[] = [
  "renovation",
  "design",
  "budget",
  "guides",
  "stories",
];
