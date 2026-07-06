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
  {
    slug: "urgent-household-help-verified-pros",
    category: "guides",
    image: IMG("1581092918056-0c4c3acd3789"),
    date: "2026-07-01",
    readMin: 2,
    author: TEAM,
    title: {
      en: "Solving Urgent Household Problems is Now Easy",
      ka: "გადაუდებელი საყოფაცხოვრებო პრობლემების მოგვარება ახლა უკვე მარტივია",
      ru: "Решение срочных бытовых проблем теперь стало простым",
    },
    excerpt: {
      en: "A burst pipe or a midnight power outage—no time to wait? Homico connects you with verified professionals at fixed prices, and an experienced expert is at your door in no time.",
      ka: "გასკდა მილი ან შუაღამისას დაგირჩათ ელექტროენერგია და ლოდინის დრო არ გაქვთ? Homico გაძლევთ ვერიფიცირებულ პროფესიონალებს ფიქსირებულ ფასად და გამოცდილი ოსტატი მალევე თქვენს კართან იქნება.",
      ru: "Прорвало трубу или ночью пропал свет, а ждать некогда? Homico соединит вас с проверенными профессионалами по фиксированным ценам, и опытный мастер быстро окажется у вашей двери.",
    },
    body: {
      en: [
        "Imagine a classic scenario: you return home at the end of a long workday, open the door, and discover a burst pipe in the bathroom. The water is already creeping toward the living room, panic sets in, and you simply don't have the luxury of waiting. Or even worse: in the dead of night, a short circuit occurs, plunging the entire house into darkness and posing a real threat of frying your appliances. In urgent situations like these, finding a handyman using old-school methods is a total nightmare.",
        "The internet is flooded with thousands of unverified, anonymous listings where you can neither confirm the craftsman's actual qualifications nor their trustworthiness. Calling neighbors or reaching out to acquaintances takes hours, and in a moment of crisis, nobody physically has the time to rush to the Eliava bazaar. This is exactly when Homico becomes your most reliable partner.",
        "Homico is an innovative platform that resolves household issues instantly. Upon entering the website, with just a few clicks, you can choose the category you need, whether it's plumbing, electrical work, air conditioning, or general renovations. The search process is entirely transparent: you only see verified professionals with genuine reviews from real users, star ratings, and years of experience.",
        "Best of all, Homico completely eliminates any confusion regarding pricing. The service costs are listed on the platform upfront at a fixed rate. You know exactly what the job costs, with zero hidden fees. Shortly after booking, an experienced professional will be at your doorstep, ready to resolve your problem with ease.",
      ],
      ka: [
        "წარმოიდგინეთ კლასიკური სცენარი: სამუშაო დღის ბოლოს სახლში ბრუნდებით, კარებს აღებთ და ხედავთ, რომ სააბაზანოში მილი გასკდა. წყალი უკვე მისაღებ ოთახს უახლოვდება, პანიკა იმატებს და ლოდინის ფუფუნება უბრალოდ არ გაქვთ. ან კიდევ უფრო უარესი, შუაღამისას ელექტროენერგიის მოკლე ჩართვა ხდება, მთელ სახლში ბნელდება და აპარატურის გადაწვის რეალური საფრთხე იქმნება. ასეთ გადაუდებელ სიტუაციებში ძველი მეთოდებით ხელოსნის ძებნა ნამდვილი კოშმარია.",
        "ინტერნეტში ათასობით გადაუმოწმებელი, ანონიმური განცხადებაა, სადაც არც ოსტატის რეალურ კვალიფიკაციას იცნობთ და არც მის სანდოობას. მეზობლებში რეკვას ან ნაცნობების ძებნას საათები სჭირდება, ელიავას ბაზრობაზე სირბილის დრო კი კრიზისულ მომენტში ფიზიკურად არავის არ აქვს. სწორედ ამ დროს ხდება Homico თქვენი ყველაზე სანდო პარტნიორი.",
        "Homico არის ინოვაციური პლატფორმა, რომელიც საყოფაცხოვრებო პრობლემებს მომენტალურად აგვარებს. საიტზე შესვლისთანავე, სულ რამდენიმე კლიკით ირჩევთ თქვენთვის საჭირო კატეგორიას, იქნება ეს: სანტექნიკა, ელექტრობა, კონდიცირება თუ რემონტი. ძიების პროცესი მაქსიმალურად გამჭვირვალეა: თქვენ ხედავთ მხოლოდ ვერიფიცირებულ პროფესიონალებს, რომელთაც აქვთ რეალური მომხმარებლების მიერ დაწერილი შეფასებები, ვარსკვლავების მიხედვით დათვლილი რეიტინგი და მრავალწლიანი გამოცდილება.",
        "რაც მთავარია, Homico სრულად აქარწყლებს ფასებთან დაკავშირებულ გაუგებრობებს. მომსახურების ღირებულება წინასწარ, ფიქსირებულად არის მითითებული პლატფორმაზე. თქვენ ზუსტად იცით, რა ჯდება საქმე, ყოველგვარი ფარული ხარჯების გარეშე. ჯავშნის გაფორმებიდან მალევე გამოცდილი ოსტატი უკვე თქვენს კართან იქნება და პრობლემას მარტივად მოგიგვარებთ.",
      ],
      ru: [
        "Представьте классический сценарий: в конце рабочего дня вы возвращаетесь домой, открываете дверь и видите, что в ванной прорвало трубу. Вода уже подступает к гостиной, паника нарастает, а роскоши ждать у вас просто нет. Или ещё хуже: посреди ночи происходит короткое замыкание, весь дом погружается во тьму и возникает реальная угроза выхода из строя техники. В таких экстренных ситуациях искать мастера старыми методами — настоящий кошмар.",
        "Интернет переполнен тысячами непроверенных, анонимных объявлений, где вы не можете быть уверены ни в реальной квалификации мастера, ни в его надёжности. Обзванивать соседей или искать знакомых занимает часы, а в кризисный момент физически ни у кого нет времени мчаться на рынок Элиава. Именно в этот момент Homico становится вашим самым надёжным партнёром.",
        "Homico — это инновационная платформа, которая решает бытовые проблемы мгновенно. Зайдя на сайт, всего в несколько кликов вы выбираете нужную вам категорию, будь то сантехника, электрика, кондиционирование или ремонт. Процесс поиска максимально прозрачен: вы видите только проверенных профессионалов, у которых есть отзывы, написанные реальными пользователями, рейтинг по звёздам и многолетний опыт.",
        "Самое главное, Homico полностью устраняет любую путаницу, связанную с ценами. Стоимость услуги указана на платформе заранее и фиксированно. Вы точно знаете, во сколько обойдётся работа, без каких-либо скрытых расходов. Вскоре после оформления заявки опытный мастер уже будет у вашей двери и с лёгкостью решит вашу проблему.",
      ],
    },
  },
  {
    slug: "renovation-materials-universal-catalog",
    category: "guides",
    image: IMG("1556911220-bff31c812dba"),
    date: "2026-07-03",
    readMin: 2,
    author: TEAM,
    title: {
      en: "Homico Adds a Universal Catalog for Renovation Materials",
      ka: "Homico-ს სარემონტო მასალების უნივერსალური კატალოგი დაემატა",
      ru: "В Homico добавлен универсальный каталог ремонтных материалов",
    },
    excerpt: {
      en: "Dozens of open tabs and endless price-hunting are over—Homico's unified catalog brings every leading store, brand, and product into one place so you can compare and save in seconds.",
      ka: "ათობით გახსნილი ტაბი და ფასების გაუთავებელი ძებნა წარსულს ჩაბარდა — Homico-ს ერთიანი ციფრული კატალოგი ყველა წამყვან მაღაზიას, ბრენდსა და პროდუქტს ერთ სივრცეში აერთიანებს, რომ ფასები წამებში შეადაროთ და დაზოგოთ.",
      ru: "Десятки открытых вкладок и бесконечный поиск цен остались в прошлом — единый каталог Homico собирает все ведущие магазины, бренды и товары в одном месте, чтобы сравнивать цены и экономить за считанные секунды.",
    },
    body: {
      en: [
        "Home renovation is always associated with high costs, energy, and most importantly, a lot of wasted time. Think about how many hours you've spent just trying to find the perfect tile, lighting fixture, or piece of furniture. Dozens of open browser tabs, manually jotting down prices, and that constant lingering doubt: could it be cheaper somewhere else? The good news is that this exhausting process of hunting for renovation materials is now a thing of the past.",
        "Homico has created a unified digital catalog that fundamentally transforms the most tedious stage of renovating. Today, Homico is a massive marketplace with direct access to the databases of the largest home improvement stores operating in Georgia. This means you no longer need to check individual store websites, drive from showroom to showroom, and waste your precious time. All the leading suppliers and brands are now brought together in one single space.",
        "The main advantage of the platform is its simplicity and transparency. Thanks to Homico's unified database, you can easily compare prices in a matter of seconds. You can view offers from different stores for the exact same or similar products right on one screen, empowering you to make the smartest, most informed, and cost-effective decision.",
        "Beyond price comparisons, the catalog provides an immense variety. You have thousands of items at your fingertips: ranging from raw construction materials to finishing touches like decorative elements, furniture, and lighting.",
        "Turn your renovation into an enjoyable experience. Save time, nerves, and money—use the Homico platform.",
      ],
      ka: [
        "სახლის რემონტი ყოველთვის დიდ ხარჯებთან, ენერგიასთან და რაც მთავარია, დიდ დაკარგულ დროსთან ასოცირდება. გაიხსენეთ, რამდენი საათი დაგიხარჯავთ მხოლოდ იმაში, რომ იდეალური ფილა, განათება ან ავეჯი გეპოვათ. ათობით გახსნილი ტაბი ბრაუზერში, ფასების ხელით ჩანიშვნა და მუდმივი ეჭვი, ნეტავ სხვაგან უფრო იაფი ხომ არ იყო? – კარგი ამბავი ის არის, რომ სარემონტო მასალების ძებნის ეს დამღლელი პროცესი წარსულს ჩაბარდა.",
        "Homico-მ შექმნა ერთიანი ციფრული კატალოგი, რომელიც რემონტის ყველაზე დამღლელ ეტაპს არსებითად ცვლის. დღეს უკვე Homico გიგანტური მარკეტფლეისია, რომელსაც პირდაპირი წვდომა აქვს საქართველოში წარმოდგენილი უმსხვილესი სარემონტო მაღაზიების ბაზებთან. ეს ნიშნავს, რომ თქვენ აღარ გჭირდებათ მაღაზიების საიტების ცალ-ცალკე გადამოწმება, სხვადასხვა შოურუმებში სიარული და დროის კარგვა. ყველა წამყვანი მიმწოდებელი და ბრენდი უკვე ერთ სივრცეშია გაერთიანებული.",
        "პლატფორმის მთავარი უპირატესობა მისი სიმარტივე და გამჭვირვალობაა. Homico-ს ერთიანი ბაზის წყალობით, თქვენ შეგიძლიათ შეადაროთ ფასები მარტივად, სულ რამდენიმე წამში. ერთსა და იმავე ან მსგავს პროდუქტზე სხვადასხვა მაღაზიის შემოთავაზებას ერთ ეკრანზე ხედავთ, რაც საშუალებას გაძლევთ, მიიღოთ ყველაზე გონივრული, ინფორმირებული და ეკონომიური გადაწყვეტილება.",
        "გარდა ფასების შედარებისა, კატალოგი გაძლევთ უზარმაზარ მრავალფეროვნებას. თქვენს განკარგულებაშია ათასობით დასახელების პროდუქტი, დაწყებული სამშენებლო მასალებიდან, დასრულებული დეკორატიული ელემენტებით, ავეჯითა თუ სანათებით.",
        "აქციეთ რემონტი სასიამოვნო პროცესად. დაზოგეთ დრო, ნერვები და ფული – ისარგებლეთ Homico-ს პლატფორმით.",
      ],
      ru: [
        "Ремонт дома всегда ассоциируется с большими расходами, энергией и, что самое главное, с массой потерянного времени. Вспомните, сколько часов вы потратили только на то, чтобы найти идеальную плитку, светильник или предмет мебели. Десятки открытых вкладок в браузере, ручная выписка цен и постоянное сомнение: а вдруг где-то дешевле? Хорошая новость в том, что этот утомительный процесс поиска ремонтных материалов остался в прошлом.",
        "Homico создал единый цифровой каталог, который в корне меняет самый утомительный этап ремонта. Сегодня Homico — это гигантский маркетплейс с прямым доступом к базам крупнейших ремонтных магазинов, представленных в Грузии. Это значит, что вам больше не нужно по отдельности проверять сайты магазинов, ходить по разным шоурумам и терять время. Все ведущие поставщики и бренды уже объединены в одном пространстве.",
        "Главное преимущество платформы — её простота и прозрачность. Благодаря единой базе Homico вы можете легко сравнивать цены всего за несколько секунд. Предложения разных магазинов на один и тот же или похожий товар вы видите на одном экране, что позволяет вам принять максимально разумное, взвешенное и экономичное решение.",
        "Помимо сравнения цен, каталог даёт вам огромное разнообразие. В вашем распоряжении тысячи наименований товаров — начиная от строительных материалов и заканчивая декоративными элементами, мебелью и светильниками.",
        "Превратите ремонт в приятный процесс. Сэкономьте время, нервы и деньги — воспользуйтесь платформой Homico.",
      ],
    },
  },
  {
    slug: "renovation-shopping-list-designers",
    category: "design",
    image: IMG("1600585154340-be6161a56a0c"),
    date: "2026-07-05",
    readMin: 3,
    author: NINO,
    title: {
      en: "Renovation Shopping List – Turn Your Dream Design into Reality!",
      ka: "სარემონტო შოპინგ-ლისტი – აქციე ოცნების დიზაინი რეალობად!",
      ru: "Ремонтный шопинг-лист — преврати дизайн мечты в реальность!",
    },
    excerpt: {
      en: "A designer's flawless 3D vision often collapses when the perfect tile or fixture isn't available in Georgia. Homico's built-in Shopping List makes it real.",
      ka: "დიზაინერის იდეალური 3D ვიზუალი ხშირად იშლება, როცა სასურველი ფილა თუ სანათი საქართველოში არ იყიდება. Homico-ს ჩაშენებული შოპინგ-ლისტი მას რეალობად აქცევს.",
      ru: "Безупречная 3D-визуализация дизайнера часто рушится, когда нужной плитки или светильника нет в продаже в Грузии. Встроенный шопинг-лист Homico делает её реальностью.",
    },
    body: {
      en: [
        "A designer can create a stunning, flawless 3D visualization, but sometimes the actual result turns out quite different. This usually happens because the projected furniture, a specific tile, or a lighting fixture is physically unavailable for purchase in Georgia, or importing it involves colossal costs. As a result, an endless cycle of searching begins, alongside managing Excel spreadsheets and constantly trying to track what was agreed upon and when.",
        "Homico's new, built-in Shopping List feature completely eliminates this problem. It is a dedicated space that simultaneously makes life easier for both the client and the architects or designers.",
        "What Changes for Designers and Architects?",
        "Designers no longer have to waste hours manually copying and pasting prices and photos into Excel for their clients. By simply dropping a link to any real product onto the platform, the website automatically generates the photo, price, and supplier. Most importantly, since Homico is integrated with the major home improvement databases in Georgia, the designer only includes products in the project that are actually available locally. This eliminates false expectations and protects the author's original vision.",
        "What are the Benefits for the Consumer?",
        "Clients will no longer get lost in confusing technical blueprints and endless catalogs. Right in their profile, they receive a perfectly organized, ready-to-go shopping list, where every single item is matched with a photo, exact price, and the store selling it. The consumer can view the real product right on their screen and, with just a single click, either approve or reject the designer's choice.",
        "Furthermore, the entire process is fully controlled: budget updates are visible in real-time, and each item has its own tracking status: To Buy, Ordered, or Delivered.",
        "Homico's built-in Shopping List simplifies the exhausting and confusing renovation process so much that it actually becomes fun and enjoyable.",
      ],
      ka: [
        "დიზაინერი ქმნის ულამაზეს, იდეალურ 3D ვიზუალიზაციას, მაგრამ ზოგჯერ რეალური შედეგი სხვაგვარი აღმოჩნდება ხოლმე. ამის მიზეზი ისაა, რომ პროექტირებული ავეჯი, კონკრეტული ფილა ან სანათი საქართველოში ფიზიკურად არ იყიდება, ან მისი ჩამოტანა კოლოსალურ ხარჯებთანაა დაკავშირებული. შედეგად, იწყება გაუთავებელი ძებნის პროცესი, ექსელის ცხრილების მართვა და იმის მტკიცება, თუ რა და როდის შეთანხმდა.",
        "Homico-ს ახალი, ჩაშენებული შოპინგ-ლისტის ფუნქციონალი ამ პრობლემას ძირფესვიანად აგვარებს. ეს არის სივრცე, რომელიც ერთდროულად ამარტივებს ცხოვრებას როგორც დამკვეთისთვის, ისე არქიტექტორებისა და დიზაინერებისთვის.",
        "რა იცვლება დიზაინერებისა და არქიტექტორებისთვის?",
        "დიზაინერებს აღარ უწევთ საათების დაკარგვა ექსელში კლიენტისთვის ფასებისა და ფოტოების ხელით გადასატანად. პლატფორმაზე ნებისმიერი რეალური პროდუქტის ლინკის ჩაგდებით, საიტი ავტომატურად აგენერირებს ფოტოს, ფასსა და მომწოდებელს. რაც მთავარია, ვინაიდან ჰომიკო დაკავშირებულია საქართველოში არსებულ მსხვილ სამშენებლო ბაზებთან, დიზაინერი პროექტში მხოლოდ იმ პროდუქტებს სვამს, რომლებიც რეალურად, ადგილზეა ხელმისაწვდომი. ეს გამორიცხავს ფუჭ მოლოდინებს და იცავს ავტორის თავდაპირველ ჩანაფიქრს.",
        "რა უპირატესობა აქვს მომხმარებლისთვის?",
        "დამკვეთი აღარ იკარგება გაუგებარ ტექნიკურ ნახაზებსა და უსასრულო კატალოგებში. ის თავის პროფილში იღებს სრულყოფილად ორგანიზებულ, გამზადებულ შოპინგ-ლისტს, სადაც თითოეულ ნივთს ფოტო, ზუსტი ფასი და მაღაზია შეესაბამება. მომხმარებელს შეუძლია რეალური პროდუქტი პირდაპირ ეკრანზე ნახოს და იქვე, ღილაკზე ერთი დაჭერით დაადასტუროს ან უარყოს დიზაინერის არჩევანი.",
        "ამასთანავე, პროცესი სრულიად კონტროლირებადია: ბიუჯეტის ცვლილება ლაივ რეჟიმში ჩანს, ხოლო თითოეულ ნივთს აქვს სტატუსი: საყიდელია, შეკვეთილია თუ უკვე ადგილზეა.",
        "Homico-ს ჩაშენებული შოპინგ-ლისტი რემონტის დამღლელ და გაურკვეველ პროცესს იმდენად ამარტივებს, რომ ის სახალისო და სასიამოვნო ხდება.",
      ],
      ru: [
        "Дизайнер создаёт потрясающую, безупречную 3D-визуализацию, но иногда реальный результат оказывается совсем другим. Причина в том, что спроектированная мебель, конкретная плитка или светильник физически не продаются в Грузии, либо их доставка связана с колоссальными расходами. В итоге начинается бесконечный процесс поисков, ведение таблиц в Excel и постоянные попытки доказать, что и когда было согласовано.",
        "Новый встроенный функционал шопинг-листа от Homico решает эту проблему в корне. Это пространство, которое одновременно упрощает жизнь как заказчику, так и архитекторам и дизайнерам.",
        "Что меняется для дизайнеров и архитекторов?",
        "Дизайнерам больше не приходится тратить часы на то, чтобы вручную переносить цены и фотографии в Excel для клиента. Достаточно вставить на платформе ссылку на любой реальный продукт — и сайт автоматически генерирует фото, цену и поставщика. А главное, поскольку Homico связан с крупными строительными базами Грузии, дизайнер добавляет в проект только те товары, которые реально доступны на месте. Это исключает напрасные ожидания и сохраняет первоначальный авторский замысел.",
        "В чём преимущество для потребителя?",
        "Заказчик больше не теряется в непонятных технических чертежах и бесконечных каталогах. Прямо в своём профиле он получает идеально организованный, готовый шопинг-лист, где каждому предмету соответствует фото, точная цена и магазин. Пользователь может увидеть реальный продукт прямо на экране и тут же, одним нажатием кнопки, подтвердить или отклонить выбор дизайнера.",
        "Более того, весь процесс полностью контролируем: изменения бюджета видны в режиме реального времени, а каждый предмет имеет свой статус: к покупке, заказано или уже на месте.",
        "Встроенный шопинг-лист Homico настолько упрощает утомительный и запутанный процесс ремонта, что он становится увлекательным и приятным.",
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
