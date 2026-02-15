/**
 * Normalizuje reťazec pre vyhľadávanie: odstráni diakritiku a zmení na malé písmená.
 * Napr. "Čistenie služby" → "cistenie sluzby"
 * @param {string} str
 * @returns {string}
 */
export function normalizeForSearch(str) {
  if (str == null || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * Vráti true, ak `text` obsahuje `search` (bez ohľadu na diakritiku a veľkosť písmen).
 */
export function textContains(text, search) {
  if (!search || !search.trim()) return true;
  return normalizeForSearch(text).includes(normalizeForSearch(search));
}
