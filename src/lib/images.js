import licensed from '../data/licensedImages.json';

// Vite resolves each image to a hashed URL that respects the configured base path.
// Only these folders are bundled: the business's own branding and heritage assets, original illustrations,
// and photos registered with a documented licence. Anything else under assets/ is never shipped.
const modules = import.meta.glob(
  ['/assets/images/branding/*.webp', '/assets/images/heritage/*.webp', '/assets/images/then-now/*.webp', '/assets/images/illustrations/*.svg', '/assets/images/illustrations/bare/*.svg', '/assets/images/licensed/*.webp'],
  { eager: true, query: '?url', import: 'default' },
);

const url = (path) => {
  const found = modules[`/assets/images/${path}`];
  if (!found) throw new Error(`Missing image: ${path}`);
  return found;
};

const art = (name, bare = false) => {
  const src = url(`illustrations/${bare ? 'bare/' : ''}${name}.svg`);
  return { kind: 'art', src, srcset: '', full: src, bleed: false, credit: null };
};

/** Photos for a catalog id (a product id or `collection-<name>`): licensed photos if registered, else the illustration. */
function photos(id, artName = id) {
  const entries = licensed[id] ?? [];
  if (!entries.length) return [art(artName)];
  return entries.map((e) => {
    const base = `licensed/${id}-${e.n}`;
    return {
      kind: 'photo',
      src: url(`${base}-480.webp`),
      srcset: `${url(`${base}-480.webp`)} 480w, ${url(`${base}-960.webp`)} 960w`,
      full: url(`${base}-960.webp`),
      bleed: e.fit === 'cover',
      credit: { author: e.author, platform: e.platform, url: e.sourceUrl },
    };
  });
}

export const productPhotos = (id) => photos(id);
export const productImage = (id, n = 1) => photos(id)[n - 1];
/** Illustration without its own arch backdrop, for placing inside arch-shaped frames. */
export const bareImage = (id) => art(id, true);
export const collectionImage = (name) => photos(`collection-${name}`)[0];
export const brandImage = (name) => url(`branding/${name}`);
export const thenNowImage = (edition, name) => url(`then-now/${edition}-${name}.webp`);
export const heritageImage = (n) => url(`heritage/heritage-${n}.webp`);

/** Owned shopfront photo with a responsive source set. */
export const shopfrontImage = () => ({
  src: url('branding/shopfront-960.webp'),
  srcset: `${url('branding/shopfront-480.webp')} 480w, ${url('branding/shopfront-960.webp')} 960w`,
});
