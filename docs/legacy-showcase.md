# Legacy Showcase (original 2020 edition)

`public/legacy/` is a sanitized, static presentation of the original 2020 website. It keeps the look, navigation, colours, logos, category structure and the hand-drawn banner, and replaces everything that is private, unlicensed or not accurate with a neutral placeholder. It is copied unchanged into the production build as `/legacy/` and linked from the modern site and the Then & Now page.

The raw original is not part of this edition. It stays in the private archive.

## What is kept

| Kept | Notes |
| --- | --- |
| Layout and look | The original dark Bootstrap 3 navigation bar with its drop-down menus, the orange headings, the card grid, the footer and the original `demo.css` stylesheet, verbatim |
| Navigation and structure | 28 pages: home, 2 perfume pages, 9 makeup pages, electrical devices, pajamas, biocosmetics, 2 underwear pages, contact, about and 9 product pages. Page names are now plain ASCII file names |
| Heritage artwork | The 9-piece banner of silhouettes and the hand-written logo (same files the modern home page uses) |
| Family-owned photography | The shopfront photograph, on the home and about pages |
| Business location | Al-Remal, Gaza, as a directions link |
| Social profiles | The shop's Instagram and Facebook links |
| Category and product names, and the prices shown in 2020 | Shown as originally published, with a visible banner saying they are not current and that nothing can be ordered |

## What is replaced or removed, and why

| Item | Treatment | Reason |
| --- | --- | --- |
| Product and category photographs | Neutral SVG placeholders in the original card shapes | They came from retailers and have no licence on record |
| Product descriptions on category cards | Removed; a note says the description is not republished | Copied from retailer pages |
| "In stock", dispatch times and similar claims | Removed | Not true of the showcase and never verified |
| The product detail pages | Rebuilt from a neutral template with the product name | The originals were e-commerce template pages with fake bank offers, star ratings and reviews, delivery dates, a seller name, placeholder text and dummy prices. None of that describes this shop |
| Contact page | Social links and the directions link only | The original listed phone numbers and people |
| About page | Footer text and shopfront photograph only | The original included a personal form |
| Footer | Template-author links and placeholder social links removed | Not the shop's links |
| Search box | Present but disabled | It was never connected to anything |
| Scripts and styles from other hosts | Replaced with local copies of Bootstrap 3.4.1 and Font Awesome 4.7.0, plus jQuery 3.7.1 | No requests leave the site. jQuery 1.12.4 was replaced by a supported release; Bootstrap 3 works with it |
| Pages with no real content (empty mascara, makeup and about-us pages), an eyeliner page and two retailer page copies | Not included | Empty or third-party |

Each included page is assembled from carried-over fragments (navigation, footer, banner) plus an allow-list of facts (titles, product names, prices). Anything not on the list is therefore left out by default rather than removed afterwards.

## Small changes for accessibility and phones

These are the only deliberate departures from the original look, made in `css/legacy.css`:

- the yellow buttons use dark text for contrast;
- heritage images are scaled with `object-fit` so they do not distort;
- a visible keyboard focus outline and a skip link;
- below 768 px the navigation bar sits in the page flow instead of covering it;
- every page has `noindex`, so search engines index the modern site rather than the archive.

## Checks

`tests/unit/legacy.test.mjs` checks, for every page: no `file:` paths, iframes, password fields, contact links, outside scripts or stylesheets; outside links limited to the social profiles and map directions; every local link and image resolves; only owned images and placeholders; no template demo content; licences shipped with the vendored libraries. The browser suite loads every page at 320, 768 and 1440 px (no errors, broken images, overflow or outside requests), exercises the drop-down menus, carousel and mobile menu, and runs axe-core on every page at desktop and phone width.

