# Contributing: a drawing for your printer

The card is split into a **core** (`dist/sdcp-printer-card.js`: status strip, timers, job,
controls, files, camera, editor, translations) and **printer drawings** — one small module
per printer, loaded on demand. The core works with any SDCP printer; a drawing only decides
what the printer looks like and where its readings are pinned.

```
dist/
├── sdcp-printer-card.js            core + drawing registry (window.sdcpPrinterCard)
├── sdcp-printer-saturn-4-ultra.js  ELEGOO Saturn 4 Ultra / 16K
├── sdcp-printer-generic-resin.js   any resin (MSLA) printer
└── sdcp-printer-generic-fdm.js     any FDM printer
examples/sdcp-printer-example.js    commented template of a drawing
dev/                                dev page with fake Home Assistant states + screenshots
```

## How a drawing is chosen

1. `printer:` in the card config, if set;
2. `printer_profile` reported by the integration (attribute of the *machine state* sensor; set
   by `card_profile` of the printer model in
   [ha-sdcp/printers](https://github.com/pollstar/ha-sdcp/tree/main/custom_components/sdcp/printers));
3. the device model name (fallback for old integrations);
4. `generic-resin` / `generic-fdm`.

The module for an id comes from `drawings:` in the card config, then from `SCENE_FILES` in the
core. An unknown id, a missing file or a drawing that throws falls back to the generic drawing
of the printer's kind, so a card never breaks because of a drawing.

## Writing a drawing

Start from [`examples/sdcp-printer-example.js`](examples/sdcp-printer-example.js) — it lists
the whole API in its header. In short:

```js
register("acme-resin-9000", {
  kind: "resin",                 // "resin" | "fdm" — used for fallbacks
  style: `.acme .lid { … }`,     // optional CSS, added to the card once
  i18n: { en: { lid: "Lid" } },  // optional strings, merged into api.t
  render(m, api) {               // -> one "<svg class="scene …" data-kind="acme-resin-9000" …>"
    return `<svg …>… ${api.callouts([{ side: "l", y: 60, lb: api.t.vat,
      vl: `${api.fmt(api.n("vat_temp"))} °C`, ax: 160, ay: 186, health: api.health("health_tank") }])}</svg>`;
  },
});
```

- **`m`** is the card's state model (stage, progress, layers, job attributes, faults, …).
- **`api`** is the stable helper set (`api.version` is the API version; it only grows):
  formatting, entities by translation key (`api.n("vat_temp")`, `api.on("vat_heating")`),
  self-test checks (`api.health("health_z_motor")`), callouts and the standard resin callout
  set, the printed height in pixels.
- Use `viewBox="0 0 420 300"`: callout labels live in the columns `x 0…120` and `300…420`,
  the printer in between.
- Mark the moving part `data-carriage` (its `style` / content are swapped, so CSS transitions
  keep running), small dynamic texts `data-part="dyn"`; `api.callouts()` adds `data-part="cos"`.
- Keep `render` pure and cheap — it runs on every state update and the card skips identical
  output.
- Entity keys are the integration's translation keys: `print_status`, `progress`,
  `current_layer`, `print_remaining`, `vat_temp`, `uv_led_temp`, `release_film`, `lcd_usage`,
  `nozzle_temp`, `bed_temp`, `chamber_temp`, `model_fan`, …, and `health_*` for the
  self-test.

## Shipping it

**In this repository** (preferred for printers others own too):
1. `dist/sdcp-printer-<id>.js`, registered under `<id>`;
2. add it to `SCENE_FILES` in `dist/sdcp-printer-card.js`;
3. in the integration, set `card_profile="<id>"` on the printer model;
4. screenshots: `python -m http.server 8765` in the repo root, open
   `http://127.0.0.1:8765/dev/?s=printing,paused,ready&printer=<id>` (light / dark, a few
   languages, 360 px width), and `python dev/screenshots.py` for the README images.

**Separately** (your own repo, a HACS plugin, or `/config/www`): load your file as a dashboard
resource, or reference it from the card:

```yaml
type: custom:sdcp-printer-card
drawings:
  acme-resin-9000: /local/sdcp-printer-acme-resin-9000.js
printer: acme-resin-9000   # not needed once the integration reports this profile
```

The registration snippet in the template works whether your file or the card loads first.

## Translations

Card strings are in `I18N` (core) for en, fr, de, es, uk, ru; editor labels in
`EDITOR_LABELS`. Add a language by copying the `en` block — missing keys fall back to English
only per language, so keep the blocks complete. A drawing's own strings go into its `i18n`.

## Checks

- `node --check dist/*.js`
- the dev page with `?drawing=…` for drawings outside `dist/`
- no console errors in a real Home Assistant (Settings → Dashboards → Resources shows one
  entry for the card; the drawing files are fetched from the same folder)
