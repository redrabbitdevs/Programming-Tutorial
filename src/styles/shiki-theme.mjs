// Custom Shiki theme pair mapped to the site's semantic token palette
// (same Radix Colors values as src/styles/tokens.css). Used by CodeBlock and
// the markdown pipeline so code blocks follow light/dark like everything else.

/** @typedef {import("shiki").ThemeRegistration} ThemeRegistration */

/** @type {ThemeRegistration} */
export const shikiLight = {
  name: "pt-light",
  type: "light",
  fg: "#202020",
  bg: "#f9f9f9",
  colors: {
    "editor.background": "#f9f9f9",
    "editor.foreground": "#202020"
  },
  settings: [
    /* All colors keep >= 4.5:1 against the #f9f9f9 code background (Phase 3
       axe gate). string follows --token-success (green-12); constant is a
       darkened amber — yellow-11 fails AA on this background (4.34:1). */
    { scope: "keyword", settings: { foreground: "#0d74ce" } },
    { scope: "string", settings: { foreground: "#193b2d" } },
    { scope: "comment", settings: { foreground: "#646464" } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: "#0d74ce" } },
    { scope: "constant", settings: { foreground: "#7a5800" } },
    { scope: ["entity.name.type", "support.type"], settings: { foreground: "#113264" } },
    { scope: "variable", settings: { foreground: "#202020" } }
  ]
};

/** @type {ThemeRegistration} */
export const shikiDark = {
  name: "pt-dark",
  type: "dark",
  fg: "#eeeeee",
  bg: "#111111",
  colors: {
    "editor.background": "#111111",
    "editor.foreground": "#eeeeee"
  },
  settings: [
    { scope: "keyword", settings: { foreground: "#3b9eff" } },
    { scope: "string", settings: { foreground: "#33b074" } },
    /* #808080 keeps 4.5:1 on the #111111 code background (#7b7b7b is 4.46). */
    { scope: "comment", settings: { foreground: "#808080" } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: "#3b9eff" } },
    { scope: "constant", settings: { foreground: "#f5e147" } },
    { scope: ["entity.name.type", "support.type"], settings: { foreground: "#70b8ff" } },
    { scope: "variable", settings: { foreground: "#eeeeee" } }
  ]
};
