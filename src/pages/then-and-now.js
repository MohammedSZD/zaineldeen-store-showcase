import { initLayout } from '../components/layout.js';
import { thenNowImage } from '../lib/images.js';
import { t, setMeta, onLangChange } from '../i18n/index.js';
import { $ } from '../lib/dom.js';

// Each tab pairs the same page in both editions.
const TABS = {
  home: { orig: 'legacy/index.html', mod: 'index.html' },
  catalog: { orig: 'legacy/perfumes-women.html', mod: 'shop.html?cat=perfumes' },
  product: { orig: 'legacy/product-coco-mademoiselle.html', mod: 'product.html?id=coco-mademoiselle' },
};

let tab = 'home';
const range = $('#tn-range');

function setSplit() {
  const v = Number(range.value);
  $('#tn-top').style.clipPath = `inset(0 ${100 - v}% 0 0)`;
  $('#tn-line').style.left = `${v}%`;
}

function render() {
  setMeta({ title: t('tn.meta.title'), description: t('tn.meta.desc') });
  const legacy = $('#tn-legacy');
  const modern = $('#tn-modern');
  legacy.src = thenNowImage('legacy', tab);
  modern.src = thenNowImage('modern', tab);
  legacy.alt = t(`tn.alt.legacy.${tab}`);
  modern.alt = t(`tn.alt.modern.${tab}`);
  $('#tn-open-orig').href = TABS[tab].orig;
  $('#tn-open-mod').href = TABS[tab].mod;
  document.querySelectorAll('#tn-tabs [data-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
}

document.querySelectorAll('#tn-tabs [data-tab]').forEach((b) =>
  b.addEventListener('click', () => {
    tab = b.dataset.tab;
    render();
  }),
);
range.addEventListener('input', setSplit);

initLayout();
render();
setSplit();
onLangChange(render);
