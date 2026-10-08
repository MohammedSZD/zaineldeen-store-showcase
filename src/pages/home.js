import { initLayout, refreshReveal } from '../components/layout.js';
import { productCard, srcsetAttr } from '../components/productCard.js';
import { categories } from '../data/categories.js';
import { products } from '../data/products.js';
import { productImage, bareImage, collectionImage, shopfrontImage, brandImage, heritageImage } from '../lib/images.js';
import { heritagePieces } from '../data/heritage.js';
import { countBy } from '../lib/catalog.js';
import { categoryName, categoryTagline } from '../lib/labels.js';
import { t, setMeta, onLangChange } from '../i18n/index.js';
import { $, esc } from '../lib/dom.js';

const counts = countBy(products, 'category');

// Hero: the authentic shopfront photo flanked by two illustrated catalog items, arranged as overlapping arches.
/** A licensed photo if one is registered for the product, otherwise its illustration without the arch backdrop. */
const archImage = (id) => {
  const photo = productImage(id);
  return photo.kind === 'photo' ? photo : bareImage(id);
};

function renderHero() {
  const shop = shopfrontImage();
  const card = (n, id) => {
    const img = archImage(id);
    return `<figure class="hero__card hero__card--${n}${img.kind === 'art' ? ' hero__card--art' : ''}"><img src="${img.src}"${srcsetAttr(img.srcset)} sizes="(min-width: 960px) 20vw, 36vw" width="480" height="600" alt="" decoding="async"></figure>`;
  };
  $('#hero-art').innerHTML = `
    ${card(1, 'the-only-one')}
    <figure class="hero__card hero__card--2"><img src="${shop.src}" srcset="${shop.srcset}" sizes="(min-width: 960px) 24vw, 44vw" width="960" height="960" alt="${esc(t('hero.shopfront.alt'))}" fetchpriority="high" decoding="async"></figure>
    ${card(3, 'rouge-velvet-lipstick')}`;
}

// Category tiles use one representative product photo each; empty categories get an honest placeholder.
const representative = {
  perfumes: { id: 'armani-si' },
  makeup: { id: 'foil-frenzy-palette' },
  skincare: { id: 'wow-conditioner' },
  pajamas: { id: 'pink-pajama-set' },
  electrical: { id: 'hair-dryer' },
};

function renderCategories() {
  $('#category-grid').innerHTML = categories
    .map((c) => {
      const n = counts[c.id] ?? 0;
      const rep = representative[c.id];
      const media = rep
        ? (({ src, srcset }) => `<img src="${src}"${srcsetAttr(srcset)} sizes="(min-width: 960px) 16vw, (min-width: 640px) 30vw, 45vw" width="480" height="600" alt="" loading="lazy" decoding="async">`)(archImage(rep.id))
        : `<span class="cat__soon" aria-hidden="true">ZD</span>`;
      return `<li><a class="cat" href="shop.html?cat=${esc(c.id)}">
        <span class="cat__media">${media}</span>
        <span class="cat__name">${esc(categoryName(c.id))}</span>
        <span class="cat__tag">${esc(categoryTagline(c.id))}</span>
        <span class="cat__count">${n ? esc(t('home.cat.count', { count: n })) : esc(t('home.cat.soon'))}</span>
      </a></li>`;
    })
    .join('');
}

function renderFeatured() {
  $('#featured-grid').innerHTML = products
    .filter((p) => p.featured)
    .slice(0, 8)
    .map((p, i) => productCard(p, { eager: i < 4 }))
    .join('');
}

const collections = [
  { id: 'fragrance', img: 'fragrance', href: 'shop.html?cat=perfumes' },
  { id: 'makeup', img: 'makeup', href: 'shop.html?cat=makeup' },
  { id: 'sleepwear', img: 'sleepwear', href: 'shop.html?cat=pajamas' },
];

function renderCollections() {
  $('#collections-grid').innerHTML = collections
    .map((c) => {
      const img = collectionImage(c.img);
      return `<a class="collection collection--${img.kind}" href="${c.href}">
        <img src="${img.src}"${srcsetAttr(img.srcset)} sizes="(min-width: 960px) 30vw, 100vw" width="600" height="750" alt="${img.kind === 'photo' ? esc(t(`home.col.${c.id}.alt`)) : ''}" loading="lazy" decoding="async">
        <span class="collection__label"><strong>${esc(t(`home.col.${c.id}.title`))}</strong><span>${esc(t(`home.col.${c.id}.text`))}</span></span>
      </a>`;
    })
    .join('');
}

/** The original header strip: eight icons around the hand-written name, kept in their original order. */
function renderHeritage() {
  const piece = (p) =>
    `<img class="heritage__piece${p.logo ? ' heritage__logo' : ''}" src="${heritageImage(p.n)}" width="${p.w}" height="${p.h}" alt="${p.logo ? esc(t('heritage.logo.alt')) : ''}" loading="lazy" decoding="async">`;
  const group = (list) => `<div class="heritage__icons">${list.map(piece).join('')}</div>`;
  const icons = heritagePieces.filter((p) => !p.logo);
  const logo = heritagePieces.find((p) => p.logo);
  $('#heritage-row').innerHTML = `${group(icons.slice(0, 4))}${piece(logo)}${group(icons.slice(4))}`;
}

function render() {
  setMeta({ title: t('meta.home.title'), description: t('meta.home.desc') });
  renderCategories();
  renderFeatured();
  renderCollections();
  renderHeritage();
  refreshReveal();
}

initLayout();
renderHero();
const about = shopfrontImage();
Object.assign($('#about-photo'), { src: about.src, srcset: about.srcset });
$('#about-logo').src = brandImage('logo-script-pink.webp');
render();
onLangChange(() => {
  renderHero();
  render();
});
