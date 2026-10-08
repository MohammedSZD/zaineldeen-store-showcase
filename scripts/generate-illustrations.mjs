// Generates the original, unbranded product illustrations in assets/images/illustrations/.
// Usage: node scripts/generate-illustrations.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { artwork, compositions, bareIds } from '../src/data/artwork.js';

const OUT = new URL('../assets/images/illustrations/', import.meta.url);
mkdirSync(new URL('bare/', OUT), { recursive: true });

/** Darkens (amt < 0) or lightens (amt > 0) a #rrggbb colour. */
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};

const label = (x, y, w, h, d) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#fff" fill-opacity=".88" stroke="${d}" stroke-width="1.5"/><rect x="${x + 12}" y="${y + h * 0.36}" width="${w - 24}" height="3" rx="1.5" fill="${d}"/><rect x="${x + 22}" y="${y + h * 0.6}" width="${w - 44}" height="3" rx="1.5" fill="${d}" opacity=".6"/>`;
const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="10" fill="#231a1c" opacity=".1"/>`;
const shine = (x, y, h) => `<rect x="${x}" y="${y}" width="12" height="${h}" rx="6" fill="#fff" opacity=".42"/>`;

const kinds = {
  'perfume-feminine': ([a, b, d]) => `${shadow(240, 468, 96)}
    <rect x="218" y="222" width="44" height="34" rx="4" fill="${shade(a, -0.25)}"/>
    <rect x="212" y="212" width="56" height="12" rx="3" fill="${d}"/>
    <rect x="206" y="144" width="68" height="70" rx="14" fill="${b}"/><rect x="216" y="154" width="8" height="46" rx="4" fill="#fff" opacity=".3"/>
    <rect x="168" y="250" width="144" height="212" rx="42" fill="${a}" stroke="${shade(a, -0.3)}" stroke-width="2"/>${shine(184, 270, 140)}${label(198, 330, 84, 64, d)}`,
  'perfume-masculine': ([a, b, d]) => `${shadow(240, 472, 94)}
    <rect x="214" y="240" width="52" height="34" rx="4" fill="${shade(a, -0.3)}"/>
    <rect x="198" y="170" width="84" height="74" rx="8" fill="${b}"/><rect x="208" y="180" width="8" height="52" rx="4" fill="#fff" opacity=".25"/><rect x="198" y="236" width="84" height="8" fill="${d}"/>
    <rect x="170" y="268" width="140" height="204" rx="10" fill="${a}" stroke="${shade(a, -0.3)}" stroke-width="2"/>${shine(184, 284, 150)}${label(198, 340, 84, 64, d)}`,
  lipstick: ([a, b, d]) => `${shadow(240, 490, 62)}
    <path d="M214 356V292L268 252V356Z" fill="${a}"/><path d="M214 292L268 252V270L214 308Z" fill="#fff" opacity=".22"/>
    <rect x="208" y="350" width="64" height="30" rx="4" fill="${d}"/>
    <rect x="204" y="378" width="72" height="108" rx="8" fill="${b}"/>${shine(214, 392, 76)}`,
  concealer: ([a, b, d]) => `${shadow(240, 490, 56)}
    <ellipse cx="240" cy="190" rx="13" ry="30" fill="${shade(a, -0.35)}" transform="rotate(-8 240 190)"/><rect x="236" y="214" width="8" height="70" rx="3" fill="${d}" transform="rotate(-8 240 250)"/>
    <rect x="218" y="276" width="44" height="26" rx="4" fill="${d}"/>
    <rect x="212" y="300" width="56" height="186" rx="12" fill="${b}"/>${shine(222, 316, 120)}<rect x="212" y="400" width="56" height="30" fill="${a}"/>`,
  'liquid-lip': ([a, b, d]) => `${shadow(240, 490, 52)}
    <rect x="236" y="196" width="8" height="70" rx="3" fill="${shade(a, -0.2)}"/><path d="M228 168Q240 150 252 168L248 200H232Z" fill="${a}"/>
    <rect x="224" y="262" width="32" height="22" rx="4" fill="${d}"/>
    <rect x="216" y="282" width="48" height="204" rx="10" fill="${b}" stroke="${shade(b, -0.12)}"/>${shine(224, 298, 130)}<rect x="216" y="392" width="48" height="40" fill="${a}"/>`,
  compact: ([a, b, d]) => `${shadow(240, 470, 120)}
    <ellipse cx="240" cy="420" rx="128" ry="46" fill="${shade(b, 0.15)}"/><ellipse cx="240" cy="404" rx="128" ry="46" fill="${b}"/>
    <ellipse cx="240" cy="396" rx="108" ry="36" fill="${a}"/><ellipse cx="214" cy="388" rx="40" ry="10" fill="#fff" opacity=".28"/>
    <path d="M118 404V330a122 52 0 0 1 244 0V404" fill="${shade(b, 0.1)}"/><ellipse cx="240" cy="330" rx="122" ry="50" fill="${b}"/><ellipse cx="240" cy="330" rx="98" ry="38" fill="${d}" opacity=".35"/>`,
  palette: ([...pans]) => `${shadow(240, 466, 150)}
    <path d="M128 296L166 190H316L352 296Z" fill="#fff" fill-opacity=".75" stroke="#b8935a" stroke-width="2"/><path d="M150 288L178 206H304L330 288Z" fill="#dfeaf0" opacity=".55"/>
    <rect x="100" y="290" width="280" height="172" rx="16" fill="#7d1d34"/><rect x="114" y="304" width="252" height="144" rx="10" fill="#4a1220"/>
    ${pans.map((c, i) => `<circle cx="${146 + (i % 4) * 62}" cy="${i < 4 ? (pans.length <= 4 ? 376 : 342) : 410}" r="25" fill="${c}"/><circle cx="${138 + (i % 4) * 62}" cy="${(i < 4 ? (pans.length <= 4 ? 376 : 342) : 410) - 8}" r="6" fill="#fff" opacity=".3"/>`).join('')}`,
  mascara: ([a, b, d]) => `${shadow(240, 490, 58)}
    <rect x="236" y="232" width="8" height="58" rx="3" fill="${d}"/>
    <rect x="226" y="120" width="28" height="118" rx="14" fill="${b}"/>${Array.from({ length: 9 }, (_, i) => `<path d="M226 ${140 + i * 11}h-8M254 ${140 + i * 11}h8" stroke="${b}" stroke-width="2.5" stroke-linecap="round"/>`).join('')}
    <rect x="220" y="284" width="40" height="22" rx="4" fill="${d}"/>
    <rect x="208" y="304" width="64" height="184" rx="12" fill="${a}"/>${shine(218, 320, 120)}<rect x="208" y="404" width="64" height="26" fill="#fff" opacity=".7"/>`,
  foundation: ([a, b, d]) => `${shadow(240, 484, 76)}
    <rect x="236" y="204" width="8" height="46" fill="${shade(b, -0.1)}"/><path d="M212 204h58a8 8 0 0 1 0 16h-58z" fill="${b}" stroke="${d}"/>
    <rect x="220" y="246" width="40" height="18" rx="4" fill="${d}"/><rect x="224" y="262" width="32" height="40" fill="${shade(a, -0.25)}"/>
    <rect x="184" y="298" width="112" height="186" rx="24" fill="${a}" stroke="${shade(a, -0.3)}" stroke-width="2"/>${shine(198, 316, 120)}${label(204, 360, 72, 70, d)}`,
  kohl: ([a, b, d]) => `${shadow(240, 500, 70)}<g transform="rotate(-32 240 330)">
    <path d="M226 178L240 118L254 178Z" fill="#e3cfae"/><path d="M235 140L240 118L245 140Z" fill="${a}"/>
    <rect x="226" y="176" width="28" height="270" rx="3" fill="${a}"/>${shine(231, 190, 220)}
    <rect x="226" y="440" width="28" height="12" fill="${d}"/><rect x="226" y="452" width="28" height="22" rx="4" fill="${b}"/></g>`,
  sponges: ([a, b, d]) => `${shadow(240, 492, 130)}
    <g><path d="M185 290C232 352 258 384 258 428a73 73 0 0 1-146 0C112 384 138 352 185 290Z" fill="${a}"/><ellipse cx="156" cy="420" rx="12" ry="30" fill="#fff" opacity=".3"/></g>
    <g transform="translate(120 70) scale(.82)"><path d="M185 290C232 352 258 384 258 428a73 73 0 0 1-146 0C112 384 138 352 185 290Z" fill="${b}"/><ellipse cx="156" cy="420" rx="12" ry="30" fill="#fff" opacity=".3"/></g>`,
  'pump-bottle': ([a, b, d]) => `${shadow(240, 492, 80)}
    <rect x="232" y="216" width="16" height="52" fill="${shade(b, 0.1)}"/><path d="M204 214h82a9 9 0 0 1 0 18h-82z" fill="${b}"/>
    <rect x="220" y="264" width="40" height="30" rx="4" fill="${b}"/>
    <rect x="176" y="290" width="128" height="202" rx="22" fill="${a}" stroke="${shade(a, -0.3)}" stroke-width="2"/>${shine(190, 308, 140)}${label(196, 350, 88, 92, d)}`,
  giftset: ([a, b, d]) => `${shadow(240, 502, 150)}
    <rect x="124" y="384" width="232" height="116" rx="10" fill="${shade(a, -0.15)}"/><rect x="108" y="346" width="264" height="48" rx="8" fill="${a}"/>
    <rect x="226" y="346" width="28" height="154" fill="${d}"/><ellipse cx="206" cy="330" rx="34" ry="20" fill="${d}" transform="rotate(-14 206 330)"/><ellipse cx="274" cy="330" rx="34" ry="20" fill="${d}" transform="rotate(14 274 330)"/><circle cx="240" cy="338" r="13" fill="${shade(d, -0.2)}"/>
    <rect x="152" y="270" width="52" height="82" rx="8" fill="${b}" stroke="${d}"/><rect x="276" y="286" width="62" height="66" rx="10" fill="${b}" stroke="${d}"/>`,
  pajamas: ([a, b, d]) => `${shadow(240, 520, 110)}
    <path d="M184 366H296L312 520H256L240 424L224 520H168Z" fill="${b}"/><rect x="184" y="350" width="112" height="20" rx="4" fill="${shade(b, -0.12)}"/>
    <path d="M190 150L150 182L122 322L156 332L184 238V344H296V238L324 332L358 322L330 182L290 150Q240 186 190 150Z" fill="${a}"/>
    <path d="M192 152Q240 190 288 152" fill="none" stroke="${shade(a, -0.2)}" stroke-width="4"/><rect x="118" y="312" width="42" height="24" rx="5" fill="${shade(a, -0.14)}" transform="rotate(-9 139 324)"/><rect x="320" y="312" width="42" height="24" rx="5" fill="${shade(a, -0.14)}" transform="rotate(9 341 324)"/>
    <path d="M240 262c-18-16-22-30-12-38 7-6 12-2 12 4 0-6 5-10 12-4 10 8 6 22-12 38z" fill="${d}"/>`,
  nightshirt: ([a, b, d]) => `${shadow(240, 490, 100)}
    <path d="M192 140L152 172L124 296L158 306L184 236L172 468H308L296 236L322 306L356 296L328 172L288 140Q240 176 192 140Z" fill="${a}"/>
    <rect x="172" y="440" width="136" height="28" rx="4" fill="${b}"/><path d="M194 142Q240 180 286 142" fill="none" stroke="${shade(a, -0.25)}" stroke-width="4"/>
    <rect x="122" y="284" width="42" height="26" rx="5" fill="${b}" transform="rotate(-9 143 297)"/><rect x="316" y="284" width="42" height="26" rx="5" fill="${b}" transform="rotate(9 337 297)"/>
    <path d="M240 290c-20-18-24-33-13-42 8-6 13-2 13 5 0-7 5-11 13-5 11 9 7 24-13 42z" fill="${d}"/>`,
  loungeset: ([a, b, d]) => `${shadow(240, 522, 112)}
    <path d="M186 372H294L310 522H256L240 430L224 522H170Z" fill="${b}"/><rect x="186" y="356" width="108" height="20" rx="4" fill="${shade(b, -0.12)}"/>
    <path d="M192 148L150 180L120 330L156 340L184 244V352H296V244L324 340L360 330L330 180L288 148Q240 176 192 148Z" fill="${a}"/>
    <path d="M214 150L240 176L266 150" fill="none" stroke="${shade(a, -0.3)}" stroke-width="5" stroke-linejoin="round"/><path d="M240 176V352" stroke="${d}" stroke-width="3" stroke-dasharray="5 4"/><rect x="236" y="176" width="8" height="18" rx="2" fill="${d}"/>`,
  hairdryer: ([a, b, d]) => `${shadow(240, 498, 90)}<g transform="rotate(-10 240 300)">
    <rect x="150" y="296" width="50" height="178" rx="22" fill="${b}" transform="rotate(14 175 300)"/><rect x="160" y="436" width="30" height="12" rx="5" fill="${d}" transform="rotate(14 175 300)"/>
    <rect x="116" y="204" width="226" height="108" rx="52" fill="${a}" stroke="${shade(a, -0.2)}" stroke-width="2"/>${shine(150, 222, 70).replace('width="12"', 'width="70"').replace('height="70"', 'height="12"')}
    <rect x="334" y="214" width="42" height="88" rx="10" fill="${b}"/><rect x="100" y="220" width="22" height="76" rx="8" fill="${d}"/></g>`,
  straightener: ([a, b, d]) => `${shadow(240, 510, 80)}<g transform="rotate(-18 240 320)">
    <rect x="200" y="100" width="40" height="380" rx="18" fill="${a}" stroke="${shade(a, -0.2)}" stroke-width="2"/><rect x="244" y="100" width="40" height="380" rx="18" fill="${b}"/>
    <rect x="212" y="124" width="10" height="230" rx="5" fill="${b}" opacity=".85"/><rect x="262" y="124" width="10" height="230" rx="5" fill="${a}" opacity=".6"/>
    <circle cx="242" cy="404" r="16" fill="${d}"/></g>`,
  'facial-device': ([a, b, d]) => `${shadow(240, 482, 98)}
    <rect x="164" y="340" width="152" height="140" rx="64" fill="${a}" stroke="${shade(a, -0.2)}" stroke-width="2"/>
    <circle cx="204" cy="316" r="46" fill="${b}" stroke="${shade(b, -0.2)}" stroke-width="2"/><circle cx="276" cy="316" r="46" fill="${b}" stroke="${shade(b, -0.2)}" stroke-width="2"/>
    <ellipse cx="190" cy="300" rx="14" ry="20" fill="#fff" opacity=".6"/><ellipse cx="262" cy="300" rx="14" ry="20" fill="#fff" opacity=".6"/>
    <rect x="216" y="398" width="48" height="8" rx="4" fill="${d}"/><circle cx="240" cy="430" r="9" fill="${d}"/>`,
  clipper: ([a, b, d]) => `${shadow(240, 492, 130)}
    <rect x="200" y="172" width="80" height="34" rx="4" fill="${b}"/><path d="M204 172h72" stroke="${d}" stroke-width="3" stroke-dasharray="4 3"/>
    <rect x="186" y="200" width="108" height="278" rx="34" fill="${a}" stroke="${shade(a, -0.25)}" stroke-width="2"/>${shine(200, 222, 200)}<circle cx="240" cy="270" r="14" fill="${d}"/>
    <g fill="${b}"><rect x="318" y="330" width="60" height="22" rx="3"/><rect x="324" y="364" width="52" height="18" rx="3"/><rect x="330" y="394" width="44" height="16" rx="3"/></g>
    <g stroke="${a}" stroke-width="3">${Array.from({ length: 6 }, (_, i) => `<path d="M${324 + i * 9} 350v8"/>`).join('')}</g>`,
};

const backdrop = `<path d="M96 540V250a144 144 0 0 1 288 0V540Z" fill="#fff" opacity=".5"/><path d="M96 540V250a144 144 0 0 1 288 0V540Z" fill="none" stroke="#b8935a" stroke-opacity=".55" stroke-width="2"/>`;
const wrap = (inner, title, viewBox = '0 0 480 600') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="${viewBox}" role="img"><title>${title}</title>${inner}</svg>\n`;

for (const [id, { kind, colors }] of Object.entries(artwork)) {
  if (!kinds[kind]) throw new Error(`Unknown artwork kind: ${kind}`);
  writeFileSync(new URL(`${id}.svg`, OUT), wrap(`${backdrop}${kinds[kind](colors)}`, 'Illustration'));
  if (bareIds.includes(id)) writeFileSync(new URL(`bare/${id}.svg`, OUT), wrap(kinds[kind](colors), 'Illustration', '68 95 344 430'));
}
for (const [name, parts] of Object.entries(compositions)) {
  const inner = parts
    .map(({ id, x, y, s }) => `<g transform="translate(${x} ${y}) scale(${s})">${kinds[artwork[id].kind](artwork[id].colors)}</g>`)
    .join('');
  writeFileSync(new URL(`${name}.svg`, OUT), wrap(`${backdrop}${inner}`, 'Illustration'));
}
console.log(`Wrote ${Object.keys(artwork).length + Object.keys(compositions).length} illustrations`);
