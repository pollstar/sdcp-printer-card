/*
 * SDCP Printer Card — generic FDM printer (Centauri Carbon and other SDCP FDM boards) drawing. Loaded on demand by sdcp-printer-card.js;
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
  const zPx = m.hasJob ? Math.max(3, (m.pct / 100) * 120) : 0;
  let bedY = 210;
  if (m.hasJob && (m.active || m.paused)) bedY = 84 + zPx;
  else if (m.hasJob) bedY = 230;
  const nT = api.n("nozzle_temp"), nG = api.n("nozzle_target_temp");
  const bT = api.n("bed_temp"), bG = api.n("bed_target_temp");
  const hotN = (nT ?? 0) > 50;
  const hotB = (bT ?? 0) > 40;
  const fan = (k) => (api.n(k) ?? 0) > 0;
  const blades = '<g class="blades"><path d="M0 -6 Q3 -3 0 0 Q-3 -3 0 -6 M0 6 Q-3 3 0 0 Q3 3 0 6 M-6 0 Q-3 3 0 0 Q-3 -3 -6 0 M6 0 Q3 -3 0 0 Q3 3 6 0"></path></g>';
  const mh = m.hasJob && (m.active || m.paused || st === "complete" || st === "stopped") ? zPx : 0;
  const model = mh > 0.5 ? `<path class="fdm-model" d="M186 0 V${(-mh * 0.55).toFixed(1)} L194 ${(-mh * 0.7).toFixed(1)} V${(-mh).toFixed(1)} H222 V${(-mh * 0.7).toFixed(1)} L234 ${(-mh * 0.55).toFixed(1)} V0 Z"></path>` : "";
  const pctTxt = m.hasJob && (m.active || m.paused) ? `${api.fmt(Math.floor(m.pct))}%` : "READY";
  const dyn = `<g data-part="dyn"><text class="screen-t" x="210" y="275" text-anchor="middle">${esc(m.online ? pctTxt : "— —")}</text></g>`;

  const cos = [];
  if (api.id("nozzle_temp")) cos.push({ side: "l", y: 40, lb: t.nozzle, vl: `${api.fmt(nT, 0)} °C`,
    sb: nG ? tpl(t.target, { t: `${api.fmt(nG)} °C` }) : "", sbc: hotN && nG && nT < nG - 2 ? "hot" : "",
    ax: 208, ay: 80, color: hotN ? "var(--sp-heat)" : undefined, more: api.id("nozzle_temp") });
  if (api.id("aux_fan")) cos.push({ side: "l", y: 112, lb: t.aux_fan, vl: `${api.fmt(api.n("aux_fan"))} %`,
    ax: 134, ay: 150, more: api.id("aux_fan") });
  if (api.id("bed_temp")) cos.push({ side: "l", y: 174, lb: t.bed, vl: `${api.fmt(bT, 0)} °C`,
    sb: bG ? tpl(t.target, { t: `${api.fmt(bG)} °C` }) : "", sbc: hotB && bG && bT < bG - 2 ? "hot" : "",
    ax: 146, ay: bedY + 3, color: hotB ? "var(--sp-heat)" : undefined, more: api.id("bed_temp") });
  if (api.id("chamber_temp")) cos.push({ side: "l", y: 236, lb: t.chamber, vl: `${api.fmt(api.n("chamber_temp"), 1)} °C`,
    ax: 160, ay: 244, more: api.id("chamber_temp") });
  if (m.hasJob) cos.push({ side: "r", y: 40, lb: t.layer, vl: `${api.fmt(m.cl)} / ${api.fmt(m.tl)}`,
    ax: 228, ay: bedY - Math.max(4, mh * 0.6), color: "var(--sp-resin)", more: api.id("current_layer") });
  if (api.id("model_fan")) cos.push({ side: "r", y: 112, lb: t.model_fan, vl: `${api.fmt(api.n("model_fan"))} %`,
    ax: 226, ay: 58, more: api.id("model_fan") });
  cos.push({ side: "r", y: 174, lb: t.z_axis, vl: m.active ? t.hold : t.idle_m, ax: 280, ay: bedY + 3,
    health: api.health("health_z_motor"), more: api.id("print_status") });
  if (api.id("box_fan")) cos.push({ side: "r", y: 236, lb: t.box_fan, vl: `${api.fmt(api.n("box_fan"))} %`,
    ax: 284, ay: 196, more: api.id("box_fan") });

  return `<svg class="scene s-${esc(st || "none")} ${m.online ? "" : "off"} ${hotN ? "hot-n" : ""} ${hotB ? "hot-b" : ""}" data-kind="fdm" viewBox="0 0 420 296">
    <defs>
      <linearGradient id="sp-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pr-body)"/><stop offset="1" stop-color="var(--pr-body2)"/></linearGradient>
      <linearGradient id="sp-model-f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--sp-a)"/><stop offset="1" stop-color="color-mix(in srgb,var(--sp-a) 60%,#000)"/></linearGradient>
    </defs>
    <ellipse class="shadow" cx="210" cy="288" rx="96" ry="5"></ellipse>
    <rect class="frame" x="124" y="20" width="172" height="244" rx="10"></rect>
    <line class="screw" x1="140" y1="62" x2="140" y2="256"></line><line class="screw" x1="280" y1="62" x2="280" y2="256"></line>
    <g class="carriage" data-carriage style="transform:translateY(${bedY.toFixed(1)}px)">
      <rect class="bed" x="138" y="0" width="144" height="6" rx="2"></rect>${model}</g>
    <rect class="rail" x="128" y="52" width="164" height="6" rx="2"></rect>
    <rect class="head" x="188" y="42" width="44" height="32" rx="6"></rect>
    <g class="fan ${fan("model_fan") ? "spin" : ""}" transform="translate(226 58)"><circle r="7.5"></circle>${blades}</g>
    <path class="nozzle" d="M203 74 H217 L212.5 82 H207.5 Z"></path>
    <g class="fan ${fan("aux_fan") ? "spin" : ""}" transform="translate(134 150)"><circle r="9"></circle>${blades}</g>
    <g class="fan ${fan("box_fan") ? "spin" : ""}" transform="translate(286 196)"><circle r="9"></circle>${blades}</g>
    <rect class="body" x="120" y="262" width="180" height="22" rx="6"></rect>
    <rect class="screen" x="184" y="265" width="52" height="16" rx="3"></rect>
    ${dyn}<g data-part="cos">${cos.map((c) => api.callout(c)).join("")}</g></svg>`;
}

register("generic-fdm", { kind: "fdm", render });
