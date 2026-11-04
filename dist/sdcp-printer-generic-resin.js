/*
 * SDCP Printer Card — generic resin (MSLA) printer drawing. Loaded on demand by sdcp-printer-card.js;
 * render(m, api) gets the card's state model and the drawing API (see CONTRIBUTING.md).
 * Author: Pavel Starovoitov (@pollstar), https://github.com/pollstar/sdcp-printer-card
 */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tpl = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));
// register with the card (works whether the card or this file loads first)
const register = window.sdcpPrinterCard?.registerDrawing || ((id, def) => {
  (window.__sdcpScenes = window.__sdcpScenes || {})[id] = { kind: "resin", ...def };
  window.dispatchEvent(new CustomEvent("sdcp-drawing-registered", { detail: { id } }));
});

function render(m, api) {
  const t = api.t;
  const st = m.stage;
  const filmY = 201;
  const zPx = api.zPx(118);
  const printed = m.hasJob && (m.active || m.paused || st === "complete" || st === "stopped");
  const top = 70;
  let plateY = top;
  if (m.active && m.hasJob) {
    const lift = st === "lifting" ? 18 : st === "dropping" ? 8 : st === "homing" || st === "file_checking" ? 60 : 0;
    plateY = Math.max(top, filmY - zPx - lift);
  }
  const mh = printed ? Math.min(zPx, filmY - plateY - (m.active ? 0 : 6)) : 0;
  const heating = api.on("vat_heating");
  const exposing = st === "exposing" && m.online;

  // model hanging under the plate: supports, then the part
  let model = "";
  if (mh > 0.5) {
    const s = Math.min(6, mh);
    for (let x = 184; x <= 228; x += 8) model += `<line class="sup" x1="${x}" y1="0" x2="${x}" y2="${s.toFixed(1)}"></line>`;
    if (mh > s + 1) {
      const b = mh.toFixed(1);
      model += `<path class="model" d="M178 ${s} H234 L231 ${(mh - 3).toFixed(1)} Q206 ${(mh + 1.5).toFixed(1)} 181 ${(mh - 3).toFixed(1)} Z"></path>`;
      if (mh > 14) model += `<path class="model" d="M196 ${b} m0 -3 h20" style="fill:none;stroke-width:.5;opacity:.6"></path>`;
    }
  }
  const carriage = `<g class="carriage" data-carriage style="transform:translateY(${plateY.toFixed(1)}px)">
    <rect class="arm" x="206" y="-16" width="80" height="7" rx="2"></rect>
    <rect class="motor" x="285" y="-24" width="17" height="24" rx="3"></rect>
    <rect class="sg" x="232" y="-18.5" width="13" height="10" rx="2"></rect>
    <rect class="arm" x="203" y="-12" width="7" height="6"></rect>
    <rect class="plate" x="158" y="-7" width="96" height="7" rx="2"></rect>${model}</g>`;

  const pctTxt = m.hasJob && (m.active || m.paused) ? `${api.fmt(Math.floor(m.pct))}%` : st === "complete" ? "100%" : "READY";
  const dyn = `<g data-part="dyn">
    <text class="screen-t" x="164" y="258" text-anchor="middle">${esc(m.online ? pctTxt : "— —")}</text>
    <text class="screen-s" x="164" y="268" text-anchor="middle">${esc(m.online ? (t.st[st] || "").toUpperCase().slice(0, 14) : "")}</text></g>`;

  const svg = `<svg class="scene s-${esc(st || "none")} ${m.online ? "" : "off"} ${heating ? "hot-v" : ""}" data-kind="resin" viewBox="0 0 420 296" role="img" aria-label="${esc(t.printer)}">
    <defs>
      <linearGradient id="sp-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pr-body)"/><stop offset="1" stop-color="var(--pr-body2)"/></linearGradient>
      <linearGradient id="sp-lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347" stop-opacity=".16"/><stop offset=".6" stop-color="#ff8a00" stop-opacity=".07"/><stop offset="1" stop-color="#ff8a00" stop-opacity=".14"/></linearGradient>
      <linearGradient id="sp-resin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sp-resin)" stop-opacity=".55"/><stop offset="1" stop-color="var(--sp-resin)" stop-opacity=".85"/></linearGradient>
      <linearGradient id="sp-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dbe2"/><stop offset="1" stop-color="#8d95a3"/></linearGradient>
      <linearGradient id="sp-model" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--sp-resin)"/><stop offset=".5" stop-color="color-mix(in srgb,var(--sp-resin) 70%,#fff)"/><stop offset="1" stop-color="color-mix(in srgb,var(--sp-resin) 80%,#000)"/></linearGradient>
      <radialGradient id="sp-uvglow"><stop offset="0" stop-color="#b48cff" stop-opacity=".9"/><stop offset="1" stop-color="#7b4dff" stop-opacity="0"/></radialGradient>
      <filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    <ellipse class="shadow" cx="212" cy="286" rx="104" ry="6"></ellipse>
    <rect class="metal" x="286" y="30" width="14" height="208" rx="3"></rect>
    <line class="screw" x1="293" y1="36" x2="293" y2="234"></line>
    <rect class="body" x="116" y="204" width="194" height="78" rx="12"></rect>
    <rect class="uvwin" x="148" y="213" width="116" height="18" rx="3"></rect>
    ${Array.from({ length: 7 }, (_, i) => `<circle class="led" cx="${157 + i * 16.3}" cy="222" r="3.2"></circle>`).join("")}
    <ellipse class="glow" cx="206" cy="208" rx="74" ry="16"></ellipse>
    <rect class="screen" x="132" y="242" width="64" height="32" rx="4"></rect>
    <rect class="motor" x="280" y="238" width="26" height="28" rx="4"></rect>
    <circle class="motor-c" cx="293" cy="252" r="7"></circle>
    <rect class="lcd" x="146" y="201.5" width="120" height="4.5" rx="1"></rect>
    <rect class="lcd-img" x="186" y="202" width="40" height="3.5" rx=".8"></rect>
    <g class="tilt">
      <path class="vat" d="M140 166 H272 L268 201 H144 Z"></path>
      <path class="resin" d="M142.6 182 H269.4 L268 200.4 H144 Z"></path>
      <line class="film" x1="145" y1="200.6" x2="267" y2="200.6"></line>
      <polyline class="heater" points="138,170 134.5,174 138,178 134.5,182 138,186 134.5,190 138,194"></polyline>
    </g>
    <circle class="motor" cx="279" cy="196" r="6"></circle><circle class="motor-c" cx="279" cy="196" r="2.4"></circle>
    ${carriage}
    <rect class="lid" x="122" y="22" width="186" height="182" rx="12"></rect>
    <path class="lid-hl" d="M132 40 V150"></path>
    ${dyn}
    ${api.resinCallouts({ plateY, mh, exposing, heating, anchors: { vat: [137, 182], film: [150, 200.6], uv: [150, 222], tilt: [279, 190], lcd: [262, 204], zm: [300, 252] } })}
  </svg>`;
  return svg;
}

register("generic-resin", { kind: "resin", render });
