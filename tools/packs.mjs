// Сторінки під готові набори звичок (LEVEL UP 1.7.9): 4 набори × 3 мови. Склад — як у програмі (app/js, коміт abb2d9f).
// Поки PACKS_LIVE = false, сторінки не збираються й не потрапляють у sitemap. У день релізу 1.7.9 — поставити true і запустити node tools/pages.mjs.
export const PACKS_LIVE = false || process.env.PACKS === '1';   // PACKS=1 — зібрати локально для перегляду, не комітити результат

export const PACK_URLS = {
  student: {ru: '/privychki-dlya-studenta.html', uk: '/uk/zvychky-dlya-studenta.html', en: '/en/habits-for-students.html'},
  freelancer: {ru: '/privychki-dlya-frilansera.html', uk: '/uk/zvychky-dlya-frilansera.html', en: '/en/habits-for-freelancers.html'},
  sport: {ru: '/privychki-dlya-sporta.html', uk: '/uk/zvychky-dlya-sportu.html', en: '/en/fitness-habits.html'},
  cushion: {ru: '/finansovaya-podushka.html', uk: '/uk/finansova-podushka.html', en: '/en/emergency-fund.html'},
};

// name — як набір підписаний у програмі; h — звички; w — віджети на Головній
const P = {
  student: {
    ru: {name: 'Студент', h: ['Английский', '5 новых слов', 'Чтение 20 мин', 'Спланировать день', 'Сон 8 часов', 'Пить воду', 'Без телефона перед сном'], w: ['Таймер фокуса', 'Английский', 'Планы на сегодня', 'Лимиты бюджета'],
      t: 'Привычки для студента — готовый набор в трекере | LEVEL UP', h1: 'Привычки для студента',
      lead: 'Готовый набор в LEVEL UP: английский, чтение, план дня и нормальный сон — то, что помогает учиться без авралов. Одно нажатие — и привычки на месте, лишнее можно снять.',
      why: 'Учёба — это марафон, а не сессия. Маленькие ежедневные шаги — 5 слов, 20 минут чтения, план на день — за семестр складываются в результат, а галочки с опытом и уровнями не дают бросить.'},
    uk: {name: 'Студент', h: ['Англійська', '5 нових слів', 'Читання 20 хв', 'Спланувати день', 'Сон 8 годин', 'Пити воду', 'Без телефону перед сном'], w: ['Таймер фокусу', 'Англійська', 'Плани на сьогодні', 'Ліміти бюджету'],
      t: 'Звички для студента — готовий набір у трекері | LEVEL UP', h1: 'Звички для студента',
      lead: 'Готовий набір у LEVEL UP: англійська, читання, план дня й нормальний сон — те, що допомагає вчитися без авралів. Одне натискання — і звички на місці, зайве можна зняти.',
      why: 'Навчання — це марафон, а не сесія. Маленькі щоденні кроки — 5 слів, 20 хвилин читання, план на день — за семестр складаються в результат, а галочки з досвідом і рівнями не дають кинути.'},
    en: {name: 'Student', h: ['English', '5 new words', 'Read 20 min', 'Plan the day', 'Sleep 8 hours', 'Drink water', 'No phone before bed'], w: ['Focus timer', 'English', 'Today’s plans', 'Budget limits'],
      t: 'Habits for students — a ready set in a habit tracker | LEVEL UP', h1: 'Habits for students',
      lead: 'A ready set in LEVEL UP: English, reading, planning the day and proper sleep — what helps you study without last-minute panic. One click and the habits are in; untick anything you don’t need.',
      why: 'Studying is a marathon, not exam week. Small daily steps — 5 words, 20 minutes of reading, a plan for the day — add up over a semester, and ticks with XP and levels keep you from quitting.'},
  },
  freelancer: {
    ru: {name: 'Фрилансер', h: ['Спланировать день', 'Записать мысли', 'Прогулка на улице', 'Растяжка', 'Без телефона перед сном', 'Учёт расходов'], w: ['Таймер фокуса', 'Доходы и расходы', 'Личный капитал', 'Ближайшие платежи'],
      t: 'Привычки для фрилансера — готовый набор в трекере | LEVEL UP', h1: 'Привычки для фрилансера',
      lead: 'Готовый набор в LEVEL UP для тех, кто работает на себя: план дня, записи мыслей, прогулки, растяжка и учёт расходов. Режим без начальника — и деньги под контролем.',
      why: 'Когда никто не задаёт режим, его легко потерять. План на день и таймер фокуса держат работу, прогулка и растяжка — спину, а доходы, расходы и ближайшие платежи — нерегулярный заработок.'},
    uk: {name: 'Фрилансер', h: ['Спланувати день', 'Записати думки', 'Прогулянка надворі', 'Розтяжка', 'Без телефону перед сном', 'Облік витрат'], w: ['Таймер фокусу', 'Доходи й витрати', 'Особистий капітал', 'Найближчі платежі'],
      t: 'Звички для фрилансера — готовий набір у трекері | LEVEL UP', h1: 'Звички для фрилансера',
      lead: 'Готовий набір у LEVEL UP для тих, хто працює на себе: план дня, записи думок, прогулянки, розтяжка й облік витрат. Режим без начальника — і гроші під контролем.',
      why: 'Коли ніхто не задає режим, його легко втратити. План на день і таймер фокусу тримають роботу, прогулянка й розтяжка — спину, а доходи, витрати й найближчі платежі — нерегулярний заробіток.'},
    en: {name: 'Freelancer', h: ['Plan the day', 'Write down thoughts', 'Walk outside', 'Stretching', 'No phone before bed', 'Track expenses'], w: ['Focus timer', 'Income & expenses', 'Personal capital', 'Upcoming payments'],
      t: 'Habits for freelancers — a ready set in a habit tracker | LEVEL UP', h1: 'Habits for freelancers',
      lead: 'A ready set in LEVEL UP for people who work for themselves: plan the day, write down thoughts, walk, stretch and track expenses. A routine without a boss — and money under control.',
      why: 'When nobody sets your routine, it’s easy to lose it. A daily plan and a focus timer keep the work going, walks and stretching look after your back, and income, expenses and upcoming payments keep irregular pay in check.'},
  },
  sport: {
    ru: {name: 'Спорт и форма', h: ['Тренировка', 'Пробежка', 'Прогулка на улице', 'Пить воду', 'Сон 8 часов', 'Растяжка', 'Без сахара'], w: ['Спорт', 'Здоровье', 'Прогресс'],
      t: 'Привычки для спорта и формы — готовый набор | LEVEL UP', h1: 'Привычки для спорта и формы',
      lead: 'Готовый набор в LEVEL UP: тренировки, пробежки, прогулки, вода, сон, растяжка и без сахара. Форма строится не за одну тренировку, а каждый день.',
      why: 'Форма — это тренировки плюс восстановление. Набор держит и то, и другое: на Главной видно спорт за неделю, сон и воду, а прогресс уровня подталкивает не пропускать.'},
    uk: {name: 'Спорт і форма', h: ['Тренування', 'Пробіжка', 'Прогулянка надворі', 'Пити воду', 'Сон 8 годин', 'Розтяжка', 'Без цукру'], w: ['Спорт', 'Здоровʼя', 'Прогрес'],
      t: 'Звички для спорту й форми — готовий набір | LEVEL UP', h1: 'Звички для спорту й форми',
      lead: 'Готовий набір у LEVEL UP: тренування, пробіжки, прогулянки, вода, сон, розтяжка й без цукру. Форма будується не за одне тренування, а щодня.',
      why: 'Форма — це тренування плюс відновлення. Набір тримає і те, і інше: на Головній видно спорт за тиждень, сон і воду, а прогрес рівня підштовхує не пропускати.'},
    en: {name: 'Sport and fitness', h: ['Workout', 'Run', 'Walk outside', 'Drink water', 'Sleep 8 hours', 'Stretching', 'No sugar'], w: ['Sport', 'Health', 'Progress'],
      t: 'Fitness habits — a ready set in a habit tracker | LEVEL UP', h1: 'Habits for sport and fitness',
      lead: 'A ready set in LEVEL UP: workouts, runs, walks, water, sleep, stretching and no sugar. Fitness isn’t built in one session — it’s built every day.',
      why: 'Fitness is training plus recovery. The set covers both: Home shows your week of sport, sleep and water, and level progress nudges you not to skip.'},
  },
  cushion: {
    ru: {name: 'Финансовая подушка', h: ['Учёт расходов', 'Без импульсивных покупок', 'Отложить деньги'], w: ['Личный капитал', 'Доходы и расходы', 'Цели накоплений', 'Лимиты бюджета'],
      t: 'Финансовая подушка безопасности — готовый набор привычек | LEVEL UP', h1: 'Финансовая подушка безопасности',
      lead: 'Готовый набор в LEVEL UP: учёт расходов, без импульсивных покупок и отложить деньги — три привычки, из которых складывается подушка. Плюс виджеты капитала, целей накоплений и лимитов.',
      why: 'Подушка безопасности — обычно 3–6 месяцев расходов. Чтобы её собрать, нужно знать, сколько уходит, не тратить на эмоциях и откладывать регулярно. Цель накоплений показывает, сколько осталось, а <a href="{money}">учёт расходов</a> — куда утекают деньги.'},
    uk: {name: 'Фінансова подушка', h: ['Облік витрат', 'Без імпульсивних покупок', 'Відкласти гроші'], w: ['Особистий капітал', 'Доходи й витрати', 'Цілі накопичень', 'Ліміти бюджету'],
      t: 'Фінансова подушка безпеки — готовий набір звичок | LEVEL UP', h1: 'Фінансова подушка безпеки',
      lead: 'Готовий набір у LEVEL UP: облік витрат, без імпульсивних покупок і відкласти гроші — три звички, з яких складається подушка. Плюс віджети капіталу, цілей накопичень і лімітів.',
      why: 'Подушка безпеки — зазвичай 3–6 місяців витрат. Щоб її зібрати, треба знати, скільки йде, не витрачати на емоціях і відкладати регулярно. Ціль накопичень показує, скільки лишилося, а <a href="{money}">облік витрат</a> — куди витікають гроші.'},
    en: {name: 'Emergency fund', h: ['Track expenses', 'No impulse buys', 'Save money'], w: ['Personal capital', 'Income & expenses', 'Savings goals', 'Budget limits'],
      t: 'Emergency fund — a ready set of money habits | LEVEL UP', h1: 'Build an emergency fund',
      lead: 'A ready set in LEVEL UP: track expenses, no impulse buys and save money — the three habits an emergency fund is made of. Plus widgets for capital, savings goals and budget limits.',
      why: 'An emergency fund is usually 3–6 months of expenses. To build it, you need to know where money goes, avoid emotional spending and save regularly. A savings goal shows how much is left, and <a href="{money}">expense tracking</a> shows where the money leaks.'},
  },
};

