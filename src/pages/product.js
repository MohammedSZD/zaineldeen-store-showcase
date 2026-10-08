import { initLayout, refreshReveal } from '../components/layout.js';
import { productCard } from '../components/productCard.js';
import { categoryById } from '../data/categories.js';
import { products, productById } from '../data/products.js';
import { relatedProducts } from '../lib/catalog.js';
import { productPhotos } from '../lib/images.js';
import { categoryName, subName } from '../lib/labels.js';
import { t, localized, formatSize, setMeta, onLangChange, isRtl } from '../i18n/index.js';
import { $, esc, formatPrice } from '../lib/dom.js';
import { isWished } from '../lib/wishlist.js';
import { business } from '../data/business.js';

const root = $('#product-root');
const product = productById[new URLSearchParams(location.search).get('id')];
let currentShot = 0;

function notFound() {
  setMeta({ title: t('meta.product.missing'), description: t('meta.product.desc') });
  root.innerHTML = `<div class="empty">
    <h1>${esc(t('product.missing.title'))}</h1>
    <p>${esc(t('product.missing.text'))}</p>
    <a class="btn btn--primary" href="shop.html">${esc(t('product.missing.cta'))}</a>
  </div>`;
  $('#related-section').hidden = true;
}

/** Points the canonical link at this product (only present when the site was built with SITE_URL). */
function updateCanonical(id) {
  const link = $('link[rel="canonical"]');
  if (link) link.href = `${link.href.split('?')[0]}?id=${encodeURIComponent(id)}`;
}

function render(p) {
  const catId = p.category;
  const sub = categoryById[catId].subs.find((id) => id === p.sub);
  const shots = productPhotos(p.id);
  currentShot = Math.min(currentShot, shots.length - 1);
  const saved = isWished(p.id);
  const name = localized(p, 'name');
  const title = `${p.brand ? `${p.brand} ` : ''}${name}`;
  const summary = localized(p, 'summary');
  const details = localized(p, 'details');
  const altFor = (i) => (shots[i].kind === 'art' ? t('gallery.alt.art', { name: title }) : t('gallery.alt', { name: title, n: i + 1, total: shots.length }));
  const noteFor = (i) => {
    const shot = shots[i];
    if (shot.kind === 'art') return esc(t('gallery.art.note'));
    const c = shot.credit;
    if (c && !c.url) return esc(t('gallery.credit.owner'));
    return c ? `${esc(t('gallery.credit', { author: c.author, platform: c.platform }))} <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.platform)}</a>` : '';
  };

  setMeta({ title: t('meta.product.title', { name: title }), description: `${title}: ${summary}` });

  root.innerHTML = `
  <nav class="crumbs" aria-label="${esc(t('crumbs.aria'))}">
    <a href="index.html">${esc(t('nav.home'))}</a> <span aria-hidden="true">/</span>
    <a href="shop.html?cat=${esc(catId)}">${esc(categoryName(catId))}</a> <span aria-hidden="true">/</span>
    <span aria-current="page">${esc(name)}</span>
  </nav>
  <article class="detail">
    <div class="gallery" role="group" aria-roledescription="gallery" aria-label="${esc(t('gallery.aria', { name: title }))}">
      <div class="gallery__stage${shots[currentShot].bleed ? ' gallery__stage--bleed' : ''}">
        <img id="gallery-main" src="${shots[currentShot].full}" width="960" height="1200" alt="${esc(altFor(currentShot))}" decoding="async" fetchpriority="high">
        ${shots.length > 1 ? `<button type="button" class="gallery__nav gallery__nav--prev" data-step="-1" aria-label="${esc(t('gallery.prev'))}"><svg class="i-flip" aria-hidden="true" width="22" height="22"><use href="#i-prev"/></svg></button>
        <button type="button" class="gallery__nav gallery__nav--next" data-step="1" aria-label="${esc(t('gallery.next'))}"><svg class="i-flip" aria-hidden="true" width="22" height="22"><use href="#i-next"/></svg></button>` : ''}
      </div>
      <p class="gallery__note" id="gallery-note">${noteFor(currentShot)}</p>
      ${shots.length > 1 ? `<div class="gallery__thumbs" id="thumbs">${shots
        .map((s, i) => `<button type="button" class="thumb" data-i="${i}" aria-label="${esc(t('gallery.thumb', { n: i + 1, total: shots.length }))}" aria-current="${i === currentShot}"><img src="${s.src}" width="120" height="150" alt="" loading="lazy"></button>`)
        .join('')}</div>` : ''}
    </div>
    <div class="detail__info">
      <p class="eyebrow">${esc(p.brand || categoryName(catId))}</p>
      <h1>${esc(name)}</h1>
      <p class="detail__price"><bdi>${formatPrice(p.price)}</bdi> <span>${esc(t('product.demo'))}${p.size ? ` · ${esc(formatSize(p.size))}` : ''}</span></p>
      <p class="lead">${esc(summary)}</p>
      <ul class="detail__list">${details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
      <dl class="detail__meta">
        <div><dt>${esc(t('product.category'))}</dt><dd><a href="shop.html?cat=${esc(catId)}">${esc(categoryName(catId))}</a>${sub ? ` · <a href="shop.html?cat=${esc(catId)}&amp;sub=${esc(sub)}">${esc(subName(sub))}</a>` : ''}</dd></div>
      </dl>
      <div class="detail__actions">
        <button type="button" class="btn btn--primary wish-btn${saved ? ' is-saved' : ''}" data-wish="${esc(p.id)}" aria-pressed="${saved}">
          <svg aria-hidden="true" width="20" height="20"><use href="#i-heart"/></svg>
          <span class="when-off">${esc(t('product.save'))}</span><span class="when-on">${esc(t('product.saved'))}</span><span class="sr-only"> — ${esc(name)}</span>
        </button>
        <a class="btn btn--ghost" href="${esc(business.social.instagram)}" target="_blank" rel="noopener">${esc(t('product.ask'))}<span class="sr-only"> ${esc(t('external'))}</span></a>
      </div>
      <p class="detail__note">${esc(t('product.note'))}</p>
    </div>
  </article>`;

  const main = $('#gallery-main');
  const show = (i) => {
    currentShot = (i + shots.length) % shots.length;
    main.src = shots[currentShot].full;
    main.alt = altFor(currentShot);
    $('#gallery-note').innerHTML = noteFor(currentShot);
    main.closest('.gallery__stage').classList.toggle('gallery__stage--bleed', shots[currentShot].bleed);
    root.querySelectorAll('.thumb').forEach((th, k) => th.setAttribute('aria-current', String(k === currentShot)));
  };
  const gallery = root.querySelector('.gallery');
  gallery.addEventListener('click', (e) => {
    const th = e.target.closest('.thumb');
    const step = e.target.closest('[data-step]');
    if (th) show(Number(th.dataset.i));
    else if (step) show(currentShot + Number(step.dataset.step));
  });
  // Arrow keys follow the visual direction: in right-to-left layouts the left arrow moves forward.
  gallery.addEventListener('keydown', (e) => {
    if (shots.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const forward = (e.key === 'ArrowRight') !== isRtl();
    show(currentShot + (forward ? 1 : -1));
    e.preventDefault();
  });

  const related = relatedProducts(products, p);
  $('#related-grid').innerHTML = related.map((r) => productCard(r)).join('');
  $('#related-section').hidden = related.length === 0;
  refreshReveal();
}

initLayout();
if (product) {
  updateCanonical(product.id);
  render(product);
} else {
  notFound();
}
onLangChange(() => (product ? render(product) : notFound()));
