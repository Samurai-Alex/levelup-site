// Сторінки під пошукові запити («трекер звичок для Windows», «облік витрат на ПК») — кожна мова окремим статичним файлом
// (Google бачить одну мову на адресу). Збирає tools/pages.mjs; тексти правити тут. Лише те, що програма справді вміє.
import fs from 'node:fs';
import path from 'node:path';
import {PACKS_LIVE, PACK_URLS, PACK_TEXT} from './packs.mjs';

const URL0 = 'https://levelup-tracker.com';
const HOME = {ru: '/', uk: '/uk/', en: '/en/'};
export const LANDING = {
  habits: {ru: '/trekker-privychek.html', uk: '/uk/trekker-zvychok.html', en: '/en/habit-tracker.html'},
  money: {ru: '/uchet-rashodov.html', uk: '/uk/oblik-vytrat.html', en: '/en/expense-tracker.html'},
};
const UI = {
  ru: {dl: 'Скачать бесплатно', meta: 'Windows 10 / 11 · без аккаунта · бесплатно в бете', faq: 'Вопросы', more: 'Все возможности LEVEL UP', alt: 'Окно программы LEVEL UP', foot: ['О проекте', 'Конфиденциальность', 'Условия использования', 'Контакты']},
  uk: {dl: 'Завантажити безкоштовно', meta: 'Windows 10 / 11 · без облікового запису · безкоштовно в беті', faq: 'Питання', more: 'Усі можливості LEVEL UP', alt: 'Вікно програми LEVEL UP', foot: ['Про проєкт', 'Конфіденційність', 'Умови використання', 'Контакти']},
  en: {dl: 'Download for free', meta: 'Windows 10 / 11 · no account · free during the beta', faq: 'Questions', more: 'Everything LEVEL UP can do', alt: 'The LEVEL UP app window', foot: ['About', 'Privacy', 'Terms of use', 'Contacts']},
};
const C = {
  habits: {
    img: 'game.jpg',
    ru: {t: 'Трекер привычек для Windows — бесплатно | LEVEL UP', d: 'Бесплатный трекер привычек для Windows 10 и 11: галочки дают опыт и уровни, серии дней, напоминания и статистика. Без аккаунта, работает офлайн.',
      h1: 'Трекер привычек для Windows', lead: 'LEVEL UP — программа для компьютера, в которой привычки превращаются в игру: каждая галочка даёт опыт, растёт уровень, открываются звания и награды. Бесплатно, пока идёт бета.',
      s: [['Что умеет', ['Готовые привычки на выбор или свои — с иконкой и цветом', 'Опыт за каждую галочку, уровни, 30+ званий, значки и награды', 'Серии дней подряд и заморозка серии — 2 дня в месяц, если заболел', 'Напоминания в нужное время', 'Тепловые карты и итоги недели, месяца и года', 'Ежедневник: дела на день и главная цель недели']],
        ['Почему на компьютере', 'Телефон отвлекает уведомлениями, а за компьютером ты и так проводишь день. Привычки, деньги и спорт — в одном окне, без аккаунта и рекламы. Данные хранятся только у тебя, интернет не нужен.'],
        ['Не только привычки', 'В той же программе — <a href="{money}">учёт расходов и бюджет</a>, спорт и здоровье, английский и журнал трейдинга. Лишние вкладки можно спрятать.']],
      q: [['Это бесплатно?', 'Да, пока идёт бета. Все, кто скачал программу в бете, получат полную версию со скидкой 50%.'], ['На каких системах работает?', 'Windows 10 и 11. Версии для Mac и телефона пока нет.'], ['Нужен ли аккаунт?', 'Нет. Скачал, установил — и сразу отмечаешь первую привычку.']]},
    uk: {t: 'Трекер звичок для Windows — безкоштовно | LEVEL UP', d: 'Безкоштовний трекер звичок для Windows 10 і 11: галочки дають досвід і рівні, серії днів, нагадування й статистика. Без облікового запису, працює офлайн.',
      h1: 'Трекер звичок для Windows', lead: 'LEVEL UP — програма для комп’ютера, у якій звички перетворюються на гру: кожна галочка дає досвід, росте рівень, відкриваються звання й нагороди. Безкоштовно, поки триває бета.',
      s: [['Що вміє', ['Готові звички на вибір або свої — з іконкою й кольором', 'Досвід за кожну галочку, рівні, 30+ звань, значки й нагороди', 'Серії днів поспіль і заморозка серії — 2 дні на місяць, якщо захворів', 'Нагадування в потрібний час', 'Теплові карти й підсумки тижня, місяця й року', 'Щоденник: справи на день і головна ціль тижня']],
        ['Чому на комп’ютері', 'Телефон відволікає сповіщеннями, а за комп’ютером ти й так проводиш день. Звички, гроші й спорт — в одному вікні, без облікового запису й реклами. Дані зберігаються лише в тебе, інтернет не потрібен.'],
        ['Не лише звички', 'У тій самій програмі — <a href="{money}">облік витрат і бюджет</a>, спорт і здоров’я, англійська й журнал трейдингу. Зайві вкладки можна сховати.']],
      q: [['Це безкоштовно?', 'Так, поки триває бета. Усі, хто завантажив програму в беті, отримають повну версію зі знижкою 50%.'], ['На яких системах працює?', 'Windows 10 і 11. Версії для Mac і телефона поки немає.'], ['Чи потрібен обліковий запис?', 'Ні. Завантажив, встановив — і одразу відмічаєш першу звичку.']]},
    en: {t: 'Habit tracker for Windows — free | LEVEL UP', d: 'A free habit tracker for Windows 10 and 11: every tick earns XP and levels, with streaks, reminders and stats. No account, works offline.',
      h1: 'Habit tracker for Windows', lead: 'LEVEL UP is a desktop app that turns habits into a game: every tick earns XP, your level grows, titles and rewards unlock. Free during the beta.',
      s: [['What it does', ['Pick ready-made habits or add your own, with an icon and colour', 'XP for every tick, levels, 30+ titles, badges and rewards', 'Day streaks and a streak freeze — 2 days a month if you fall ill', 'Reminders at the right time', 'Heat maps and weekly, monthly and yearly reviews', 'Planner: today’s tasks and the main goal of the week']],
        ['Why on your computer', 'Your phone distracts you with notifications, and you spend the day at your computer anyway. Habits, money and fitness in one window, with no account and no ads. Your data stays on your PC; no internet needed.'],
        ['More than habits', 'The same app has <a href="{money}">expense tracking and budgets</a>, fitness and health, English practice and a trading journal. Hide the tabs you don’t need.']],
      q: [['Is it free?', 'Yes, during the beta. Everyone who downloads the app during the beta gets the full version at 50% off.'], ['Which systems does it run on?', 'Windows 10 and 11. There is no Mac or phone version yet.'], ['Do I need an account?', 'No. Download, install and tick your first habit right away.']]},
  },
  money: {
    img: 'lvl3.webp',
    ru: {t: 'Учёт расходов на ПК — бесплатная программа для Windows | LEVEL UP', d: 'Программа для учёта расходов и доходов на компьютере: бюджет по категориям, лимиты, регулярные платежи и капитал по месяцам. Бесплатно, без аккаунта, офлайн.',
      h1: 'Учёт расходов на ПК', lead: 'LEVEL UP — программа для Windows, где трата записывается одной фразой: «кофе 250» — и расход уже в нужной категории. Видно, сколько можно тратить в день и куда уходят деньги.',
      s: [['Что умеет', ['Доходы и расходы по категориям, лимиты на месяц', 'Подсказка, сколько можно тратить в день, чтобы уложиться в лимит', 'Регулярные платежи и счета — с напоминанием за 1 или 3 дня', 'Несколько валют и актуальные курсы', '«Капитал»: сколько у тебя всего денег и как они растут', 'Цели накоплений', 'С бесплатным ИИ — фото чека сразу превращается в операции']],
        ['Почему не таблица', 'В Excel учёт легко забросить: нужно открыть файл, найти строку, не сломать формулы. Здесь трата записывается за пару секунд, а итоги и графики считаются сами.'],
        ['Твои деньги — только у тебя', 'Без аккаунта и без подключения к банку. Всё хранится на твоём компьютере, автокопии — в твою папку, например OneDrive. А ещё в программе есть <a href="{habits}">трекер привычек</a> и спорт.']],
      q: [['Это бесплатно?', 'Да, пока идёт бета. Все, кто скачал программу в бете, получат полную версию со скидкой 50%.'], ['Программа подключается к банку?', 'Нет. Операции ты записываешь сам — фразой, вручную или по фото чека. Зато твои данные никуда не уходят.'], ['На каких системах работает?', 'Windows 10 и 11.']]},
    uk: {t: 'Облік витрат на ПК — безкоштовна програма для Windows | LEVEL UP', d: 'Програма для обліку витрат і доходів на комп’ютері: бюджет за категоріями, ліміти, регулярні платежі й капітал по місяцях. Безкоштовно, без облікового запису, офлайн.',
      h1: 'Облік витрат на ПК', lead: 'LEVEL UP — програма для Windows, де витрата записується однією фразою: «кава 80» — і витрата вже в потрібній категорії. Видно, скільки можна витрачати за день і куди йдуть гроші.',
      s: [['Що вміє', ['Доходи й витрати за категоріями, ліміти на місяць', 'Підказка, скільки можна витрачати за день, щоб вкластися в ліміт', 'Регулярні платежі й рахунки — з нагадуванням за 1 або 3 дні', 'Кілька валют і актуальні курси', '«Капітал»: скільки в тебе всього грошей і як вони ростуть', 'Цілі накопичень', 'З безкоштовним ШІ — фото чека одразу стає операціями']],
        ['Чому не таблиця', 'В Excel облік легко закинути: треба відкрити файл, знайти рядок, не зламати формули. Тут витрата записується за пару секунд, а підсумки й графіки рахуються самі.'],
        ['Твої гроші — лише в тебе', 'Без облікового запису й без підключення до банку. Усе зберігається на твоєму комп’ютері, автокопії — у твою папку, наприклад OneDrive. А ще в програмі є <a href="{habits}">трекер звичок</a> і спорт.']],
      q: [['Це безкоштовно?', 'Так, поки триває бета. Усі, хто завантажив програму в беті, отримають повну версію зі знижкою 50%.'], ['Програма підключається до банку?', 'Ні. Операції ти записуєш сам — фразою, вручну або за фото чека. Зате твої дані нікуди не йдуть.'], ['На яких системах працює?', 'Windows 10 і 11.']]},
    en: {t: 'Expense tracker for PC — free Windows app | LEVEL UP', d: 'A desktop app for tracking expenses and income: budgets by category, limits, recurring payments and net worth by month. Free, no account, works offline.',
      h1: 'Expense tracker for PC', lead: 'LEVEL UP is a Windows app where you log a purchase in one phrase: “coffee 5” — and the expense lands in the right category. You see how much you can spend per day and where your money goes.',
      s: [['What it does', ['Income and expenses by category, monthly limits', 'A hint of how much you can spend per day to stay within your limit', 'Recurring payments and bills, with a reminder 1 or 3 days ahead', 'Several currencies and live exchange rates', 'Capital: how much money you have in total and how it grows', 'Savings goals', 'With free AI, a receipt photo turns straight into entries']],
        ['Why not a spreadsheet', 'A spreadsheet is easy to abandon: open the file, find the row, don’t break the formulas. Here an expense takes a couple of seconds, and totals and charts add up by themselves.'],
        ['Your money stays with you', 'No account and no bank connection. Everything is stored on your computer, with automatic backups to a folder of your choice, such as OneDrive. The app also has a <a href="{habits}">habit tracker</a> and fitness.']],
      q: [['Is it free?', 'Yes, during the beta. Everyone who downloads the app during the beta gets the full version at 50% off.'], ['Does it connect to my bank?', 'No. You log entries yourself — as a phrase, by hand or from a receipt photo. In return, your data goes nowhere.'], ['Which systems does it run on?', 'Windows 10 and 11.']]},
  },
};

