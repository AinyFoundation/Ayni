/* Ayni Design System — Font picker
 * Dropdown-based font auditioning with localStorage persistence.
 * STORAGE_KEY is shared between pages so a pick on design-system.html
 * is automatically applied on components.html (and vice versa).
 *
 * Local fonts (self-hosted):
 * - Shippori Antique: Primary display font
 * - The Seasons: Alternative display font
 */
(function () {
  // Local font options
  const FONTS = [
    { id: 'shippori-antique', label: 'Shippori Antique', family: '"Shippori Antique", Georgia, serif' },
    { id: 'the-seasons', label: 'The Seasons', family: '"The Seasons", Georgia, serif' },
  ];

  // Lookup helpers
  const byId = (id) => FONTS.find(f => f.id === id) || FONTS[0];

  // For each specimen family, derive a human-readable label
  function labelFor(font) {
    return font.label;
  }

  const STORAGE_KEY = 'ayni.fontChoice.v1';
  const root = document.documentElement;

  function applyFont(slot, font) {
    const prop = slot === 'display' ? '--font-display' : '--font-text';
    root.style.setProperty(prop, font.family);
  }

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function writeSaved(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  // Update specimen labels for a given slot.
  function refreshLabels(slot, font) {
    document.querySelectorAll(`[data-font-label="${slot}"]`).forEach((el) => {
      el.textContent = font.label;
    });
  }

  function buildSelect(selectEl, slot, currentId) {
    selectEl.innerHTML = FONTS
      .map(f => `<option value="${f.id}" ${f.id === currentId ? 'selected' : ''}>${f.label}</option>`)
      .join('');
  }

  // ─── Boot ───
  const saved = readSaved();
  const displayPick = document.getElementById('font-display-pick');
  const textPick = document.getElementById('font-text-pick');

  const initialDisplay = saved.display || 'shippori-antique';
  const initialText = saved.text || 'shippori-antique';
  const fD = byId(initialDisplay);
  const fT = byId(initialText);

  // Apply fonts AND refresh labels on initial paint
  applyFont('display', fD);
  applyFont('text', fT);
  refreshLabels('display', fD);
  refreshLabels('text', fT);

  // If the picker UI isn't on this page, we're done
  if (!displayPick || !textPick) return;

  buildSelect(displayPick, 'display', initialDisplay);
  buildSelect(textPick, 'text', initialText);

  displayPick.addEventListener('change', e => {
    const f = byId(e.target.value);
    applyFont('display', f);
    refreshLabels('display', f);
    const s = readSaved(); s.display = f.id; writeSaved(s);
  });
  textPick.addEventListener('change', e => {
    const f = byId(e.target.value);
    applyFont('text', f);
    refreshLabels('text', f);
    const s = readSaved(); s.text = f.id; writeSaved(s);
  });
})();
