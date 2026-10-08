const KEY = 'zaineldeen:wishlist:v1';
const EVENT = 'wishlist:change';

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// Fallback when localStorage is unavailable (private mode, blocked storage): keep state for the session.
let memory = null;

export const getWishlist = () => memory ?? read();

function write(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    memory = null;
  } catch {
    memory = ids;
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export const isWished = (id) => getWishlist().includes(id);

/** Toggles an id and returns whether it is now saved. */
export function toggleWish(id) {
  const ids = getWishlist();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  write(next);
  return next.includes(id);
}

/** Calls `fn` on changes made in this tab or in another tab. */
export function onWishlistChange(fn) {
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', (e) => (e.key === KEY || e.key === null) && fn());
}
