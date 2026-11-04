/*
 * SDCP Printer Card — ELEGOO Saturn 4 Ultra / 16K drawing. Loaded on demand by sdcp-printer-card.js;
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

const STYLE = `
  /* Saturn 4 Ultra look: black metal body, smoked flip-up lid with white hatching */
  .s4 .s4-col { fill:#4a4f58; } .s4 .s4-arm { fill:#5a606b; } .s4 .s4-slide { fill:#3a3f47; stroke:#000; stroke-opacity:.3; }
  .s4 .s4-lever { fill:#23262b; stroke:#4a4f58; }
  .s4 .engr line { stroke:#9aa2ad; stroke-width:.6; }
  .s4 .s4-cam rect { fill:#1f2227; stroke:#4a4f58; } .s4 .s4-cam .lens { fill:#0a0c10; stroke:#6c7480; stroke-width:.8; }
  .s4 .s4-cam .lamp { fill:#fff3d6; opacity:.25; } .s4 .beam { fill:url(#s4-beam); opacity:0; transition:opacity .4s; }
  .s4.s-exposing .beam, .s4.s-lifting .beam, .s4.s-dropping .beam, .s4.s-paused .beam { opacity:.55; }
  .s4.s-exposing .s4-cam .lamp, .s4.s-lifting .s4-cam .lamp, .s4.s-dropping .s4-cam .lamp { opacity:1; }
  .s4 .vat { fill:rgba(160,170,185,.08); stroke:#8c939e; }
  .s4 .wheel { fill:#2a2d33; stroke:#8c939e; stroke-width:1; }
  .s4 .lcd { fill:#0f1320; }
  .s4 .s4-lidb { fill:url(#s4-lid); stroke:#454a53; stroke-width:1.2; }
  .s4 .s4-capb { fill:url(#s4-cap); opacity:.9; }
  .s4 .s4-hl { stroke:rgba(255,255,255,.14); stroke-width:3; stroke-linecap:round; fill:none; }
  .s4 .s4-hatch path { stroke:rgba(255,255,255,.55); stroke-width:1.6; stroke-linecap:round; }
  .s4 .s4-grip { fill:#0d0f12; opacity:.8; }
  .s4 .s4-base { fill:url(#s4-base); stroke:#0b0c0e; stroke-width:1; }
  .s4 .s4-sheen { fill:url(#s4-side); }
  .s4 .s4-seam { stroke:rgba(255,255,255,.12); stroke-width:1; }
  .s4 .uvwin { fill:rgba(5,6,10,.6); stroke:rgba(255,255,255,.12); stroke-dasharray:2 2; }
  .s4 .led { fill:#2c2840; }
  .s4 .s4-vents rect { fill:#0b0c0f; }
  .s4 .s4-strip { fill:#3a3f47; transition:fill .3s; }
  .s4.s-exposing .s4-strip, .s4.s-lifting .s4-strip, .s4.s-dropping .s4-strip { fill:#6ea0ff; }
  .s4.s-paused .s4-strip { fill:#ffb547; } .s4.s-complete .s4-strip { fill:#5bd17a; }
  .s4-screen .scr { fill:#050608; stroke:#4a4f58; } .s4-screen .scr-in { fill:#0d121c; }
  .s4-screen .scr-op { font-size:6.6px; font-weight:700; letter-spacing:.2px; }
  .s4-screen .scr-trk { fill:none; stroke:#232a38; stroke-width:3.2; }
  .s4-screen .scr-bar { fill:none; stroke-width:3.2; stroke-linecap:round; transition:stroke-dasharray .6s; }
  .s4-screen .scr-pct { fill:#e9eef7; font-size:9.5px; font-weight:700; }
  .s4-screen .scr-rem { fill:#e9eef7; font-size:9px; font-weight:700; }
  .s4-screen .scr-sub { fill:#6f7c95; font-size:4.6px; letter-spacing:.4px; }
  .scene.off .s4-screen { opacity:.6; }
`;

function screen(m, api) {
  const t = api.t;
  const x = 252, y = 212, w = 52, h = 68;
  const job = m.hasJob && (m.active || m.paused);
  const pct = job ? Math.max(0, Math.min(100, m.pct)) : m.stage === "complete" ? 100 : 0;
  const r = 13, c = 2 * Math.PI * r;
  const col = { run: "#6ea0ff", paused: "#ffb547", done: "#5bd17a", error: "#ff6b5e", busy: "#b48cff" }[m.kind] || "#7d8aa3";
  const rem = api.n("print_remaining");
  const remTxt = job && rem !== null ? `${Math.floor(rem / 60)}:${String(Math.round(rem % 60)).padStart(2, "0")}` : "";
  const op = m.online ? (t.st[m.stage] || m.label) : t.offline;
  return `<g data-part="dyn" class="s4-screen">
    <rect class="scr" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"></rect>
    <rect class="scr-in" x="${x + 2.5}" y="${y + 2.5}" width="${w - 5}" height="${h - 5}" rx="3.5"></rect>
    <text class="scr-op" x="${x + w / 2}" y="${y + 12}" text-anchor="middle" style="fill:${col}">${esc(op.length > 12 ? op.slice(0, 11) + "…" : op)}</text>
    <circle cx="${x + w / 2}" cy="${y + 32}" r="${r}" class="scr-trk"></circle>
    <circle cx="${x + w / 2}" cy="${y + 32}" r="${r}" class="scr-bar" style="stroke:${col}" stroke-dasharray="${((c * pct) / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${x + w / 2} ${y + 32})"></circle>
    <text class="scr-pct" x="${x + w / 2}" y="${y + 35.5}" text-anchor="middle">${m.online ? (job || m.stage === "complete" ? `${Math.floor(pct)}%` : "—") : "×"}</text>
    ${remTxt ? `<text class="scr-rem" x="${x + w / 2}" y="${y + 56}" text-anchor="middle">${esc(remTxt)}</text>
    <text class="scr-sub" x="${x + w / 2}" y="${y + 62.5}" text-anchor="middle">${esc(t.remaining.toUpperCase())}</text>`
      : `<text class="scr-sub" x="${x + w / 2}" y="${y + 58}" text-anchor="middle">${esc(m.online ? (m.kind === "idle" ? "READY" : "") : "OFFLINE")}</text>`}
  </g>`;
}

function render(m, api) {
  const t = api.t;
  const st = m.stage;
  const filmY = 199;
  const zPx = api.zPx(112);
  const printed = m.hasJob && (m.active || m.paused || st === "complete" || st === "stopped");
  const top = 74;
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
    for (let x = 186; x <= 226; x += 8) model += `<line class="sup" x1="${x}" y1="0" x2="${x}" y2="${s.toFixed(1)}"></line>`;
    if (mh > s + 1) {
      model += `<path class="model" d="M180 ${s} H232 L229 ${(mh - 3).toFixed(1)} Q206 ${(mh + 1.5).toFixed(1)} 183 ${(mh - 3).toFixed(1)} Z"></path>`;
    }
  }
  // laser-engraved plate texture
  const engr = Array.from({ length: 11 }, (_, i) => `<line x1="${163 + i * 8}" y1="-6" x2="${167 + i * 8}" y2="-1"></line>`).join("");
  const carriage = `<g class="carriage" data-carriage style="transform:translateY(${plateY.toFixed(1)}px)">
    <rect class="s4-arm" x="204" y="-17" width="84" height="8" rx="2"></rect>
    <rect class="s4-slide" x="284" y="-26" width="20" height="26" rx="3"></rect>
    <rect class="sg" x="236" y="-19.5" width="13" height="10" rx="2"></rect>
    <path class="s4-lever" d="M196 -15 v-12 a4 4 0 0 1 4 -4 h18 a4 4 0 0 1 4 4 v12 Z"></path>
    <rect class="s4-arm" x="200" y="-11" width="12" height="5"></rect>
    <rect class="plate" x="159" y="-7" width="94" height="7" rx="2"></rect>
    <g class="engr">${engr}</g>${model}</g>`;

  // vertical touchscreen on the front: operation, progress ring, time left
  const scr = screen(m, api);

  // white "sci-fi" hatching on the lid
  const hatch = Array.from({ length: 4 }, (_, i) => `<path d="M${128 + i * 6} 62 l8 -11"></path>`).join("")
    + Array.from({ length: 4 }, (_, i) => `<path d="M${274 + i * 6} 40 l8 -11"></path>`).join("");

  const svg = `<svg class="scene s4 s-${esc(st || "none")} ${m.online ? "" : "off"} ${heating ? "hot-v" : ""}" data-kind="resin" viewBox="0 0 420 300" role="img" aria-label="${esc(t.printer)}">
    <defs>
      <linearGradient id="s4-base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f46"/><stop offset=".08" stop-color="#2b2e34"/><stop offset="1" stop-color="#16181b"/></linearGradient>
      <linearGradient id="s4-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".12" stop-color="#fff" stop-opacity="0"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
      <linearGradient id="s4-lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2e36" stop-opacity=".7"/><stop offset=".45" stop-color="#1d2026" stop-opacity=".4"/><stop offset="1" stop-color="#111317" stop-opacity=".62"/></linearGradient>
      <linearGradient id="s4-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3036"/><stop offset="1" stop-color="#15171a"/></linearGradient>
      <linearGradient id="sp-resin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sp-resin)" stop-opacity=".55"/><stop offset="1" stop-color="var(--sp-resin)" stop-opacity=".9"/></linearGradient>
      <linearGradient id="sp-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e6ea"/><stop offset="1" stop-color="#8c939e"/></linearGradient>
      <linearGradient id="sp-model" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--sp-resin)"/><stop offset=".5" stop-color="color-mix(in srgb,var(--sp-resin) 70%,#fff)"/><stop offset="1" stop-color="color-mix(in srgb,var(--sp-resin) 75%,#000)"/></linearGradient>
      <linearGradient id="s4-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6e0" stop-opacity=".35"/><stop offset="1" stop-color="#fff6e0" stop-opacity="0"/></linearGradient>
      <radialGradient id="sp-uvglow"><stop offset="0" stop-color="#b48cff" stop-opacity=".95"/><stop offset="1" stop-color="#7b4dff" stop-opacity="0"/></radialGradient>
      <filter id="sp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    <ellipse class="shadow" cx="213" cy="291" rx="108" ry="6"></ellipse>
    <!-- interior (seen through the smoked lid) -->
    <rect class="s4-col" x="287" y="40" width="13" height="166" rx="2"></rect>
    <line class="screw" x1="293.5" y1="44" x2="293.5" y2="204"></line>
    <g class="s4-cam"><rect x="274" y="34" width="26" height="10" rx="3"></rect><circle class="lens" cx="282" cy="39" r="2.6"></circle>
      <rect class="lamp" x="289" y="37" width="8" height="4" rx="1.5"></rect></g>
    <path class="beam" d="M293 44 L170 196 L258 196 Z"></path>
    <ellipse class="glow" cx="206" cy="204" rx="74" ry="15"></ellipse>
    <rect class="lcd" x="146" y="199.5" width="120" height="4.5" rx="1"></rect>
    <rect class="lcd-img" x="186" y="200" width="40" height="3.5" rx=".8"></rect>
    <g class="tilt">
      <path class="vat" d="M140 164 H272 L268 199 H144 Z"></path>
      <path class="resin" d="M142.6 180 H269.4 L268 198.4 H144 Z"></path>
      <line class="film" x1="145" y1="198.6" x2="267" y2="198.6"></line>
      <polyline class="heater" points="148,192 152,188 156,192 160,188 164,192"></polyline>
      <circle class="wheel" cx="143" cy="172" r="4.2"></circle><circle class="wheel" cx="269" cy="172" r="4.2"></circle>
    </g>
    <circle class="motor" cx="279" cy="194" r="5.5"></circle><circle class="motor-c" cx="279" cy="194" r="2.2"></circle>
    ${carriage}
    <!-- flip-up smoked lid with hatching -->
    <rect class="s4-lidb" x="122" y="22" width="188" height="184" rx="14"></rect>
    <rect class="s4-capb" x="122" y="22" width="188" height="16" rx="14"></rect>
    <path class="s4-hl" d="M132 46 V176"></path>
    <g class="s4-hatch">${hatch}</g>
    <rect class="s4-grip" x="186" y="198" width="60" height="4" rx="2"></rect>
    <!-- base -->
    <rect class="s4-base" x="112" y="204" width="208" height="82" rx="11"></rect>
    <rect class="s4-sheen" x="112" y="204" width="208" height="82" rx="11"></rect>
    <line class="s4-seam" x1="120" y1="209" x2="312" y2="209"></line>
    <rect class="uvwin" x="132" y="218" width="104" height="16" rx="3"></rect>
    ${Array.from({ length: 6 }, (_, i) => `<circle class="led" cx="${141 + i * 17.2}" cy="226" r="3.1"></circle>`).join("")}
    <g class="s4-vents">${Array.from({ length: 7 }, (_, i) => `<rect x="${132 + i * 15}" y="262" width="10" height="2.4" rx="1.2"></rect>`).join("")}</g>
    <rect class="s4-strip" x="132" y="244" width="104" height="3" rx="1.5"></rect>
    ${scr}
    ${api.resinCallouts({ plateY, mh, exposing, heating })}
  </svg>`;
  return svg;
}

register("saturn-4-ultra", { kind: "resin", style: STYLE, render });
