/**
 * LG webOS 4.0 D-Pad + Magic Remote Spatial Navigation & Key Codes
 */

export const WEBOS_KEYS = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  OK: 13,
  BACK: 461,
  ESCAPE: 27,
  BACKSPACE: 8,
  PLAY: 415,
  PAUSE: 19,
  STOP: 413,
  REWIND: 412,
  FAST_FORWARD: 417,
  MEDIA_PLAY_PAUSE: 179,
  SPACE: 32,
  CH_UP: 427,
  CH_DOWN: 428,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
};

export function isTextEntryElement(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const t = (el.type || 'text').toLowerCase();
    return t !== 'button' && t !== 'checkbox' && t !== 'radio' && t !== 'file' && t !== 'submit';
  }
  return false;
}

function isElementVisible(el) {
  if (!el || el.disabled) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  return true;
}

export function getFocusableElements(scopeRoot) {
  const root = scopeRoot || document;
  const nodes = root.querySelectorAll('[data-focusable="true"]');
  const list = [];
  for (let i = 0; i < nodes.length; i += 1) {
    if (isElementVisible(nodes[i])) {
      list.push(nodes[i]);
    }
  }
  return list;
}

export function focusElement(el) {
  if (!el || typeof el.focus !== 'function') return;
  try {
    el.focus({ preventScroll: false });
  } catch (e) {
    el.focus();
  }
  if (typeof el.scrollIntoView === 'function') {
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch (e) {
      el.scrollIntoView(false);
    }
  }
}

/**
 * Spatial direction finder using center-to-center distance with directional alignment bias.
 */
export function findNextFocusable(currentEl, direction, scopeRoot) {
  const candidates = getFocusableElements(scopeRoot);
  if (candidates.length === 0) return null;
  if (!currentEl || candidates.indexOf(currentEl) === -1) {
    return candidates[0];
  }

  const curRect = currentEl.getBoundingClientRect();
  const cx = curRect.left + curRect.width / 2;
  const cy = curRect.top + curRect.height / 2;

  let best = null;
  let bestScore = Infinity;

  for (let i = 0; i < candidates.length; i += 1) {
    const el = candidates[i];
    if (el === currentEl) continue;

    const r = el.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    let valid = false;
    let primaryDist = 0;
    let crossDist = 0;

    if (direction === 'left' && dx < -4) {
      valid = true;
      primaryDist = -dx;
      crossDist = Math.abs(dy);
    } else if (direction === 'right' && dx > 4) {
      valid = true;
      primaryDist = dx;
      crossDist = Math.abs(dy);
    } else if (direction === 'up' && dy < -4) {
      valid = true;
      primaryDist = -dy;
      crossDist = Math.abs(dx);
    } else if (direction === 'down' && dy > 4) {
      valid = true;
      primaryDist = dy;
      crossDist = Math.abs(dx);
    }

    if (!valid) continue;

    // Weight cross-axis heavily so rows/columns navigate predictably on TV grids
    const score = primaryDist + crossDist * 2.4;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
}

export function moveSpatialFocus(direction, scopeRoot) {
  const active = document.activeElement;
  const next = findNextFocusable(active, direction, scopeRoot);
  if (next) {
    focusElement(next);
    return true;
  }
  return false;
}
