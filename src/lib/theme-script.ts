// Inlined into <head> by app/layout.tsx so data-theme is set before first paint.
// Body is spec §9.1 (intent/2026-09-25-dark-theme-default/). Two rules hold it up:
// - It only reads localStorage, never writes it, so the dark default is never
//   recorded as if the visitor had chosen it.
// - setAttribute sits outside the try, so a storage read that throws still lands
//   on dark rather than silently falling back to the OS-driven CSS scope.
export const THEME_SCRIPT = `
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem("theme");
  } catch (e) {}
  document.documentElement.setAttribute(
    "data-theme",
    stored === "light" || stored === "dark" ? stored : "dark",
  );
})();
`;
