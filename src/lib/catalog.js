/** Catalog helpers. Search is language-agnostic: English and Arabic text are matched together. */
import { translate, getLang, localized } from '../i18n/index.js';
import { brandById } from '../data/brands.js';

export const SORT_KEYS = ['featured', 'price-asc', 'price-desc', 'name-asc'];

/** Lower-cases, strips Latin accents and normalises Arabic letter variants and diacritics. */
export const fold = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/['’]/g, '')
    .toLowerCase();

const bothLangs = (key) => `${translate('en', key)} ${translate('ar', key)}`;
const searchTextCache = new Map();

function searchText(product) {
  if (!searchTextCache.has(product.id)) {
    searchTextCache.set(
      product.id,
      fold(
        [
          product.name,
          product.brand,
          brandById[product.brandId]?.ar,
          product.summary,
          product.ar?.name,
          product.ar?.summary,
          bothLangs(`cat.${product.category}`),
          product.sub ? bothLangs(`sub.${product.sub}`) : '',
        ].join(' '),
      ),
    );
  }
  return searchTextCache.get(product.id);
}

/** Every whitespace-separated query term must appear somewhere in the product's searchable text. */
export function matchesQuery(product, query) {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = searchText(product);
  return terms.every((term) => haystack.includes(term));
}

export function filterProducts(products, { q = '', cat = '', sub = '', brands = [], saved = false, wishlist = [] } = {}) {
  const wish = new Set(wishlist);
  const wanted = new Set(brands);
  return products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!sub || p.sub === sub) &&
      (!wanted.size || wanted.has(p.brandId)) &&
      (!saved || wish.has(p.id)) &&
      matchesQuery(p, q),
  );
}

/**
 * Brands available in the current view, with accurate counts. Every active filter except the brand
 * filter itself is applied, so selecting a brand never hides the other brands you could add.
 * Only brands with at least one matching product are returned, sorted by name.
 */
export function brandFacets(products, state = {}) {
  const counts = new Map();
  for (const p of filterProducts(products, { ...state, brands: [] })) {
    if (p.brandId) counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1);
  }
  return [...counts]
    .map(([id, count]) => ({ id, name: brandById[id].name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

export function sortProducts(products, sort = 'featured') {
  const list = [...products];
  const byName = (a, b) => localized(a, 'name').localeCompare(localized(b, 'name'), getLang());
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price || byName(a, b));
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price || byName(a, b));
    case 'name-asc':
      return list.sort(byName);
    default:
      // Featured first, otherwise keep catalog order (Array#sort is stable).
      return list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

/** Products from the same category, preferring the same sub-category. */
export function relatedProducts(products, product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => Number(b.sub === product.sub) - Number(a.sub === product.sub))
    .slice(0, limit);
}

export function countBy(products, key) {
  return products.reduce((acc, p) => ((acc[p[key]] = (acc[p[key]] ?? 0) + 1), acc), {});
}
