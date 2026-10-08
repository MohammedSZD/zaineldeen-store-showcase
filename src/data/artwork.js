/**
 * Artwork specs for the original illustrations used in place of product photography.
 * `kind` selects a drawing in scripts/generate-illustrations.mjs; `colors` are [main, secondary, detail].
 * The drawings are generic, unbranded and made for this project. They do not depict any specific product.
 */
export const artwork = {
  'the-only-one': { kind: 'perfume-feminine', colors: ['#e8a35a', '#1d1517', '#b8935a'] },
  'coco-mademoiselle': { kind: 'perfume-feminine', colors: ['#f0b9a4', '#cfc6c9', '#b8935a'] },
  'coco-mademoiselle-intense': { kind: 'perfume-feminine', colors: ['#d98f6c', '#2a1b1d', '#b8935a'] },
  'no5-parfum': { kind: 'perfume-feminine', colors: ['#ecd28a', '#d8cfd2', '#b8935a'] },
  'armani-si': { kind: 'perfume-feminine', colors: ['#f2c9ae', '#1d1517', '#b8935a'] },
  'gucci-bloom': { kind: 'perfume-feminine', colors: ['#f4cfc8', '#e9c8bf', '#b8935a'] },
  'black-orchid': { kind: 'perfume-masculine', colors: ['#2b1d20', '#2b1d20', '#b8935a'] },
  '212-sexy': { kind: 'perfume-feminine', colors: ['#e9a9b3', '#c9858f', '#b8935a'] },
  '212-men': { kind: 'perfume-masculine', colors: ['#aeb3b8', '#7f858b', '#8d9298'] },
  'bleu-de-chanel': { kind: 'perfume-masculine', colors: ['#27406b', '#1d1517', '#b8935a'] },
  'one-million': { kind: 'perfume-masculine', colors: ['#d9b24a', '#c9a13c', '#8a6a1f'] },
  'versace-eros': { kind: 'perfume-masculine', colors: ['#2f9aa6', '#c9a13c', '#b8935a'] },
  'boss-bottled': { kind: 'perfume-masculine', colors: ['#c79a4a', '#2a2a2e', '#b8935a'] },
  'lacoste-blanc': { kind: 'perfume-masculine', colors: ['#f3f1ee', '#e4e1dc', '#9aa59a'] },
  'ch-men': { kind: 'perfume-masculine', colors: ['#8c4a3e', '#c9c3c0', '#b8935a'] },
  'bara-essence-mascara': { kind: 'mascara', colors: ['#e8a8a4', '#3a2a2c', '#b8935a'] },
  'rouge-velvet-lipstick': { kind: 'lipstick', colors: ['#a1665a', '#2a1b1d', '#b8935a'] },
  'burgundy-matte-lipstick': { kind: 'lipstick', colors: ['#6b1d2c', '#3a1b22', '#b8935a'] },
  'all-day-lip-color': { kind: 'lipstick', colors: ['#c4202f', '#7d1d34', '#b8935a'] },
  'foil-frenzy-palette': { kind: 'palette', colors: ['#d9a58f', '#b3695d', '#8a4a44', '#e8c4a8', '#c98a6a', '#9a5a50', '#f0d4b8', '#a56f60'] },
  'pastel-palette': { kind: 'palette', colors: ['#f2c1d1', '#c9b8e8', '#b9dff0', '#f6e1a8', '#c4e6c9', '#f4b9a8', '#e8c9f0', '#fbd6c0'] },
  'true-match-foundation': { kind: 'foundation', colors: ['#e2bf9c', '#f4ede6', '#b8935a'] },
  'kohl-eye-pencil': { kind: 'kohl', colors: ['#3f5a47', '#2a2a2e', '#b8935a'] },
  'makeup-sponges': { kind: 'sponges', colors: ['#8f6bc4', '#f0a1bf', '#b8935a'] },
  'wow-conditioner': { kind: 'pump-bottle', colors: ['#7a4a2a', '#2a1b1d', '#b8935a'] },
  'moisture-surge-set': { kind: 'giftset', colors: ['#f2cfc9', '#ffffff', '#b8935a'] },
  'pink-pajama-set': { kind: 'pajamas', colors: ['#f2a9bb', '#f7d3dd', '#b8935a'] },
  'grey-fleece-pajama-set': { kind: 'pajamas', colors: ['#aeb3b8', '#c9cdd1', '#b8935a'] },
  'love-plaid-pajama-set': { kind: 'pajamas', colors: ['#9aa0a6', '#4a4f55', '#b8935a'] },
  'love-nightshirt': { kind: 'nightshirt', colors: ['#2a2a2e', '#9aa0a6', '#b8935a'] },
  'boo-pajama-set': { kind: 'pajamas', colors: ['#2a2a2e', '#d8dadc', '#b8935a'] },
  'love-black-pajama-set': { kind: 'pajamas', colors: ['#1d1517', '#c4202f', '#b8935a'] },
  'zip-lounge-set': { kind: 'loungeset', colors: ['#9aa89c', '#7d8a7f', '#b8935a'] },
  'cat-pajama-set': { kind: 'pajamas', colors: ['#f4c4cf', '#f9e1e6', '#b8935a'] },
  'versace-bright-crystal': { kind: 'perfume-feminine', colors: ['#f6d9e2', '#e6a6bd', '#b8935a'] },
  'gucci-premiere': { kind: 'perfume-feminine', colors: ['#e8cf8a', '#c9a13c', '#8a6a1f'] },
  'jpg-ultra-male': { kind: 'perfume-masculine', colors: ['#3d5a7a', '#8d9298', '#b8935a'] },
  'ch-men-prive': { kind: 'perfume-masculine', colors: ['#5a2a2c', '#2a1b1d', '#b8935a'] },
  'joko-eyeshadow-quattro': { kind: 'palette', colors: ['#f2d5d8', '#c9a1c4', '#a999a8', '#7a5a7a'] },
  'joko-loose-powder': { kind: 'compact', colors: ['#e5c3a6', '#2a2a2e', '#b8935a'] },
  'joko-moisturizing-lipstick': { kind: 'lipstick', colors: ['#d98a8a', '#2a2a2e', '#b8935a'] },
  'eveline-art-scenic-concealer': { kind: 'concealer', colors: ['#e8d4b8', '#e8cf8a', '#b8935a'] },
  'eveline-big-volume-mascara': { kind: 'mascara', colors: ['#e8cf8a', '#2a2a2e', '#b8935a'] },
  'eveline-aqua-platinum-lipstick': { kind: 'lipstick', colors: ['#b83a4a', '#c9a13c', '#8a6a1f'] },
  'maybelline-superstay-matte-ink': { kind: 'liquid-lip', colors: ['#b8745a', '#f4ede6', '#b8935a'] },
  'wet-n-wild-cushion': { kind: 'compact', colors: ['#d9b08c', '#1d1517', '#b8935a'] },
  'hair-dryer': { kind: 'hairdryer', colors: ['#f6f2ee', '#d9a58f', '#b8935a'] },
  'steam-straightener': { kind: 'straightener', colors: ['#f6f2ee', '#2a2a2e', '#b8935a'] },
  'facial-toning-device': { kind: 'facial-device', colors: ['#f2eeea', '#c9ced2', '#b8935a'] },
  'haircut-kit': { kind: 'clipper', colors: ['#8e949a', '#2a2a2e', '#b8935a'] },
};

/** Larger compositions used by the home page (hero, category tiles and collections). */
export const compositions = {
  'collection-fragrance': [
    { id: 'the-only-one', x: 30, y: 60, s: 0.8 },
    { id: 'black-orchid', x: 190, y: 120, s: 0.82 },
  ],
  'collection-makeup': [
    { id: 'foil-frenzy-palette', x: 70, y: 140, s: 0.8 },
    { id: 'bara-essence-mascara', x: -10, y: 60, s: 0.7 },
    { id: 'rouge-velvet-lipstick', x: 180, y: 80, s: 0.7 },
  ],
  'collection-sleepwear': [{ id: 'pink-pajama-set', x: 30, y: 40, s: 1 }],
};

/** Illustrations also exported without the arch backdrop, for use inside arch-shaped frames (hero, category tiles). */
export const bareIds = ['the-only-one', 'coco-mademoiselle', 'black-orchid', 'armani-si', 'foil-frenzy-palette', 'wow-conditioner', 'pink-pajama-set', 'hair-dryer', 'rouge-velvet-lipstick'];