if (PACKS_LIVE) { Object.assign(LANDING, PACK_URLS); Object.assign(C, PACK_TEXT); }   // готові набори — з релізом 1.7.9

const esc = v => String(v).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
export function buildLanding(site) {
  for (const [id, P] of Object.entries(LANDING)) for (const l of Object.keys(P)) {
    const T = C[id][l], U = UI[l], home = HOME[l] + '?s=seo';
    const fill = s => s.replace(/\{(habits|money)\}/g, (m, k) => LANDING[k][l]);
    const ld = {'@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'LEVEL UP', operatingSystem: 'Windows 10, Windows 11', applicationCategory: id === 'money' ? 'FinanceApplication' : 'LifestyleApplication',
      description: T.d, url: URL0 + P[l], inLanguage: l, image: URL0 + '/img/og.png', offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'}};
    const faq = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: T.q.map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a}}))};
    const html = `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(T.t)}</title>
<meta name="description" content="${esc(T.d)}">
<link rel="canonical" href="${URL0}${P[l]}">
${Object.entries(P).map(([k, p]) => `<link rel="alternate" hreflang="${k}" href="${URL0}${p}">`).join('\n')}
<meta property="og:title" content="${esc(T.h1)} — LEVEL UP"><meta property="og:description" content="${esc(T.d)}"><meta property="og:image" content="${URL0}/img/og.png"><meta property="og:url" content="${URL0}${P[l]}">
<link rel="icon" href="/img/icon.png">
<link rel="stylesheet" href="/docs.css">
<style>.lang a{text-decoration:none;font-size:11px;padding:3px 8px;border-radius:7px;color:var(--muted)}.lang a.on{background:var(--acc);color:#04130a;font-weight:700}
.lead{font-size:17px;color:var(--text)}.shot{display:block;width:100%;height:auto;margin:28px 0 8px;border:1px solid rgba(31,184,70,.45);border-radius:14px}
.cta{margin:36px 0 0;padding:26px;border:1px solid var(--line);border-radius:16px;background:var(--card);text-align:center}
.cta a.b{display:inline-block;background:var(--acc);color:#04130a;font-weight:800;text-decoration:none;padding:13px 26px;border-radius:12px}.cta p{margin:10px 0 0;font-size:13px;color:var(--muted)}
details{border-bottom:1px solid var(--line);padding:12px 0}summary{cursor:pointer;font-weight:700}details p{margin:8px 0 0}@media (max-width:600px){.logo span{display:inline;font-size:11px;white-space:nowrap}}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(faq)}</script>
</head>
<body>
<header><div class="wrap bar"><a class="logo" href="${HOME[l]}"><img src="/img/icon.png" alt=""><span>LEVEL UP</span></a>
  <div class="lang">${['uk', 'ru', 'en'].map(k => `<a href="${P[k]}" hreflang="${k}"${k === l ? ' class="on"' : ''}>${k === 'uk' ? 'UA' : k.toUpperCase()}</a>`).join('')}</div></div></header>
<main class="wrap">
<h1>${esc(T.h1)}</h1>
<p class="lead">${esc(T.lead)}</p>
<img class="shot" src="/img/${l}/${C[id].img}" alt="${esc(U.alt)}" loading="lazy">
${T.s.map(([h, b]) => `<h2>${esc(h)}</h2>\n${Array.isArray(b) ? `<ul>${b.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${fill(b)}</p>`}`).join('\n')}
<h2>${esc(U.faq)}</h2>
${T.q.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
<div class="cta"><a class="b" href="${home}">${esc(U.dl)}</a><p>${esc(U.meta)}</p></div>
<p><a href="${HOME[l]}">${esc(U.more)}</a></p>
</main>
<footer><div class="wrap foot"><span class="cp">© 2026 LEVEL UP</span>${["about", "privacy", "terms", "contact"].map((p, i) => `<a href="/${p}.html">${U.foot[i]}</a>`).join("")}</div></footer>
</body>
</html>
`;
    const out = path.join(site, P[l]);
    fs.mkdirSync(path.dirname(out), {recursive: true});
    fs.writeFileSync(out, html);
    console.log(P[l], '—', T.t);
  }
}
