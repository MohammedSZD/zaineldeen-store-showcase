/**
 * Verified public business details, taken from the original 2020 site and the store's own social pages.
 * Phone numbers and e-mail addresses are intentionally NOT included.
 *
 * OWNER CONFIRMATION NEEDED before public release: the location below is the map pin from the original
 * Contact page (labelled "Al-Remal, Gaza"). The original had no street address text.
 */
export const business = {
  name: 'Zain El Deen Store',
  nameAr: 'زين الدين',
  social: {
    instagram: 'https://www.instagram.com/zaineldeenstores/',
    facebook: 'https://www.facebook.com/Zaineldeenstores/',
  },
  location: { lat: 31.530729, lng: 34.464409 },
};

const { lat, lng } = business.location;

export const mapLinks = {
  directions: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  openStreetMap: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
};

export const formatCoords = () => `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
