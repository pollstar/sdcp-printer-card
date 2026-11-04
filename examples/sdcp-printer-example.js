/*
 * Template of a printer drawing for SDCP Printer Card — copy it, rename the id,
 * draw your printer. Two ways to ship it:
 *
 *  1. In this repository: save as dist/sdcp-printer-<id>.js, add it to SCENE_FILES
 *     in sdcp-printer-card.js and point the printer model of the integration at it
 *     (card_profile="<id>" in custom_components/sdcp/printers/).
 *  2. Separately (your own repo / HACS plugin / /config/www): load the file as a
 *     dashboard resource, or list it in the card config:
 *
 *       type: custom:sdcp-printer-card
 *       printer: acme-resin-9000          # optional when the integration reports it
 *       drawings:
 *         acme-resin-9000: /local/sdcp-printer-acme-resin-9000.js
 *
 * render(m, api) returns one <svg> string (viewBox 0 0 420 300 keeps the callout
 * columns at x 0..120 and 300..420; the printer goes in between). It runs on every
 * state update, so keep it pure: same input -> same string.
 *
 *  m    state model: online, stage, kind ("run"|"paused"|"done"|"error"|"busy"|"idle"|"offline"),
 *       active, paused, hasJob, pct, cl / tl (layers), file, fa (job attributes:
 *       layer_height, z_height, model_height, resin_volume, exposure_time, …),
 *       faults (entity ids of failing self-test checks), t (strings)
 *  api  t (strings incl. this drawing's i18n), esc, tpl, fmt(v, digits), dur(min), when(date),
 *       id/state/value/n/on(key) — entities by translation key (e.g. "vat_temp"),
 *       health(key) — {id, bad, known} of a self-test check (e.g. "health_z_motor"),
 *       callout({side:"l"|"r", y, lb, vl, sb?, sbc?: "hot"|"on", ax, ay, color?, health?, more?}),
 *       callouts([...]) — wraps them in the group the card refreshes,
 *       resinCallouts({plateY, mh, exposing, heating, anchors?}) — the standard resin set,
 *       zPx(span) — printed height in pixels, color — CSS colour of the current state
 *
 * Optional parts the card updates in place (so CSS transitions keep running):
 *   <g data-carriage style="transform:translateY(…px)">  moving part
 *   <g data-part="dyn">  small dynamic texts;  api.callouts(...) -> <g data-part="cos">
 * Root <svg> needs class="scene …" and data-kind="<id>".
 */

const ID = "acme-resin-9000";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STYLE = `
  .acme .acme-body { fill:#2f3a4a; stroke:#1d2430; }
  .acme .acme-lid  { fill:rgba(120,200,255,.18); stroke:#6fb7e8; }
  .acme .acme-plate { fill:#c9d1db; }
  .acme.s-exposing .acme-led { fill:#a77bff; }
  .acme .acme-led { fill:#3a3550; transition:fill .3s; }
`;

const I18N = {
  en: { lid: "Lid" },
  ru: { lid: "Крышка" },
  uk: { lid: "Кришка" },
};

function render(m, api) {
  const t = api.t;
  // plate height follows the printed Z; parked at the top when not printing
  const plateY = m.active && m.hasJob ? Math.max(70, 196 - api.zPx(110)) : 70;
  const vat = api.n("vat_temp");
  const cos = [
    { side: "l", y: 60, lb: t.plate, vl: m.hasJob ? `${api.fmt(m.cl)} / ${api.fmt(m.tl)}` : t.parked,
      ax: 165, ay: plateY - 3, health: api.health("health_strain_gauge"), more: api.id("current_layer") },
    { side: "l", y: 150, lb: t.vat, vl: vat === null ? "—" : `${api.fmt(vat)} °C`, ax: 160, ay: 186,
      health: api.health("health_tank"), more: api.id("vat_temp") },
    { side: "r", y: 60, lb: t.lid, vl: m.online ? "OK" : "—", ax: 262, ay: 40 },
    { side: "r", y: 230, lb: t.uv, vl: m.stage === "exposing" ? t.uv_on : t.uv_off, sbc: "on",
      ax: 258, ay: 224, color: "var(--sp-uv)", health: api.health("health_uv_sensor"), more: api.id("uv_led_temp") },
  ];
  return `<svg class="scene acme s-${esc(m.stage || "none")} ${m.online ? "" : "off"}" data-kind="${ID}" viewBox="0 0 420 300">
    <rect class="acme-body" x="140" y="200" width="140" height="70" rx="8"></rect>
    ${[0, 1, 2, 3, 4].map((i) => `<circle class="acme-led" cx="${170 + i * 20}" cy="224" r="4"></circle>`).join("")}
    <rect x="150" y="176" width="120" height="22" rx="3" fill="rgba(242,179,61,.6)"></rect>
    <g data-carriage style="transform:translateY(${plateY}px)"><rect class="acme-plate" x="165" y="-6" width="90" height="6" rx="2"></rect></g>
    <rect class="acme-lid" x="146" y="30" width="128" height="170" rx="8"></rect>
    ${api.callouts(cos)}
  </svg>`;
}

const register = window.sdcpPrinterCard?.registerDrawing || ((id, def) => {
  (window.__sdcpScenes = window.__sdcpScenes || {})[id] = { kind: "resin", ...def };
  window.dispatchEvent(new CustomEvent("sdcp-drawing-registered", { detail: { id } }));
});
register(ID, { kind: "resin", style: STYLE, i18n: I18N, render });
