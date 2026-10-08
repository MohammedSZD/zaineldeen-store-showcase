import { initLayout } from '../components/layout.js';
import { productCard } from '../components/productCard.js';
import { categories, categoryById } from '../data/categories.js';
import { products } from '../data/products.js';
import { SORT_KEYS, filterProducts, sortProducts, brandFacets, countBy } from '../lib/catalog.js';
import { brandById } from '../data/brands.js';
import { categoryName, categoryTagline, subName } from '../lib/labels.js';
import { getWishlist, onWishlistChange } from '../lib/wishlist.js';
import { t, setMeta, onLangChange } from '../i18n/index.js';
import { $, esc } from '../lib/dom.js';

const catCounts = countBy(products, 'category');

const params = new URLSearchParams(location.search);
const state = {
  q: params.get('q') ?? '',
  cat: categoryById[params.get('cat')] ? params.get('cat') : '',
  sub: params.get('sub') ?? '',
  // `brand=chanel,dolce-gabbana`: unknown ids are ignored.
  brands: (params.get('brand') ?? '').split(',').filter((id) => brandById[id]),
  sort: SORT_KEYS.includes(params.get('sort')) ? params.get('sort') : 'featured',
  saved: params.get('saved') === '1',
};

const els = {
  q: $('#shop-q'),
  sort: $('#shop-sort'),
  saved: $('#shop-saved'),
  catChips: $('#cat-chips'),
  subChips: $('#sub-chips'),
  brandBar: $('#brandbar'),
  brandToggle: $('#brand-toggle'),
  brandCount: $('#brand-count'),
  brandPills: $('#brand-pills'),
  brandClear: $('#brand-clear'),
  brandPanel: $('#brand-panel'),
  brandList: $('#brand-list'),
  results: $('#results'),
  grid: $('#product-grid'),
  empty: $('#empty'),
  emptyTitle: $('#empty-title'),
  emptyText: $('#empty-text'),
  title: $('#shop-title'),
  lead: $('#shop-lead'),
};

const chip = (attr, value, label, count, active) =>
  `<button type="button" class="chip" data-${attr}="${esc(value)}" aria-pressed="${active}">${esc(label)}${count != null ? ` <span>${count}</span>` : ''}</button>`;

function syncUrl() {
  // Rebuild from scratch (keeping only an explicit `lang`) so cleared filters never linger in the URL.
  const lang = new URLSearchParams(location.search).get('lang');
  const next = new URLSearchParams();
  if (lang) next.set('lang', lang);
  if (state.q) next.set('q', state.q);
  if (state.cat) next.set('cat', state.cat);
  if (state.sub) next.set('sub', state.sub);
  if (state.brands.length) next.set('brand', state.brands.join(','));
  if (state.sort !== 'featured') next.set('sort', state.sort);
  if (state.saved) next.set('saved', '1');
  const qs = next.toString();
  history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
}

function renderChips() {
  els.catChips.innerHTML =
    chip('cat', '', t('shop.all'), products.length, !state.cat) +
    categories.map((c) => chip('cat', c.id, categoryName(c.id), catCounts[c.id] ?? 0, state.cat === c.id)).join('');

  const subCounts = countBy(products.filter((p) => p.category === state.cat), 'sub');
  const subs = state.cat ? categoryById[state.cat].subs.filter((id) => subCounts[id]) : [];
  els.subChips.hidden = subs.length === 0;
  els.subChips.innerHTML = subs.length
    ? chip('sub', '', t('shop.all.in', { name: categoryName(state.cat) }), null, !state.sub) + subs.map((id) => chip('sub', id, subName(id), subCounts[id], state.sub === id)).join('')
    : '';
}

function emptyMessage(hasFilters) {
  if (state.saved && !getWishlist().length) return [t('shop.empty.wishlist.title'), t('shop.empty.wishlist.text')];
  if (state.brands.length) return [t('shop.empty.none.title'), t('shop.empty.brand')];
  if (state.cat && !catCounts[state.cat] && !state.q) {
    return [t('shop.empty.soon.title', { name: categoryName(state.cat) }), t('shop.empty.soon.text')];
  }
  return [t('shop.empty.none.title'), t(hasFilters ? 'shop.empty.none.filtered' : 'shop.empty.none.plain')];
}

let brandPanelOpen = false;

const brandContext = () => ({ q: state.q, cat: state.cat, sub: state.sub, saved: state.saved, wishlist: getWishlist() });

/** Drops selected brands that do not exist in the newly chosen category. (Changing the type keeps them, so going back restores the view.) */
function pruneBrands() {
  const available = new Set(brandFacets(products, { cat: state.cat }).map((f) => f.id));
  state.brands = state.brands.filter((id) => available.has(id));
}

