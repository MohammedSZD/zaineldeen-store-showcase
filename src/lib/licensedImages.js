/** Rules for registering licensed photographs (see scripts/add-licensed-image.mjs and docs/image-sources.md). */
export const ALLOWED_LICENCES = {
  unsplash: { name: 'Unsplash License', url: 'https://unsplash.com/license' },
  pexels: { name: 'Pexels License', url: 'https://www.pexels.com/license/' },
  cc0: { name: 'Creative Commons CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  owned: { name: 'Owned by the business', url: '' },
  'owner-authorized': { name: 'Owner-authorized: the business owner confirmed permission to publish', url: '' },
  commissioned: { name: 'Commissioned or purchased with written licence', url: '' },
};

/** Returns a list of problems with a manifest entry (empty when valid). */
export function validateEntry(e) {
  const problems = [];
  if (!Number.isInteger(e.n) || e.n < 1) problems.push('n must be a positive integer');
  if (!e.platform) problems.push('missing --platform');
  if (!e.author) problems.push('missing --author (photographer or rights holder)');
  if (e.licence !== 'owner-authorized' && !/^https:\/\/\S+$/.test(e.sourceUrl ?? '')) problems.push('--source-url must be the https URL of the photo page');
  if (!ALLOWED_LICENCES[e.licence]) problems.push(`--licence must be one of: ${Object.keys(ALLOWED_LICENCES).join(', ')}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.retrieved ?? '')) problems.push('--retrieved must be the download date, YYYY-MM-DD');
  if (!['cover', 'contain'].includes(e.fit)) problems.push('--fit must be cover or contain');
  if (e.licence && !['owned', 'commissioned', 'owner-authorized'].includes(e.licence) && !e.licenceUrl) problems.push('missing licence URL');
  return problems;
}
