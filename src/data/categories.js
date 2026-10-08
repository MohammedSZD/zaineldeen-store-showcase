/**
 * Category structure carried over from the original Zain El Deen site
 * (perfumes, makeup, underwear, pajamas, electrical devices, biocosmetics).
 * Display names and taglines live in src/i18n as `cat.<id>`, `cat.<id>.tag` and `sub.<id>`.
 */
export const categories = [
  { id: 'perfumes', subs: ['women', 'men'] },
  {
    id: 'makeup',
    subs: ['primer', 'concealer', 'foundation', 'powder', 'contour-highlighter', 'bronzer', 'mascara', 'eyeliner', 'kohl', 'eyeshadow', 'eyebrow-pencil', 'lipstick', 'sponges'],
  },
  { id: 'skincare', subs: [] },
  { id: 'pajamas', subs: [] },
  { id: 'underwear', subs: ['women', 'men'] },
  { id: 'electrical', subs: [] },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
