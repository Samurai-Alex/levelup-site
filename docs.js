// Шапка, підвал і мова для сторінок-документів. Мова спільна з головною (localStorage 'lang').
const DOC_T = {
  uk: {home: 'На головну', about: 'Про проєкт', terms: 'Умови використання', privacy: 'Конфіденційність', contact: 'Контакти', offer: 'Інформація на сайті не є публічною офертою'},
  ru: {home: 'На главную', about: 'О проекте', terms: 'Условия использования', privacy: 'Конфиденциальность', contact: 'Контакты', offer: 'Информация на сайте не является публичной офертой'},
  en: {home: 'Home', about: 'About', terms: 'Terms of use', privacy: 'Privacy', contact: 'Contacts', offer: 'The information on this site is not a public offer'},
};
const DOC_PAGES = ['about', 'terms', 'privacy', 'contact'];
const here = (location.pathname.split('/').pop() || '').replace('.html', '');
document.body.insertAdjacentHTML('afterbegin', `<header><div class="wrap bar"><a class="logo" href="./"><img src="img/icon.png" alt=""><span>LEVEL UP</span></a>
  <div class="lang" role="group" aria-label="Language"><button data-l="uk">UA</button><button data-l="ru">RU</button><button data-l="en">EN</button></div></div></header>`);
document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap foot"><span class="cp">© 2026 LEVEL UP</span>${DOC_PAGES.map(p => `<a href="${p}.html" data-d="${p}"${p === here ? ' aria-current="page"' : ''}></a>`).join('')}<span data-d="offer"></span></div></footer>`);
let lang;
try { lang = localStorage.getItem('lang'); } catch (e) { /* приватне вікно */ }
if (!DOC_T[lang]) { const n = (navigator.language || 'en').slice(0, 2); lang = n === 'uk' ? 'uk' : n === 'ru' || n === 'be' ? 'ru' : 'en'; }
function setLang(l) {
  lang = l; document.documentElement.lang = l;
  document.querySelectorAll('article[data-l]').forEach(a => a.classList.toggle('on', a.dataset.l === l));
  document.querySelectorAll('[data-d]').forEach(e => { e.textContent = DOC_T[l][e.dataset.d]; });
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
  const h = document.querySelector(`article[data-l="${l}"] h1`); if (h) document.title = `${h.textContent} — LEVEL UP`;
  try { localStorage.setItem('lang', l); } catch (e) { /* */ }
}
document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.l));
setLang(lang);