const L = {
  ru: {d: (n, h) => `Готовый набор «${n}» в трекере LEVEL UP: ${h.join(', ').toLowerCase()}. Бесплатная программа для Windows, без аккаунта.`,
    s: ['Что в наборе', 'На Главной появятся', 'Как добавить', 'Зачем это', 'Другие наборы'],
    how: n => `Скачай LEVEL UP и открой: в приветствии есть вкладка «Готовые наборы». Нажми «${n}» — привычки набора отметятся, любую можно снять или добавить свою. Позже набор можно добавить из окна «Добавить привычки» — повтор ничего не задваивает.`,
    q: [['Это бесплатно?', 'Да, пока идёт бета. Все, кто скачал программу в бете, получат полную версию со скидкой 50%.'],
      ['Можно поменять набор под себя?', 'Да. Набор только отмечает привычки: любую можно снять, добавить другую из списка или свою.'],
      ['Есть версия для телефона?', 'Пока только Windows 10 и 11. Версия для телефона в планах.']]},
  uk: {d: (n, h) => `Готовий набір «${n}» у трекері LEVEL UP: ${h.join(', ').toLowerCase()}. Безкоштовна програма для Windows, без облікового запису.`,
    s: ['Що в наборі', 'На Головній з’являться', 'Як додати', 'Навіщо це', 'Інші набори'],
    how: n => `Завантаж LEVEL UP і відкрий: у привітанні є вкладка «Готові набори». Натисни «${n}» — звички набору відмітяться, будь-яку можна зняти або додати свою. Пізніше набір можна додати з вікна «Додати звички» — повтор нічого не подвоює.`,
    q: [['Це безкоштовно?', 'Так, поки триває бета. Усі, хто завантажив програму в беті, отримають повну версію зі знижкою 50%.'],
      ['Чи можна змінити набір під себе?', 'Так. Набір лише відмічає звички: будь-яку можна зняти, додати іншу зі списку або свою.'],
      ['Є версія для телефона?', 'Поки тільки Windows 10 і 11. Версія для телефона в планах.']]},
  en: {d: (n, h) => `The “${n}” ready set in the LEVEL UP habit tracker: ${h.join(', ').toLowerCase()}. A free Windows app, no account.`,
    s: ['What’s in the set', 'Added to Home', 'How to add it', 'Why it works', 'Other sets'],
    how: n => `Download LEVEL UP and open it: the welcome window has a “Ready sets” tab. Click “${n}” — its habits get ticked, and you can untick any or add your own. Later you can add the set from the “Add habits” window — adding it again never creates duplicates.`,
    q: [['Is it free?', 'Yes, during the beta. Everyone who downloads the app during the beta gets the full version at 50% off.'],
      ['Can I change the set?', 'Yes. A set only ticks habits: you can untick any, add another one from the list or your own.'],
      ['Is there a phone version?', 'Windows 10 and 11 only, for now. A phone version is planned.']]},
};

const esc = v => String(v).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
// тексти у форматі C з landing.mjs: {img, ru: {t, d, h1, lead, s, q}, …}; рядки в s — HTML (проходять через fill)
export const PACK_TEXT = Object.fromEntries(Object.entries(P).map(([id, by]) => [id, {img: 'game.jpg', ...Object.fromEntries(Object.entries(by).map(([l, T]) => {
  const U = L[l], other = Object.keys(P).filter(k => k !== id).map(k => `<a href="${PACK_URLS[k][l]}">${esc(P[k][l].name)}</a>`).join(' · ');
  return [l, {t: T.t, d: U.d(T.name, T.h), h1: T.h1, lead: T.lead,
    s: [[U.s[0], T.h], [U.s[1], T.w], [U.s[2], esc(U.how(T.name))], [U.s[3], T.why], [U.s[4], other]], q: U.q}];
}))}]));
