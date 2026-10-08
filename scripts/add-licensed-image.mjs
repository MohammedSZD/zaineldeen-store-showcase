// Registers one photograph with a documented licence and prepares it for the site.
//
//   npm run image:add -- --file ./photo.jpg --id the-only-one --n 1 \
//     --platform Unsplash --author "Jane Doe" --source-url https://unsplash.com/photos/... \
//     --licence unsplash --retrieved 2026-10-20 [--fit cover|contain] [--licence-url URL] [--notes "..."]
//
// `--id` is a product id from src/data/products.js, or `collection-fragrance|makeup|sleepwear`.
// Licences accepted: unsplash, pexels, cc0, owned, commissioned. For many photos at once use `npm run image:batch`.
// Read the licence page yourself at download time and check restrictions (identifiable people, trademarks,
// sensitive uses) before registering.
import { parseArgs } from 'node:util';
import { check, register } from './lib/register-image.mjs';

const { values: a } = parseArgs({
  options: {
    file: { type: 'string' }, id: { type: 'string' }, n: { type: 'string', default: '1' },
    platform: { type: 'string' }, author: { type: 'string' }, 'source-url': { type: 'string' },
    licence: { type: 'string' }, 'licence-url': { type: 'string' }, retrieved: { type: 'string' },
    fit: { type: 'string', default: 'cover' }, notes: { type: 'string', default: '' },
  },
});
const request = { file: a.file, id: a.id, n: a.n, platform: a.platform, author: a.author, sourceUrl: a['source-url'], licence: a.licence, licenceUrl: a['licence-url'], retrieved: a.retrieved, fit: a.fit, notes: a.notes };

const problems = check(request);
if (problems.length) {
  console.error(`Refusing to register the image:\n - ${problems.join('\n - ')}`);
  process.exit(1);
}
const entry = await register(request);
console.log(`Registered ${a.id} #${entry.n} (${a.licence}). Add it to the evidence log in docs/image-sources.md and run npm test.`);
