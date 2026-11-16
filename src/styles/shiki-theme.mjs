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
    { scope: "keyword", settings: { foreground: "#0d74ce" } },
    { scope: "string", settings: { foreground: "#218358" } },
    { scope: "comment", settings: { foreground: "#646464" } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: "#0d74ce" } },
    { scope: "constant", settings: { foreground: "#9e6c00" } },
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
    { scope: "comment", settings: { foreground: "#7b7b7b" } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: "#3b9eff" } },
    { scope: "constant", settings: { foreground: "#f5e147" } },
    { scope: ["entity.name.type", "support.type"], settings: { foreground: "#70b8ff" } },
    { scope: "variable", settings: { foreground: "#eeeeee" } }
  ]
};
