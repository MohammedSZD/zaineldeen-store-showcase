# Image sources and rights

Status: **the production build ships images owned by the business, original illustrations, and 46 product photographs plus 3 collection photographs from the original 2020 website, published on the owner's written confirmation of permission (2026-10-08).** No other third-party photograph is bundled. 12 products still use illustrations (see section 3).

## 1. Images shipped in the production build

| Image | Origin | Rights basis | Where it is used |
| --- | --- | --- | --- |
| `assets/images/branding/shopfront-480.webp`, `shopfront-960.webp` | Photograph of the family's shop, from the original project | Owner statement: the shopfront photograph belongs to the family business. The windows show incidental brand-advertising posters. | Hero, About, Open Graph image |
| `assets/images/branding/logo-script-pink.webp` | Original script logo | Owner statement: the logos belong to the family business | About section |
| `assets/images/branding/logo-script-black.webp` | Original script logo | Same | Footer (inverted to white) |
| `assets/images/heritage/heritage-1.webp` to `heritage-9.webp` | The header strip of the original 2020 website (`demo.html`): the hand-written Zain El Deen logo (piece 5) between eight black silhouette icons. Restored from the archive as nine separate files, in their original order. They were trimmed and converted to lossless WebP; the artwork is unchanged | Logo: owned by the business (owner statement). Silhouette icons: restored at the owner's request; their origin is not documented in the archive and **needs owner confirmation** (see `photo-acquisition-checklist.md`) | "What we offer" banner on the home page |
| `assets/images/illustrations/*.svg` | Original vector artwork produced by `scripts/generate-illustrations.mjs` from `src/data/artwork.js` | Created for this project; generic and unbranded. Each is labelled "Illustration" in the interface and does not depict any specific product | Product cards and pages, hero, category tiles, collections |
| `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.jpg` | Created for this project (a monogram, and a composition of the shopfront photo and wordmark) | Created for this project; the Open Graph image contains only owned material | Browser tab, link previews |
| `public/legacy/img/shopfront.webp`, `heritage-1.webp` to `heritage-9.webp` | Copies of the shopfront photograph and the heritage banner above | As above | Legacy Showcase |
| `public/legacy/img/placeholder*.svg` | Neutral grey placeholders drawn for this project | Created for this project | Legacy Showcase, in place of retailer photographs |
| `assets/images/then-now/*.webp` | Screenshots of the Legacy Showcase and of the modern site, taken with `npm run capture:then-now` | They show only owned material, original illustrations and placeholders | Then & Now page |
| `assets/images/licensed/*` | 46 product photos (38 products) and 3 collection photos from the original 2020 website | Owner-authorized: the business owner confirmed permission to use and publish them. The confirmation was given in the project review; no separate document was supplied. Recorded per image in `src/data/licensedImages.json` (licence `owner-authorized`, retrieved 2026-10-08) | Product cards and pages, collections, hero |

The owner's statements above were given in the project review and are recorded here as the rights basis. No separate documents were supplied.



## 3. Photography status

38 of 50 products (and the 3 collections) use the owner-authorized photographs. Brand names and trademarks in them belong to their owners; no affiliation or endorsement is implied.

Products that still show a labelled illustration, because no photograph exists for them: Versace Bright Crystal, Gucci Première, Jean Paul Gaultier Ultra Male, CH Men Privé, Joko Eyeshadows Quattro, Joko Loose Powder, Joko Moisturizing Lipstick, Eveline Art Scenic Concealer, Eveline Big Volume Explosion Mascara, Eveline Aqua Platinum Lipstick, Maybelline SuperStay Matte Ink, and wet n wild Cushion Compact. An unrelated photo must never stand in for a named product. A shot list with a brief per item is in [photo-shot-list.csv](photo-shot-list.csv) and the steps are in [photo-acquisition-checklist.md](photo-acquisition-checklist.md).

## 4. Procedure for adding a licensed photograph

1. Download the photo and open its source page. **Read the licence on the day of download** and record any restriction. Do not rely on a summary.
2. Check the photo: no readable third-party logos or trademarks that imply an endorsement, no identifiable people unless a release is documented, no misleading link to a specific product.
3. Register it: `npm run image:add -- --file photo.jpg --id <product-id|collection-name> --n 1 --platform Unsplash --author "Name" --source-url https://… --licence unsplash --retrieved YYYY-MM-DD`. The script refuses to run without author, source URL, licence and retrieval date, writes optimised 480 and 960 px WebP files to `assets/images/licensed/` and records the evidence in `src/data/licensedImages.json`.
4. Add a row to the evidence log below, run `npm test` (it verifies that every registered photo has complete evidence and files, and that nothing unregistered is bundled) and rebuild.
5. Attribution is shown on the product page for registered photos (photographer and platform, linked to the source). Even where a licence does not require attribution, credit is given.

Licences accepted by the tooling: Unsplash License, Pexels License, CC0 1.0, owned by the business, owner-authorized, or commissioned/purchased with a written licence. Terms of the Unsplash and Pexels licences generally allow free use without permission, including commercial use, but exclude resale of unaltered photos and do not cover trademarks, logos, or the rights of depicted people. These summaries could not be re-read in this review and must be confirmed from the licence pages at download time.

### Evidence log for licensed photographs

| Catalog id | Photo page | Photographer | Licence | Licence URL | Retrieved | Restrictions checked |
| --- | --- | --- | --- | --- | --- | --- |
| 38 products and 3 collections (see `src/data/licensedImages.json`) | Original 2020 website | Zain El Deen Store | Owner-authorized (permission confirmed by the business owner) | n/a | 2026-10-08 | Owner confirmation recorded; photos of people appear only in the pajama and loungewear product photos |

## 5. Screenshots

The screenshots in `docs/screenshots/` were produced from the default build and contain only the images listed in section 1.
