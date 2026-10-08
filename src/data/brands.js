/**
 * Brands that appear in the catalog, keyed by the name printed on the packaging.
 * Names stay in Latin script in both languages; `ar` is a transliteration used only so that
 * Arabic searches such as «شانيل» find the brand. A unit test fails if a product's brand is missing here.
 */
export const brands = {
  'Bara': { id: 'bara', ar: 'بارا' },
  'Bourjois': { id: 'bourjois', ar: 'بورجوا' },
  'Carolina Herrera': { id: 'carolina-herrera', ar: 'كارولينا هيريرا' },
  'Chanel': { id: 'chanel', ar: 'شانيل' },
  'Clinique': { id: 'clinique', ar: 'كلينيك' },
  'Conair': { id: 'conair', ar: 'كونير' },
  'Dolce & Gabbana': { id: 'dolce-gabbana', ar: 'دولتشي أند غابانا' },
  'Eveline': { id: 'eveline', ar: 'إيفلين' },
  'ghd': { id: 'ghd', ar: 'جي إتش دي' },
  'Giorgio Armani': { id: 'giorgio-armani', ar: 'جورجيو أرماني' },
  'Gucci': { id: 'gucci', ar: 'غوتشي' },
  'Hugo Boss': { id: 'hugo-boss', ar: 'هوغو بوس' },
  'Jean Paul Gaultier': { id: 'jean-paul-gaultier', ar: 'جان بول غولتييه' },
  'JOKO': { id: 'joko', ar: 'جوكو' },
  'Lacoste': { id: 'lacoste', ar: 'لاكوست' },
  "L'Oréal Paris": { id: 'loreal-paris', ar: 'لوريال باريس' },
  "L'Oréal Professionnel": { id: 'loreal-professionnel', ar: 'لوريال بروفيسيونيل' },
  'Maybelline': { id: 'maybelline', ar: 'ميبيلين' },
  'Mon Ami': { id: 'mon-ami', ar: 'مون آمي' },
  'NuFACE': { id: 'nuface', ar: 'نيوفيس' },
  'Paco Rabanne': { id: 'paco-rabanne', ar: 'باكو رابان' },
  'Revolution': { id: 'revolution', ar: 'ريفولوشن' },
  'Seventeen': { id: 'seventeen', ar: 'سفنتين' },
  'Tom Ford': { id: 'tom-ford', ar: 'توم فورد' },
  'Versace': { id: 'versace', ar: 'فيرساتشي' },
  'wet n wild': { id: 'wet-n-wild', ar: 'ويت إن وايلد' },
  'WOW Skin Science': { id: 'wow-skin-science', ar: 'واو سكين ساينس' },
};

export const brandById = Object.fromEntries(Object.entries(brands).map(([name, b]) => [b.id, { ...b, name }]));
