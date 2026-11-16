// Shared logic for the site's 3-mode theme system (system / light / dark).
// The pre-paint inline script in layouts/Base.astro duplicates this logic so
// the initial theme applies before first paint; keep both implementations in sync.

const MODES = ["system", "light", "dark"];

export const THEME_KEY = "pt-theme";

/** @returns {"system" | "light" | "dark"} */
export function getStoredMode() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "system" || stored === "light" || stored === "dark") return stored;
    return "system";
  } catch {
    return "system";
  }
}

export function setStoredMode(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Storage unavailable (e.g. blocked in some privacy modes): theme still
    // applies for the session, it just does not persist.
  }
}

export function resolveTheme(mode) {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
}

export function nextMode(mode) {
  return MODES[(MODES.indexOf(mode) + 1) % MODES.length];
}