function renderBrands() {
  const facets = brandFacets(products, brandContext());
  // A selected brand that the current search or filters leave empty stays listed (with 0) so it can be removed.
  const listed = [...facets, ...state.brands.filter((id) => !facets.some((f) => f.id === id)).map((id) => ({ id, name: brandById[id].name, count: 0 }))];
  els.brandBar.hidden = listed.length === 0;
  if (listed.length === 0) return;

  const focusedId = document.activeElement?.closest?.('#brand-list') ? document.activeElement.value : null;
  els.brandList.innerHTML = listed
    .map(
      (f) => `<li><label class="brand-opt"><input type="checkbox" value="${esc(f.id)}"${state.brands.includes(f.id) ? ' checked' : ''}>
        <span class="brand-opt__name"><bdi>${esc(f.name)}</bdi></span><span class="brand-opt__count">${f.count}</span></label></li>`,
    )
    .join('');
  if (focusedId) els.brandList.querySelector(`input[value="${CSS.escape(focusedId)}"]`)?.focus();

  els.brandPills.innerHTML = state.brands
    .map((id) => `<li><button type="button" class="pill" data-brand-remove="${esc(id)}"><bdi>${esc(brandById[id].name)}</bdi><svg aria-hidden="true" width="14" height="14"><use href="#i-close"/></svg><span class="sr-only">${esc(t('shop.brand.remove', { name: brandById[id].name }))}</span></button></li>`)
    .join('');
  els.brandCount.hidden = state.brands.length === 0;
  // Visible number plus a screen-reader suffix, so the accessible name still contains the visible text.
  els.brandCount.innerHTML = `${state.brands.length}<span class="sr-only"> ${esc(t('shop.brand.selected.sr'))}</span>`;
  els.brandClear.hidden = state.brands.length === 0;
  els.brandToggle.setAttribute('aria-expanded', String(brandPanelOpen));
  els.brandPanel.hidden = !brandPanelOpen;
}

function renderSortOptions() {
  els.sort.innerHTML = SORT_KEYS.map((key) => `<option value="${key}">${esc(t(`sort.${key}`))}</option>`).join('');
}

function render() {
  const list = sortProducts(filterProducts(products, { ...state, wishlist: getWishlist() }), state.sort);

  renderChips();
  renderBrands();
  els.q.value = state.q;
  els.sort.value = state.sort;
  els.saved.checked = state.saved;

  const heading = state.saved ? t('shop.wishlist.title') : state.cat ? categoryName(state.cat) : t('shop.title');
  els.title.textContent = heading;
  els.lead.textContent = state.cat && !state.saved ? categoryTagline(state.cat) : t('shop.lead');
  setMeta(
    state.saved
      ? { title: t('meta.wishlist.title'), description: t('meta.shop.desc') }
      : state.cat
        ? { title: t('meta.cat.title', { name: categoryName(state.cat) }), description: t('meta.shop.desc') }
        : { title: t('meta.shop.title'), description: t('meta.shop.desc') },
  );

  const hasFilters = Boolean(state.q || state.cat || state.sub || state.brands.length || state.saved);
  els.results.textContent = t('shop.results', { count: list.length }) + (state.q ? t('shop.results.q', { q: state.q }) : '');
  els.grid.innerHTML = list.map((p, i) => productCard(p, { eager: i < 4 })).join('');
  els.grid.hidden = list.length === 0;

  els.empty.hidden = list.length > 0;
  if (!list.length) {
    const [title, text] = emptyMessage(hasFilters);
    els.emptyTitle.textContent = title;
    els.emptyText.textContent = text;
    $('#reset').hidden = !hasFilters;
  }
  syncUrl();
}

let timer;
els.q.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.q = els.q.value.trim();
    render();
  }, 150);
});
$('#toolbar').addEventListener('submit', (e) => e.preventDefault());
els.sort.addEventListener('change', () => {
  state.sort = els.sort.value;
  render();
});
els.saved.addEventListener('change', () => {
  state.saved = els.saved.checked;
  render();
});
els.catChips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  state.cat = b.dataset.cat;
  state.sub = '';
  pruneBrands();
  render();
  els.catChips.querySelector('[aria-pressed="true"]')?.focus();
});
els.subChips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sub]');
  if (!b) return;
  state.sub = b.dataset.sub;
  render();
  els.subChips.querySelector('[aria-pressed="true"]')?.focus();
});
$('#reset').addEventListener('click', () => {
  Object.assign(state, { q: '', cat: '', sub: '', brands: [], saved: false });
  render();
  els.q.focus();
});
els.brandToggle.addEventListener('click', () => {
  brandPanelOpen = !brandPanelOpen;
  renderBrands();
});
els.brandList.addEventListener('change', (e) => {
  const id = e.target.value;
  state.brands = e.target.checked ? [...state.brands, id] : state.brands.filter((b) => b !== id);
  render();
});
els.brandPills.addEventListener('click', (e) => {
  const b = e.target.closest('[data-brand-remove]');
  if (!b) return;
  state.brands = state.brands.filter((id) => id !== b.dataset.brandRemove);
  render();
  els.brandToggle.focus();
});
els.brandClear.addEventListener('click', () => {
  state.brands = [];
  render();
  els.brandToggle.focus();
});
els.brandBar.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && brandPanelOpen) {
    brandPanelOpen = false;
    renderBrands();
    els.brandToggle.focus();
  }
});
// In the saved view, un-saving an item should remove it from the list.
onWishlistChange(() => state.saved && render());

initLayout();
renderSortOptions();
render();
onLangChange(() => {
  renderSortOptions();
  render();
});
