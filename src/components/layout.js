import '@fontsource-variable/inter';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/noto-sans-arabic';
import '@fontsource/amiri/arabic-400.css';
import '@fontsource/amiri/arabic-700.css';
import '../styles/main.css';
import { $, $$ } from '../lib/dom.js';
import { getWishlist, toggleWish, onWishlistChange } from '../lib/wishlist.js';
import { initI18n, setLang, getLang, onLangChange, t } from '../i18n/index.js';
import { mapLinks, formatCoords } from '../data/business.js';

const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-visible'), 2200);
};

function syncWishUI() {
  const ids = new Set(getWishlist());
  $$('[data-wish]').forEach((btn) => {
    const saved = ids.has(btn.dataset.wish);
    btn.classList.toggle('is-saved', saved);
    btn.setAttribute('aria-pressed', String(saved));
  });
  $$('[data-wish-count]').forEach((el) => {
    el.textContent = ids.size;
    el.hidden = ids.size === 0;
  });
}

function initMenu() {
  const toggle = $('#menu-toggle');
  const panel = $('#site-nav');
  if (!toggle || !panel) return;
  const label = () => toggle.setAttribute('aria-label', t(toggle.getAttribute('aria-expanded') === 'true' ? 'menu.close' : 'menu.open'));
  const set = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    label();
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      set(false);
      toggle.focus();
    }
  });
  panel.addEventListener('click', (e) => e.target.closest('a') && set(false));
  matchMedia('(min-width: 960px)').addEventListener('change', (e) => e.matches && set(false));
  onLangChange(label);
}

function initLanguageSwitch() {
  const sync = () => $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang]');
    if (btn && btn.dataset.lang !== getLang()) setLang(btn.dataset.lang);
  });
  onLangChange(sync);
  sync();
}

function initReveal() {
  const items = $$('[data-reveal]:not(.is-in)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((el) => io.observe(el));
}

/** Fills map links and coordinates wherever the contact/location block exists. */
function initLocation() {
  const render = () => {
    const directions = $('#map-directions');
    if (!directions) return;
    directions.href = mapLinks.directions;
    $('#map-osm').href = mapLinks.openStreetMap;
    const coords = $('#location-coords');
    // The coordinates are always left-to-right, even inside Arabic text.
    coords.innerHTML = t('contact.coords', { coords: `<bdi dir="ltr">${formatCoords()}</bdi>` });
  };
  render();
  onLangChange(render);
}

export function initLayout() {
  initI18n();
  // Wishlist buttons are rendered dynamically, so listen at the document level.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wish]');
    if (!btn) return;
    const saved = toggleWish(btn.dataset.wish);
    toast(t(saved ? 'toast.saved' : 'toast.removed'));
  });
  onWishlistChange(syncWishUI);
  syncWishUI();
  initMenu();
  initLanguageSwitch();
  initLocation();
  initReveal();

  const here = location.pathname.split('/').pop() || 'index.html';
  $$('[data-nav]').forEach((a) => {
    const match = a.dataset.nav === here || (here === 'product.html' && a.dataset.nav === 'shop.html');
    if (match) a.setAttribute('aria-current', 'page');
  });
  const q = new URLSearchParams(location.search).get('q');
  const input = $('#site-search');
  if (input && q) input.value = q;
}

/** Re-run the scroll-reveal for nodes added after load. */
export const refreshReveal = initReveal;
export { syncWishUI };
