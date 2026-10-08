import { esc, formatPrice } from '../lib/dom.js';
import { productImage } from '../lib/images.js';
import { t, localized, formatSize } from '../i18n/index.js';
import { categoryName } from '../lib/labels.js';
import { isWished } from '../lib/wishlist.js';

export const srcsetAttr = (srcset) => (srcset ? ` srcset="${srcset}"` : '');

export function heartButton(product) {
  const saved = isWished(product.id);
  return `<button type="button" class="wish${saved ? ' is-saved' : ''}" data-wish="${esc(product.id)}" aria-pressed="${saved}" aria-label="${esc(t('card.save', { name: localized(product, 'name') }))}">
    <svg aria-hidden="true" width="20" height="20"><use href="#i-heart"/></svg>
  </button>`;
}

export function productCard(product, { eager = false } = {}) {
  const img = productImage(product.id, 1);
  const name = localized(product, 'name');
  return `<article class="card" data-id="${esc(product.id)}">
    <div class="card__media${img.bleed ? ' card__media--bleed' : ''}">
      <a href="product.html?id=${esc(product.id)}" tabindex="-1" aria-hidden="true">
        <img src="${img.src}"${srcsetAttr(img.srcset)} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
          width="480" height="600" alt="" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
      </a>
      ${heartButton(product)}
    </div>
    <div class="card__body">
      <p class="card__meta">${esc(product.brand || categoryName(product.category))}</p>
      <h3 class="card__title"><a href="product.html?id=${esc(product.id)}">${esc(name)}</a></h3>
      <p class="card__price"><bdi>${formatPrice(product.price)}</bdi>${product.size ? `<span> · ${esc(formatSize(product.size))}</span>` : ''}</p>
    </div>
  </article>`;
}
