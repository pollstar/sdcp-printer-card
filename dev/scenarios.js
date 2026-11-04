// Fake Home Assistant states for the dev page: one printer, several scenarios.
// Entities are keyed by translation_key exactly like the sdcp integration creates them.
const MB = "c439447916520100";
const DEV = "dev1";
function mk(over = {}, opts = {}) {
  const now = Date.now();
  const st = {
    "sensor.saturn_machine_status": ["printing", { printer_profile: opts.profile || "saturn-4-ultra", printer_kind: opts.kind || "resin" }], "sensor.saturn_print_status": ["exposing"],
    "sensor.saturn_progress": ["38.5"], "sensor.saturn_current_layer": ["3040"], "sensor.saturn_total_layers": ["7901"],
    "sensor.saturn_print_elapsed": ["531.1"], "sensor.saturn_print_remaining": ["1022.6"],
    "sensor.saturn_print_finish": [new Date(now + 1022.6 * 60000).toISOString()],
    "sensor.saturn_file": ["lock_holder.STL_0.020_4.000_2026_10_29_10_55.ctb", { current_layer: 3040, total_layers: 7901,
       layer_height: 0.02, z_height: 60.8, model_height: 158.02, resin_volume: 12.4, exposure_time: 4, thumbnail: "x" }],
    "sensor.saturn_print_error": ["none"], "sensor.saturn_uv_led_temperature": ["33.28"],
    "sensor.saturn_vat_temperature": ["29"], "sensor.saturn_vat_target_temperature": ["30"],
    "sensor.saturn_release_film_cycles": ["23087", { max: 60000 }], "sensor.saturn_lcd_exposure_time": ["152.93"],
    "sensor.saturn_free_storage": ["2.94", { unit_of_measurement: "GB", friendly_name: "SATURN Free storage" }],
    "binary_sensor.saturn_connection": ["on"], "binary_sensor.saturn_printing": ["on"], "binary_sensor.saturn_vat_heating": ["on"],
    "button.saturn_pause": ["unknown"], "button.saturn_resume": ["unknown"], "button.saturn_stop": ["unknown"],
    "switch.saturn_time_lapse": ["off"], "camera.saturn_camera": ["idle"],
    "image.saturn_model_preview": ["2026-11-03T10:00:00", { entity_picture: "thumb.svg" }],
  };
  const tk = {
    "sensor.saturn_machine_status": "machine_status", "sensor.saturn_print_status": "print_status", "sensor.saturn_progress": "progress",
    "sensor.saturn_current_layer": "current_layer", "sensor.saturn_total_layers": "total_layers", "sensor.saturn_print_elapsed": "print_elapsed",
    "sensor.saturn_print_remaining": "print_remaining", "sensor.saturn_print_finish": "print_finish", "sensor.saturn_file": "filename",
    "sensor.saturn_print_error": "print_error", "sensor.saturn_uv_led_temperature": "uv_led_temp", "sensor.saturn_vat_temperature": "vat_temp",
    "sensor.saturn_vat_target_temperature": "vat_target_temp", "sensor.saturn_release_film_cycles": "release_film",
    "sensor.saturn_lcd_exposure_time": "lcd_usage", "sensor.saturn_free_storage": "free_storage", "binary_sensor.saturn_connection": "connected",
    "binary_sensor.saturn_printing": "printing", "binary_sensor.saturn_vat_heating": "vat_heating", "button.saturn_pause": "pause",
    "button.saturn_resume": "resume", "button.saturn_stop": "stop", "switch.saturn_time_lapse": "timelapse", "camera.saturn_camera": "camera",
    "image.saturn_model_preview": "thumbnail",
  };
  const health = { health_uv_sensor: "UV temperature sensor", health_tank: "Vat", health_lcd: "LCD", health_strain_gauge: "Strain gauge",
    health_z_motor: "Z motor", health_tilt_motor: "Tilt motor", health_release_film: "Release film" };
  for (const [k, n] of Object.entries(health)) { st[`binary_sensor.saturn_${k}`] = ["off", { friendly_name: `SATURN ${n}` }]; tk[`binary_sensor.saturn_${k}`] = k; }
  Object.assign(st, over);
  for (const k of opts.drop || []) { delete st[k]; }
  Object.assign(tk, opts.tk || {});
  const states = {}, entities = {};
  for (const [id, [s, a]] of Object.entries(st)) {
    states[id] = { entity_id: id, state: s, attributes: { friendly_name: id, ...(a || {}) }, last_changed: new Date(now - 3600e3).toISOString() };
    if (tk[id]) entities[id] = { entity_id: id, platform: "sdcp", device_id: DEV, translation_key: tk[id] };
  }
  return {
    states, entities, connected: true,
    devices: { [DEV]: { id: DEV, name: opts.name || "SATURN", model: opts.model || "Saturn 4 Ultra 16K" } },
    locale: { language: opts.lang || "ru" }, language: opts.lang || "ru",
    callService: async (...a) => console.log("svc", JSON.stringify(a)),
    callApi: async () => ({ version: "test" }),
    callWS: async (m) => m.path === "/" ? { items: [{ path: "/local", dir: true, used: 3587702784, total: 6742212608 }] }
      : { items: [{ path: "/local/lock_holder.STL_0.020_4.000_2026_10_29_10_55.ctb", dir: false },
                  { path: "/local/adapter_v2.ctb", dir: false }, { path: "/local/minis_batch_32pcs.goo", dir: false }] },
  };
}
window.SCEN = {
  printing: () => mk(),
  mars: () => mk({ "sensor.saturn_print_status": ["lifting"] }, { name: "Mars", model: "Mars 5 Ultra", profile: "generic-resin" }),
  paused: () => mk({ "sensor.saturn_print_status": ["paused"], "binary_sensor.saturn_vat_heating": ["off"] }, { lang: "uk" }),
  idle: () => mk({ "sensor.saturn_machine_status": ["idle"], "sensor.saturn_print_status": ["complete"], "sensor.saturn_progress": ["100"],
    "sensor.saturn_current_layer": ["7901"], "sensor.saturn_print_elapsed": ["1553.7"], "sensor.saturn_print_remaining": ["0"],
    "sensor.saturn_print_finish": ["unknown"], "binary_sensor.saturn_printing": ["off"], "binary_sensor.saturn_vat_heating": ["off"] }, { lang: "en" }),
  ready: () => mk({ "sensor.saturn_machine_status": ["idle"], "sensor.saturn_print_status": ["idle"], "sensor.saturn_progress": ["0"],
    "sensor.saturn_file": ["unknown"], "sensor.saturn_current_layer": ["0"], "sensor.saturn_total_layers": ["0"],
    "binary_sensor.saturn_printing": ["off"], "binary_sensor.saturn_health_z_motor": ["on", { friendly_name: "SATURN Z motor" }] }),
  offline: () => { const h = mk({}, {}); for (const id in h.states) if (!id.includes("connection")) h.states[id].state = "unavailable"; h.states["binary_sensor.saturn_connection"].state = "off"; return h; },
  error: () => mk({ "sensor.saturn_print_status": ["stopped"], "sensor.saturn_machine_status": ["idle"], "sensor.saturn_print_error": ["file_read"] }, { lang: "en" }),
  fdm: () => mk({
    "sensor.cc_nozzle": ["214.6"], "sensor.cc_nozzle_t": ["220"], "sensor.cc_bed": ["59.8"], "sensor.cc_bed_t": ["60"], "sensor.cc_box": ["31.2"],
    "sensor.saturn_print_status": ["printing"], "sensor.saturn_file": ["benchy_PLA_0.2mm.gcode", { current_layer: 120, total_layers: 240 }],
    "sensor.saturn_current_layer": ["120"], "sensor.saturn_total_layers": ["240"], "sensor.saturn_progress": ["47"],
  }, { lang: "en", name: "Centauri", model: "Centauri Carbon", profile: "generic-fdm", kind: "fdm",
     drop: ["sensor.saturn_vat_temperature", "sensor.saturn_vat_target_temperature", "sensor.saturn_uv_led_temperature",
            "sensor.saturn_release_film_cycles", "sensor.saturn_lcd_exposure_time", "binary_sensor.saturn_vat_heating", "image.saturn_model_preview"],
     tk: { "sensor.cc_nozzle": "nozzle_temp", "sensor.cc_nozzle_t": "nozzle_target_temp", "sensor.cc_bed": "bed_temp", "sensor.cc_bed_t": "bed_target_temp", "sensor.cc_box": "chamber_temp" } }),
};
const q = new URLSearchParams(location.search);
document.body.className = q.get("theme") || "dark";
for (const name of (q.get("s") || "printing").split(",")) {
  const slot = document.createElement("div"); slot.className = "slot"; slot.id = "slot-" + name;
  const c = document.createElement("sdcp-printer-card");
  const cfg = { device: DEV, ...(q.get("cfg") ? JSON.parse(q.get("cfg")) : {}) };
  if (q.get("printer")) cfg.printer = q.get("printer");
  if (q.get("drawing")) { cfg.printer = cfg.printer || "dev"; cfg.drawings = { [cfg.printer]: q.get("drawing") }; }
  c.setConfig(cfg);
  { const h = SCEN[name](); if (q.get("profile")) h.states["sensor.saturn_machine_status"].attributes.printer_profile = q.get("profile");
    if (q.get("lang")) { h.locale = { language: q.get("lang") }; h.language = q.get("lang"); } c.hass = h; }
  slot.appendChild(c); document.body.appendChild(slot);
  if (q.get("open")) setTimeout(() => c.shadowRoot.querySelector(`[data-act="${q.get("open")}"]`)?.click(), 300);
}
