import en from './en.js';
import ar from './ar.js';

export const LANGS = ['en', 'ar'];
export const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'zaineldeen:lang';
const dictionaries = { en, ar };

let current = DEFAULT_LANG;
const listeners = new Set();

const isLang = (v) => LANGS.includes(v);

/** Language from `?lang=`, then the saved preference, then English. */
export function resolveLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (isLang(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage unavailable: fall back to the default */
  }
  return DEFAULT_LANG;
}

export const getLang = () => current;
export const isRtl = () => current === 'ar';

/** Looks up a string. Plural entries are objects keyed by Intl.PluralRules categories. */
export function translate(lang, key, vars = {}) {
  let value = dictionaries[lang]?.[key] ?? dictionaries[DEFAULT_LANG][key];
  if (value === undefined) return key;
  if (typeof value === 'object') {
    const category = new Intl.PluralRules(lang).select(vars.count ?? 0);
    value = value[vars.count === 0 && value.zero ? 'zero' : category] ?? value.other;
  }
  return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

export const t = (key, vars) => translate(current, key, vars);

/** Localised field of a product/category record, falling back to English. */
export const localized = (record, field) => (current === 'ar' ? record.ar?.[field] : undefined) ?? record[field];

/** "100 ml" → "100 مل" in Arabic. */
export const formatSize = (size) => (current === 'ar' ? size.replace(/ml\b/, 'مل') : size);

function applyDocument() {
  const root = document.documentElement;
  root.lang = current;
  root.dir = isRtl() ? 'rtl' : 'ltr';
}

/** Fills every [data-i18n] / [data-i18n-attr] node under `root`. */
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n, { year: new Date().getFullYear() })));
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
}

/** Sets the localised title, description and Open Graph text for the current page. */
export function setMeta({ title, description }) {
  document.title = title;
  const set = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[property="og:locale"]', isRtl() ? 'ar' : 'en_US');
}

export function setLang(lang, { persist = true } = {}) {
  if (!isLang(lang)) return;
  current = lang;
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }
  // Keep a `?lang=` in the address bar in sync so shared links open in the same language.
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }
  applyDocument();
  applyStatic();
  listeners.forEach((fn) => fn(lang));
}

export const onLangChange = (fn) => listeners.add(fn);

export function initI18n() {
  current = resolveLang();
  applyDocument();
  applyStatic();
}
