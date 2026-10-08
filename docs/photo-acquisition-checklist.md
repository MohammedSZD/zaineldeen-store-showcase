# Photography acquisition checklist

Goal: replace the temporary illustrations with real, rights-cleared photographs of the actual products. Nothing here has been done yet; this is the practical plan.

**Why this is needed.** The photographs in the original 2020 project came from retailer and brand websites. Their presence in the old repository is not evidence of permission, so none is published. The site shows original illustrations until a photograph with documented rights exists for each item.

## 1. What to provide

| Need | Count | Source | Notes |
| --- | --- | --- | --- |
| One photo of each product as sold (more if possible) | 50 products, 1 to 3 photos each | **Your own photography in the shop** (best), or written permission from the brand or distributor | The photo must show the exact product named in the catalog. The full list with a brief per item is in [photo-shot-list.csv](photo-shot-list.csv). |
| Three collection photos (fragrance, makeup, sleepwear) | 3 | Your own photos, or licensed lifestyle photography | Unbranded stock is acceptable here because these tiles are not a named product. |
| A larger original of the shopfront (optional) | 1 | You | The current file is 960 px. |
| Confirmation of the silhouette icons in the restored banner | 1 statement | You | See section 5. |

An unrelated stock photo must **not** be used for a named, branded product (for example a generic bottle for "Coco Mademoiselle"). That would misrepresent the product. Keep the illustration until the right photo exists.

## 2. Shooting guide (own photography)

- A phone camera is enough. Use daylight near a window or two soft lamps; avoid direct flash.
- Plain white or light-grey background (a sheet of paper or fabric). Shoot straight on, product centred, a little space around it.
- Portrait orientation, **at least 1600 × 2000 px** (4:5). Keep the original files.
- Show the label, name and size clearly. Include the box in one shot if the product is sold boxed.
- No people, hands, price tags, other brands or shop clutter in frame.
- Name files after the catalog id: `the-only-one-1.jpg`, `the-only-one-2.jpg`, ...

Photos you take yourself are yours. Brand names and logos on genuine goods you sell are shown to identify them, so keep the products unaltered and do not imply the brand endorses the shop.

## 3. Photos from brands, distributors or press kits

1. Ask the brand or its local distributor for permission **in writing** to show their product images on the shop's website.
2. Keep the message and the answer. Record the date, the contact, and any conditions (credit line, no editing, expiry).
3. Register the images with licence `commissioned` (or `owned` if the licence transfers ownership), and put the permission details in `notes`.

## 4. Stock photography (collections and category tiles only)

Suggested sources: Unsplash, Pexels. Before downloading each photo:

1. Open the photo's page and **read the licence on that day**. Note the photographer, the page URL and the date.
2. Check the licence page for restrictions (identifiable people, trademarks and logos, sensitive uses, no resale of unaltered images).
3. Reject photos with readable third-party logos, recognisable people without a documented release, or content that suggests an endorsement.
4. Keep a screenshot or PDF of the photo page showing the licence.

Suggested briefs: unbranded perfume bottles on a neutral surface; makeup flat lay with no readable logos; folded pyjamas or loungewear; hair-care tools; plain skincare bottles.

## 5. Restored heritage banner

The banner restored from the original website (a hand-written "Zain El Deen" with eight silhouette icons) is shown at the owner's request. The logo belongs to the business. The archive does not say where the eight silhouette icons came from; they resemble stock icon sets, some of which require a licence or attribution. **Please confirm** that you or the family drew them, or tell me where they were obtained so the licence terms can be checked and credited.

## 6. Registering the photos

1. Put the photos in a folder, and fill in a copy of [photo-intake-template.csv](photo-intake-template.csv): one row per photo with the file, catalog id, photo number, platform, author or rights holder, source URL or document reference, licence (`owned`, `commissioned`, `unsplash`, `pexels`, `cc0`), download date and fit (`contain` for photos on white, `cover` for lifestyle photos).
2. Run `npm run image:batch -- path/to/photos.csv`. Every row is checked first. The command refuses rows without an author, source, licence and date, writes the optimised WebP files, and records the evidence in `src/data/licensedImages.json`.
3. Add each photo to the evidence log in [image-sources.md](image-sources.md).
4. Run `npm test` and `npm run build`. The product page then shows the photos with a gallery, the credit line where applicable, and the illustration disappears for that product.
5. Regenerate the shot list with `npm run shotlist` to see what is still missing.

## 7. What not to do

- Do not copy photos from retailer, brand or marketplace websites, search results or social media.
- Do not use AI-generated images to stand in for real branded products.
- Do not record a licence you have not read, and do not record a photo whose source you cannot show.
