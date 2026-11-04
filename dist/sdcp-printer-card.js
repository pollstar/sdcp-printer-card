/*
 * SDCP Printer Card — Lovelace card for 3D printers on the SDCP protocol
 * (ELEGOO Saturn / Mars / Jupiter resin printers, Centauri Carbon and other
 * Chitu boards). Needs the `sdcp` integration (https://github.com/pollstar/ha-sdcp).
 *
 * The printer drawing is loaded on demand from a file next to this one
 * (sdcp-printer-<profile>.js); the integration tells which profile fits the
 * detected printer, so only that drawing is downloaded.
 * Author: Pavel Starovoitov (@pollstar). Styled to match energy-meter-card.
 *
 *   type: custom:sdcp-printer-card
 *   device: <device_id>       # optional; the first SDCP printer by default
 *   title: Saturn             # optional; device name by default
 *   theme: auto               # auto | light | dark
 *   show_controls: true       # pause / resume / stop
 *   show_files: true          # file browser (start / delete prints)
 *   show_camera: true         # camera button, when the camera entity is enabled
 *   show_health: true         # self-test dots on the printer parts
 *   printer: auto             # drawing: auto (from the integration) | saturn-4-ultra | generic-resin | generic-fdm | <your id>
 *   drawings:                 # optional: extra drawing modules, id -> URL
 *     my-printer: /local/sdcp-printer-my-printer.js
 *
 * Entities are found by device and translation key, so renaming them is fine.
 * Language follows the HA UI language: English, French, German, Spanish, Ukrainian, Russian
 * (English for anything else).
 * Vanilla JS, no dependencies.
 */

const CARD_VERSION = "0.6.0";

// printer profile -> drawing module next to this file
const SCENE_FILES = {
  "saturn-4-ultra": "sdcp-printer-saturn-4-ultra.js",
  "generic-resin": "sdcp-printer-generic-resin.js",
  "generic-fdm": "sdcp-printer-generic-fdm.js",
};
// fallback when the integration is older and does not report a profile
const MODEL_PROFILES = [[/saturn\s*4\s*ultra/i, "saturn-4-ultra"]];

// ---- drawing registry (public API, see CONTRIBUTING.md) ---------------------
// A drawing is { kind: "resin"|"fdm", render(m, api) -> "<svg …>", style?, i18n? }.
// Drawings register themselves in window.__sdcpScenes[id] (works even when they
// load before this file) and announce it with a "sdcp-drawing-registered" event.
const API_VERSION = 1;
const SCENES = (window.__sdcpScenes = window.__sdcpScenes || {});
const SCENE_LOADS = {};

function registerDrawing(id, def) {
  if (!id || typeof def?.render !== "function") throw new Error("sdcp-printer-card: a drawing needs an id and render()");
  SCENES[id] = { kind: "resin", ...def };
  window.dispatchEvent(new CustomEvent("sdcp-drawing-registered", { detail: { id } }));
}
window.sdcpPrinterCard = Object.assign(window.sdcpPrinterCard || {}, {
  apiVersion: API_VERSION, registerDrawing, drawings: SCENES, files: SCENE_FILES,
});

function sceneUrl(file) {
  if (/^(https?:)?\/\//.test(file) || file.startsWith("/")) return new URL(file, location.href).href;
  const u = new URL(import.meta.url);  // keeps ?hacstag=… so updates bypass the cache
  u.pathname = u.pathname.replace(/[^/]*$/, file);
  return u.href;
}
const DOMAIN = "sdcp";

const I18N = {
  en: {
    printer: "3D printer", offline: "Offline", no_device: "No SDCP printer found. Add the SDCP integration first.",
    st: { idle: "Idle", homing: "Homing", dropping: "Lowering", exposing: "Exposing", lifting: "Lifting",
      pausing: "Pausing", paused: "Paused", stopping: "Stopping", stopped: "Stopped", complete: "Complete",
      file_checking: "Checking file", resuming: "Resuming", printing: "Printing", heating: "Heating",
      leveling: "Leveling", unknown: "Unknown" },
    ms: { file_transferring: "Receiving file", exposure_testing: "Exposure test", devices_testing: "Self-test" },
    layer_of: "layer {c} of {t}", ready: "Ready to print", stage: "Stage", elapsed: "Elapsed", remaining: "Remaining",
    finish: "Finish", finished: "Duration", ended: "Ended", conn: "Connection", lost: "lost {t}", layers: "layers", today: "today", tomorrow: "tomorrow", started: "Started",
    vat: "Vat", uv: "UV LED", nozzle: "Nozzle", bed: "Bed", chamber: "Chamber", heating: "heating", target: "target {t}",
    film: "Release film", lcd: "LCD", cycles: "cycles", health_ok: "Self-test: all {n} OK", health_bad: "Fault",
    error: "Error", pause: "Pause", resume: "Resume", stop: "Stop", stop_confirm: "Tap again to stop",
    files: "Files", camera: "Camera", close: "Close", back: "Up", print: "Print", delete: "Delete",
    print_q: "Start printing?", delete_q: "Delete this file?", yes: "Yes", no: "No",
    loading: "Loading…", empty: "No files", busy: "Printer is busy", used: "{u} of {t} used",
    failed: "Failed: {e}", started_ok: "Print started", deleted: "Deleted", sent: "Sent",
    no_camera: "Camera stream is not available", z: "Z {c} / {t} mm",
    e: { md5_check: "File checksum", file_not_found: "File not found", file_read: "File read error",
      resolution_mismatch: "Resolution mismatch", unknown_format: "Unknown format", wrong_model: "Sliced for another model", unknown: "Error" },
    plate: "Build plate", strain: "load cell", parked: "parked", of: "of {v}", wear: "{p} % used", uv_on: "● exposing", uv_off: "off", layer: "Layer", tilt: "Vat tilt", fault: "fault", peel: "peeling", ok: "OK", lcd_hours: "hours on", z_motor: "Z motor", up: "lifting", down: "lowering", hold: "printing", idle_m: "idle", aux_fan: "Side fan", model_fan: "Part fan", box_fan: "Chamber fan", z_axis: "Z axis", free: "{v} free", per_layer: "≈ {s} s / layer", layers_t: "Layers", g: "g", bottom: "{n} bottom · {s} s", height: "height",
    h: "h", min: "min", s: "s", mm: "mm", ml: "ml",
  },
  ru: {
    printer: "3D-принтер", offline: "Нет связи", no_device: "SDCP-принтер не найден. Сначала добавьте интеграцию SDCP.",
    st: { idle: "Простой", homing: "Парковка", dropping: "Опускание", exposing: "Засветка", lifting: "Подъём",
      pausing: "Приостановка", paused: "Пауза", stopping: "Остановка", stopped: "Остановлено", complete: "Завершено",
      file_checking: "Проверка файла", resuming: "Возобновление", printing: "Печать", heating: "Нагрев",
      leveling: "Калибровка", unknown: "Неизвестно" },
    ms: { file_transferring: "Приём файла", exposure_testing: "Тест засветки", devices_testing: "Самопроверка" },
    layer_of: "слой {c} из {t}", ready: "Готов к печати", stage: "Стадия", elapsed: "Прошло", remaining: "Осталось",
    finish: "Финиш", finished: "Длительность", ended: "Закончено", conn: "Связь", lost: "потеряна {t}", layers: "слоёв", today: "сегодня", tomorrow: "завтра", started: "Старт",
    vat: "Ванна", uv: "UV-LED", nozzle: "Сопло", bed: "Стол", chamber: "Камера", heating: "нагрев", target: "цель {t}",
    film: "Плёнка", lcd: "LCD", cycles: "циклов", health_ok: "Самодиагностика: все {n} в норме", health_bad: "Неисправность",
    error: "Ошибка", pause: "Пауза", resume: "Продолжить", stop: "Стоп", stop_confirm: "Ещё раз — остановить",
    files: "Файлы", camera: "Камера", close: "Закрыть", back: "Вверх", print: "Печать", delete: "Удалить",
    print_q: "Запустить печать?", delete_q: "Удалить файл?", yes: "Да", no: "Нет",
    loading: "Загрузка…", empty: "Файлов нет", busy: "Принтер занят", used: "занято {u} из {t}",
    failed: "Не удалось: {e}", started_ok: "Печать запущена", deleted: "Удалено", sent: "Отправлено",
    no_camera: "Видеопоток недоступен", z: "Z {c} / {t} мм",
    e: { md5_check: "Контрольная сумма файла", file_not_found: "Файл не найден", file_read: "Ошибка чтения файла",
      resolution_mismatch: "Разрешение не совпадает", unknown_format: "Неизвестный формат", wrong_model: "Нарезан для другой модели", unknown: "Ошибка" },
    plate: "Платформа", strain: "тензодатчик", parked: "парковка", of: "из {v}", wear: "{p} % ресурса", uv_on: "● засветка", uv_off: "выкл", layer: "Слой", tilt: "Наклон ванны", fault: "ошибка", peel: "отрыв", ok: "норма", lcd_hours: "наработка", z_motor: "Мотор Z", up: "подъём", down: "опускание", hold: "в работе", idle_m: "стоит", aux_fan: "Боковой вент.", model_fan: "Обдув", box_fan: "Вент. камеры", z_axis: "Ось Z", free: "свободно {v}", per_layer: "≈ {s} с на слой", layers_t: "Слоёв", g: "г", bottom: "{n} нижних · {s} с", height: "высота",
    h: "ч", min: "мин", s: "с", mm: "мм", ml: "мл",
  },
  uk: {
    printer: "3D-принтер", offline: "Немає зв'язку", no_device: "SDCP-принтер не знайдено. Спершу додайте інтеграцію SDCP.",
    st: { idle: "Простій", homing: "Паркування", dropping: "Опускання", exposing: "Засвічення", lifting: "Підйом",
      pausing: "Призупинення", paused: "Пауза", stopping: "Зупинка", stopped: "Зупинено", complete: "Завершено",
      file_checking: "Перевірка файлу", resuming: "Відновлення", printing: "Друк", heating: "Нагрівання",
      leveling: "Калібрування", unknown: "Невідомо" },
    ms: { file_transferring: "Прийом файлу", exposure_testing: "Тест засвічення", devices_testing: "Самоперевірка" },
    layer_of: "шар {c} з {t}", ready: "Готовий до друку", stage: "Стадія", elapsed: "Минуло", remaining: "Залишилось",
    finish: "Фініш", finished: "Тривалість", ended: "Закінчено", conn: "Зв'язок", lost: "втрачено {t}", layers: "шарів", today: "сьогодні", tomorrow: "завтра", started: "Старт",
    vat: "Ванна", uv: "UV-LED", nozzle: "Сопло", bed: "Стіл", chamber: "Камера", heating: "нагрів", target: "ціль {t}",
    film: "Плівка", lcd: "LCD", cycles: "циклів", health_ok: "Самодіагностика: усі {n} у нормі", health_bad: "Несправність",
    error: "Помилка", pause: "Пауза", resume: "Продовжити", stop: "Стоп", stop_confirm: "Ще раз — зупинити",
    files: "Файли", camera: "Камера", close: "Закрити", back: "Вгору", print: "Друк", delete: "Видалити",
    print_q: "Запустити друк?", delete_q: "Видалити файл?", yes: "Так", no: "Ні",
    loading: "Завантаження…", empty: "Файлів немає", busy: "Принтер зайнятий", used: "зайнято {u} з {t}",
    failed: "Не вдалося: {e}", started_ok: "Друк запущено", deleted: "Видалено", sent: "Надіслано",
    no_camera: "Відеопотік недоступний", z: "Z {c} / {t} мм",
    e: { md5_check: "Контрольна сума файлу", file_not_found: "Файл не знайдено", file_read: "Помилка читання файлу",
      resolution_mismatch: "Роздільність не збігається", unknown_format: "Невідомий формат", wrong_model: "Нарізано для іншої моделі", unknown: "Помилка" },
    plate: "Платформа", strain: "тензодатчик", parked: "паркування", of: "з {v}", wear: "{p} % ресурсу", uv_on: "● засвічення", uv_off: "вимк", layer: "Шар", tilt: "Нахил ванни", fault: "помилка", peel: "відрив", ok: "норма", lcd_hours: "напрацювання", z_motor: "Мотор Z", up: "підйом", down: "опускання", hold: "у роботі", idle_m: "стоїть", aux_fan: "Бічний вент.", model_fan: "Обдув", box_fan: "Вент. камери", z_axis: "Вісь Z", free: "вільно {v}", per_layer: "≈ {s} с на шар", layers_t: "Шарів", g: "г", bottom: "{n} нижніх · {s} с", height: "висота",
    h: "год", min: "хв", s: "с", mm: "мм", ml: "мл",
  },
  fr: {
    printer: "Imprimante 3D", offline: "Hors ligne", no_device: "Aucune imprimante SDCP trouvée. Ajoutez d'abord l'intégration SDCP.",
    st: { idle: "Au repos", homing: "Mise à l'origine", dropping: "Descente", exposing: "Exposition", lifting: "Levée",
      pausing: "Mise en pause", paused: "En pause", stopping: "Arrêt en cours", stopped: "Arrêtée", complete: "Terminée",
      file_checking: "Vérification du fichier", resuming: "Reprise", printing: "Impression", heating: "Chauffe",
      leveling: "Calibrage", unknown: "Inconnu" },
    ms: { file_transferring: "Réception du fichier", exposure_testing: "Test d'exposition", devices_testing: "Autotest" },
    layer_of: "couche {c} sur {t}", ready: "Prête à imprimer", stage: "Étape", elapsed: "Écoulé", remaining: "Restant",
    finish: "Fin", finished: "Durée", ended: "Terminée", conn: "Connexion", lost: "perdue {t}", layers: "couches", today: "aujourd'hui", tomorrow: "demain", started: "Début",
    vat: "Bac", uv: "LED UV", nozzle: "Buse", bed: "Plateau", chamber: "Enceinte", heating: "chauffe", target: "cible {t}",
    film: "Film FEP", lcd: "LCD", cycles: "cycles", health_ok: "Autotest : {n} OK", health_bad: "Défaut",
    error: "Erreur", pause: "Pause", resume: "Reprendre", stop: "Arrêter", stop_confirm: "Touchez encore pour arrêter",
    files: "Fichiers", camera: "Caméra", close: "Fermer", back: "Remonter", print: "Imprimer", delete: "Supprimer",
    print_q: "Lancer l'impression ?", delete_q: "Supprimer ce fichier ?", yes: "Oui", no: "Non",
    loading: "Chargement…", empty: "Aucun fichier", busy: "Imprimante occupée", used: "{u} utilisés sur {t}",
    failed: "Échec : {e}", started_ok: "Impression lancée", deleted: "Supprimé", sent: "Envoyé",
    no_camera: "Flux de la caméra indisponible", z: "Z {c} / {t} mm",
    e: { md5_check: "Somme de contrôle du fichier", file_not_found: "Fichier introuvable", file_read: "Erreur de lecture du fichier",
      resolution_mismatch: "Résolution incompatible", unknown_format: "Format inconnu", wrong_model: "Tranché pour un autre modèle", unknown: "Erreur" },
    plate: "Plateau", strain: "capteur de force", parked: "garé", of: "sur {v}", wear: "{p} % usé", uv_on: "● exposition", uv_off: "éteintes", layer: "Couche", tilt: "Inclinaison", fault: "défaut", peel: "décollement", ok: "OK", lcd_hours: "heures d'utilisation", z_motor: "Moteur Z", up: "montée", down: "descente", hold: "en marche", idle_m: "à l'arrêt", aux_fan: "Ventil. latéral", model_fan: "Ventil. pièce", box_fan: "Ventil. enceinte", z_axis: "Axe Z", free: "{v} libres", per_layer: "≈ {s} s / couche", layers_t: "Couches", g: "g", bottom: "{n} de base · {s} s", height: "hauteur",
    h: "h", min: "min", s: "s", mm: "mm", ml: "ml",
  },
  de: {
    printer: "3D-Drucker", offline: "Offline", no_device: "Kein SDCP-Drucker gefunden. Richten Sie zuerst die SDCP-Integration ein.",
    st: { idle: "Leerlauf", homing: "Referenzfahrt", dropping: "Absenken", exposing: "Belichtung", lifting: "Anheben",
      pausing: "Wird pausiert", paused: "Pausiert", stopping: "Wird gestoppt", stopped: "Gestoppt", complete: "Fertig",
      file_checking: "Datei wird geprüft", resuming: "Wird fortgesetzt", printing: "Druckt", heating: "Aufheizen",
      leveling: "Nivellierung", unknown: "Unbekannt" },
    ms: { file_transferring: "Datei wird empfangen", exposure_testing: "Belichtungstest", devices_testing: "Selbsttest" },
    layer_of: "Schicht {c} von {t}", ready: "Druckbereit", stage: "Phase", elapsed: "Vergangen", remaining: "Verbleibend",
    finish: "Fertig um", finished: "Dauer", ended: "Beendet", conn: "Verbindung", lost: "getrennt {t}", layers: "Schichten", today: "heute", tomorrow: "morgen", started: "Start",
    vat: "Wanne", uv: "UV-LED", nozzle: "Düse", bed: "Bett", chamber: "Kammer", heating: "heizt", target: "Soll {t}",
    film: "Trennfolie", lcd: "LCD", cycles: "Zyklen", health_ok: "Selbsttest: alle {n} OK", health_bad: "Störung",
    error: "Fehler", pause: "Pause", resume: "Fortsetzen", stop: "Stopp", stop_confirm: "Nochmal tippen zum Stoppen",
    files: "Dateien", camera: "Kamera", close: "Schließen", back: "Nach oben", print: "Drucken", delete: "Löschen",
    print_q: "Druck starten?", delete_q: "Datei löschen?", yes: "Ja", no: "Nein",
    loading: "Wird geladen…", empty: "Keine Dateien", busy: "Drucker ist beschäftigt", used: "{u} von {t} belegt",
    failed: "Fehlgeschlagen: {e}", started_ok: "Druck gestartet", deleted: "Gelöscht", sent: "Gesendet",
    no_camera: "Kamerastream nicht verfügbar", z: "Z {c} / {t} mm",
    e: { md5_check: "Prüfsumme der Datei", file_not_found: "Datei nicht gefunden", file_read: "Fehler beim Lesen der Datei",
      resolution_mismatch: "Auflösung passt nicht", unknown_format: "Unbekanntes Format", wrong_model: "Für ein anderes Modell geslict", unknown: "Fehler" },
    plate: "Druckplatte", strain: "Kraftsensor", parked: "geparkt", of: "von {v}", wear: "{p} % verbraucht", uv_on: "● belichtet", uv_off: "aus", layer: "Schicht", tilt: "Wannenkippung", fault: "Störung", peel: "Ablösen", ok: "OK", lcd_hours: "Betriebsstunden", z_motor: "Z-Motor", up: "hebt", down: "senkt", hold: "in Betrieb", idle_m: "steht", aux_fan: "Seitenlüfter", model_fan: "Bauteillüfter", box_fan: "Kammerlüfter", z_axis: "Z-Achse", free: "{v} frei", per_layer: "≈ {s} s / Schicht", layers_t: "Schichten", g: "g", bottom: "{n} Basis · {s} s", height: "Höhe",
    h: "Std.", min: "Min.", s: "s", mm: "mm", ml: "ml",
  },
  es: {
    printer: "Impresora 3D", offline: "Sin conexión", no_device: "No se encontró ninguna impresora SDCP. Añade primero la integración SDCP.",
    st: { idle: "En reposo", homing: "Buscando origen", dropping: "Bajando", exposing: "Exponiendo", lifting: "Subiendo",
      pausing: "Pausando", paused: "En pausa", stopping: "Deteniendo", stopped: "Detenida", complete: "Completada",
      file_checking: "Comprobando archivo", resuming: "Reanudando", printing: "Imprimiendo", heating: "Calentando",
      leveling: "Nivelando", unknown: "Desconocido" },
    ms: { file_transferring: "Recibiendo archivo", exposure_testing: "Prueba de exposición", devices_testing: "Autodiagnóstico" },
    layer_of: "capa {c} de {t}", ready: "Lista para imprimir", stage: "Etapa", elapsed: "Transcurrido", remaining: "Restante",
    finish: "Fin", finished: "Duración", ended: "Terminada", conn: "Conexión", lost: "perdida {t}", layers: "capas", today: "hoy", tomorrow: "mañana", started: "Inicio",
    vat: "Cubeta", uv: "LED UV", nozzle: "Boquilla", bed: "Cama", chamber: "Cámara", heating: "calentando", target: "objetivo {t}",
    film: "Lámina FEP", lcd: "LCD", cycles: "ciclos", health_ok: "Autodiagnóstico: los {n} OK", health_bad: "Avería",
    error: "Error", pause: "Pausa", resume: "Reanudar", stop: "Detener", stop_confirm: "Toca otra vez para detener",
    files: "Archivos", camera: "Cámara", close: "Cerrar", back: "Subir", print: "Imprimir", delete: "Eliminar",
    print_q: "¿Iniciar la impresión?", delete_q: "¿Eliminar este archivo?", yes: "Sí", no: "No",
    loading: "Cargando…", empty: "No hay archivos", busy: "La impresora está ocupada", used: "{u} de {t} en uso",
    failed: "Error: {e}", started_ok: "Impresión iniciada", deleted: "Eliminado", sent: "Enviado",
    no_camera: "La cámara no está disponible", z: "Z {c} / {t} mm",
    e: { md5_check: "Suma de verificación del archivo", file_not_found: "Archivo no encontrado", file_read: "Error de lectura del archivo",
      resolution_mismatch: "Resolución incompatible", unknown_format: "Formato desconocido", wrong_model: "Laminado para otro modelo", unknown: "Error" },
    plate: "Plataforma", strain: "galga extensiométrica", parked: "aparcada", of: "de {v}", wear: "{p} % usado", uv_on: "● exponiendo", uv_off: "apagado", layer: "Capa", tilt: "Inclinación", fault: "avería", peel: "despegando", ok: "OK", lcd_hours: "horas de uso", z_motor: "Motor Z", up: "subiendo", down: "bajando", hold: "en marcha", idle_m: "parado", aux_fan: "Ventil. lateral", model_fan: "Ventil. de pieza", box_fan: "Ventil. de cámara", z_axis: "Eje Z", free: "{v} libres", per_layer: "≈ {s} s / capa", layers_t: "Capas", g: "g", bottom: "{n} de base · {s} s", height: "altura",
    h: "h", min: "min", s: "s", mm: "mm", ml: "ml",
  },
};

const ACTIVE = new Set(["homing", "dropping", "exposing", "lifting", "file_checking", "resuming", "printing", "heating", "leveling"]);
const PAUSED = new Set(["pausing", "paused"]);
const ICONS = {
  printer: "mdi:printer-3d", resin: "mdi:printer-3d-nozzle-outline", pause: "mdi:pause", play: "mdi:play",
  stop: "mdi:stop", files: "mdi:folder-outline", camera: "mdi:cctv", vat: "mdi:cup-water", uv: "mdi:led-on",
  nozzle: "mdi:printer-3d-nozzle-heat-outline", bed: "mdi:radiator", chamber: "mdi:thermometer",
  flame: "mdi:fire", ok: "mdi:check-circle-outline", warn: "mdi:alert", err: "mdi:alert-circle",
  film: "mdi:layers-triple-outline", lcd: "mdi:monitor-shimmer", file: "mdi:cube-outline",
  folder: "mdi:folder", sd: "mdi:sd", usb: "mdi:usb-flash-drive-outline", up: "mdi:arrow-up", close: "mdi:close",
  del: "mdi:trash-can-outline", time: "mdi:timer-outline", left: "mdi:timer-sand", flag: "mdi:flag-checkered", layers: "mdi:layers-outline",
};

const STYLE = `
  :host { --sp-a:#4f86e8; --sp-uv:#9a6bff; --sp-heat:#ff8a3d; --sp-ok:var(--success-color,#43a047);
          --sp-resin:#f2b33d; --sp-track:var(--divider-color,#e0e0e0); --sp-muted:var(--secondary-text-color,#727272);
          --sp-bg:var(--card-background-color,var(--ha-card-background,#fff));
          --sp-well:color-mix(in srgb,var(--primary-text-color,#1c1c1c) 5%,var(--sp-bg));
          --sp-warn:var(--warning-color,#f4a100); --sp-err:var(--error-color,#db4437);
          --pr-body:color-mix(in srgb,var(--primary-text-color,#1c1c1c) 16%,var(--sp-bg));
          --pr-body2:color-mix(in srgb,var(--primary-text-color,#1c1c1c) 9%,var(--sp-bg));
          --pr-metal:color-mix(in srgb,var(--primary-text-color,#1c1c1c) 34%,var(--sp-bg));
          --pr-edge:color-mix(in srgb,var(--primary-text-color,#1c1c1c) 28%,transparent);
          --pr-screen:#0d1117; }
  :host([data-theme="dark"]) {
    --primary-text-color:#e6e6e6; --secondary-text-color:#9e9e9e; --divider-color:#3a3a3a;
    --card-background-color:#1c1c1c; --ha-card-background:#1c1c1c; --sp-bg:#1c1c1c; color-scheme:dark; }
  :host([data-theme="light"]) {
    --primary-text-color:#1c1c1c; --secondary-text-color:#727272; --divider-color:#e0e0e0;
    --card-background-color:#fff; --ha-card-background:#fff; --sp-bg:#fff; color-scheme:light; }
  ha-card { padding:16px; overflow:hidden; font-variant-numeric:tabular-nums; position:relative; container-type:inline-size; }
  [hidden] { display:none !important; }
  .hdr { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
  .title { font-size:18px; font-weight:500; flex:1 1 auto; min-width:0; white-space:nowrap; overflow:hidden;
           text-overflow:ellipsis; color:var(--primary-text-color); }
  .title small { display:block; font-size:12px; font-weight:400; color:var(--sp-muted); }
  .chips { display:flex; gap:6px; flex-wrap:wrap; }
  .chip { display:inline-flex; align-items:center; gap:6px; height:26px; padding:0 10px; border-radius:13px;
          font-size:12px; font-weight:500; cursor:pointer; user-select:none; color:var(--primary-text-color);
          background:color-mix(in srgb,var(--primary-text-color) 7%,transparent); white-space:nowrap; }
  .chip .dot { width:8px; height:8px; border-radius:50%; background:var(--c,var(--sp-muted)); }
  .chip.run .dot { animation:pulse 1.6s ease-in-out infinite; }
  .chip ha-icon { --mdc-icon-size:16px; color:var(--c); }
  .chip.err { --c:var(--sp-err); background:color-mix(in srgb,var(--sp-err) 15%,transparent); }
  @keyframes pulse { 50% { opacity:.35; transform:scale(.8); } }

  /* ---- printer scene ---- */
  .scene { display:block; width:100%; height:auto; margin:2px 0 4px; user-select:none; overflow:visible; }
  .scene text { font-family:inherit; }
  .scene .body { fill:url(#sp-body); stroke:var(--pr-edge); stroke-width:1; }
  .scene .body2 { fill:var(--pr-body2); stroke:var(--pr-edge); stroke-width:1; }
  .scene .metal { fill:var(--pr-metal); }
  .scene .screw { stroke:color-mix(in srgb,var(--primary-text-color) 45%,transparent); stroke-width:1.2; stroke-dasharray:1.5 2.5; }
  .scene .shadow { fill:rgba(0,0,0,.22); }
  .scene .screen { fill:var(--pr-screen); stroke:var(--pr-edge); }
  .scene .screen-t { fill:#8fb4ff; font-size:10px; font-weight:700; }
  .scene .screen-s { fill:#5d6b85; font-size:6.5px; }
  .scene .lcd { fill:#1b2130; stroke:var(--pr-edge); transition:fill .4s; }
  .scene .lcd-img { fill:var(--sp-uv); opacity:0; transition:opacity .3s; }
  .scene .uvwin { fill:color-mix(in srgb,var(--pr-screen) 70%,transparent); stroke:var(--pr-edge); stroke-dasharray:2 2; }
  .scene .led { fill:#3a3550; transition:fill .3s; }
  .scene .glow { fill:url(#sp-uvglow); opacity:0; transition:opacity .3s; }
  .scene .vat { fill:color-mix(in srgb,var(--primary-text-color) 6%,transparent); stroke:var(--pr-metal); stroke-width:1.6; }
  .scene .resin { fill:url(#sp-resin); }
  .scene .film { stroke:color-mix(in srgb,var(--sp-a) 70%,var(--primary-text-color)); stroke-width:1.6; }
  .scene .heater { fill:none; stroke:var(--pr-metal); stroke-width:1.6; stroke-linecap:round; transition:stroke .3s; }
  .scene.hot-v .heater { stroke:var(--sp-heat); filter:url(#sp-soft); }
  .scene .motor { fill:var(--pr-metal); stroke:var(--pr-edge); }
  .scene .motor-c { fill:var(--pr-body2); }
  .scene .plate { fill:url(#sp-plate); stroke:var(--pr-edge); }
  .scene .arm { fill:var(--pr-metal); }
  .scene .sg { fill:var(--sp-a); opacity:.8; }
  .scene .model { fill:url(#sp-model); stroke:color-mix(in srgb,var(--sp-resin) 60%,#000); stroke-width:.6; }
  .scene .sup { stroke:color-mix(in srgb,var(--sp-resin) 80%,#000); stroke-width:.8; }
  .scene .lid { fill:url(#sp-lid); stroke:color-mix(in srgb,var(--primary-text-color) 30%,transparent); stroke-width:1; }
  .scene .lid-hl { fill:none; stroke:rgba(255,255,255,.18); stroke-width:3; stroke-linecap:round; }
  .scene .carriage { transition:transform 1.2s cubic-bezier(.4,0,.2,1); }
  .scene .tilt { transition:transform .8s ease; transform-origin:144px 202px; }
  .scene.s-lifting .tilt { transform:rotate(-1.6deg); }
  .scene.s-exposing .lcd-img { opacity:.95; }
  .scene.s-exposing .led { fill:#c9b4ff; }
  .scene.s-exposing .glow { opacity:1; animation:uvp 1.4s ease-in-out infinite; }
  @keyframes uvp { 50% { opacity:.55; } }
  .scene.off { filter:grayscale(1); opacity:.55; }
  /* FDM */
  .scene .frame { fill:color-mix(in srgb,var(--primary-text-color) 4%,transparent); stroke:var(--pr-metal); stroke-width:2; }
  .scene .rail { fill:var(--pr-metal); }
  .scene .head { fill:var(--pr-body); stroke:var(--pr-edge); }
  .scene .nozzle { fill:var(--pr-metal); transition:fill .3s; }
  .scene .hot-n .nozzle { fill:var(--sp-heat); }
  .scene .bed { fill:var(--pr-metal); transition:fill .3s; }
  .scene .hot-b .bed { fill:color-mix(in srgb,var(--sp-heat) 70%,var(--pr-metal)); }
  .scene .fdm-model { fill:url(#sp-model-f); }
  .scene .fan { fill:none; stroke:var(--pr-metal); stroke-width:1.4; }
  .scene .spin .blades { animation:spin 1s linear infinite; transform-box:fill-box; transform-origin:center; }
  @keyframes spin { to { transform:rotate(360deg); } }
  /* callouts */
  .co { cursor:pointer; }
  .co .ln { fill:none; stroke:color-mix(in srgb,var(--primary-text-color) 32%,transparent); stroke-width:.9; }
  .co .pin { fill:var(--sp-bg); stroke:var(--c,var(--sp-a)); stroke-width:1.6; }
  .co .lb { fill:var(--sp-muted); font-size:10px; letter-spacing:.2px; }
  .co .vl { fill:var(--primary-text-color); font-size:13.5px; font-weight:650; }
  .co .sb { fill:var(--sp-muted); font-size:10px; }
  .co .sb.hot { fill:var(--sp-heat); font-weight:600; }
  .co .sb.on { fill:var(--sp-uv); font-weight:600; }
  .co .hd { fill:var(--sp-ok); }
  .co.bad .hd, .co.bad .pin { fill:var(--sp-err); stroke:var(--sp-err); }
  .co.bad .ln { stroke:var(--sp-err); }
  .co.bad .vl { fill:var(--sp-err); }
  .co:hover .ln { stroke:var(--sp-a); }

  .scene-ph { aspect-ratio:420/300; }
  /* status strip */
  .stat { display:flex; align-items:center; gap:12px; margin:6px 0 2px; }
  .stat .pct { font-size:34px; font-weight:700; line-height:1; color:var(--primary-text-color); cursor:pointer; letter-spacing:-.5px; }
  .stat .pct small { font-size:16px; color:var(--sp-muted); font-weight:600; margin-left:1px; }
  .stat .op { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px; cursor:pointer; }
  .stat .opn { display:flex; align-items:center; gap:7px; font-size:16px; font-weight:650; color:var(--c); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .stat .opn .dot { width:9px; height:9px; border-radius:50%; background:var(--c); flex:0 0 auto; }
  .stat .opn .dot.run { animation:pulse 1.6s ease-in-out infinite; }
  .stat .ops { font-size:12.5px; color:var(--sp-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .stat .rem { display:flex; flex-direction:column; align-items:flex-end; cursor:pointer; flex:0 0 auto; }
  .stat .rem .k { font-size:12px; color:var(--sp-muted); }
  .stat .rem .v { font-size:18px; font-weight:700; color:var(--primary-text-color); white-space:nowrap; }
  .stat + .bar { margin:8px 0 2px; }
  /* ---- progress ---- */
  .prog { margin-top:4px; }
  .prog-h { display:flex; align-items:baseline; gap:10px; }
  .prog-h .pct { font-size:28px; font-weight:700; line-height:1; color:var(--primary-text-color); }
  .prog-h .pct small { font-size:15px; color:var(--sp-muted); font-weight:600; margin-left:1px; }
  .prog-h .st { font-size:13px; font-weight:600; color:var(--c,var(--sp-a)); }
  .prog-h .ly { margin-left:auto; font-size:12.5px; color:var(--sp-muted); white-space:nowrap; }
  .prog-h .ly b { color:var(--primary-text-color); font-weight:600; }
  .bar { position:relative; height:12px; margin-top:8px; border-radius:6px; background:var(--sp-track); overflow:hidden; cursor:pointer; }
  .bar div { position:absolute; inset:0 auto 0 0; border-radius:6px; transition:width .6s;
             background:repeating-linear-gradient(90deg,var(--c,var(--sp-a)) 0 3px,color-mix(in srgb,var(--c,var(--sp-a)) 72%,#fff) 3px 4px); }
  .cells { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:6px; }
  .cell { padding:8px 10px; border-radius:12px; background:var(--sp-well); cursor:pointer; min-width:0; }
  .cell .k { display:flex; align-items:center; gap:4px; font-size:11.5px; color:var(--sp-muted); white-space:nowrap; }
  .cell .k ha-icon { --mdc-icon-size:14px; }
  .cell .v { font-size:14.5px; font-weight:600; color:var(--primary-text-color); margin-top:2px; line-height:1.25; }
  .cell.dimc .v { color:var(--sp-muted); }

  .job { display:flex; align-items:center; gap:12px; margin-top:10px; padding:8px; border-radius:14px;
         border:1px solid var(--sp-track); cursor:pointer; }
  .thumb { width:44px; height:44px; flex:0 0 auto; border-radius:10px; display:flex; align-items:center;
           justify-content:center; background:color-mix(in srgb,var(--sp-resin) 18%,var(--sp-bg)); overflow:hidden; }
  .thumb img { width:100%; height:100%; object-fit:cover; }
  .thumb ha-icon { --mdc-icon-size:24px; color:var(--sp-resin); }
  .job .nm { min-width:0; flex:1 1 auto; }
  .job .fn { font-size:13.5px; font-weight:600; color:var(--primary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .job .meta { font-size:11.5px; color:var(--sp-muted); margin-top:2px; display:flex; gap:2px 10px; flex-wrap:wrap; }
  .job .meta b { font-weight:600; color:var(--primary-text-color); }

  .err-box { margin-top:10px; padding:10px 12px; border-radius:12px; font-size:13px; display:flex; gap:8px; align-items:center;
             color:var(--sp-err); background:color-mix(in srgb,var(--sp-err) 12%,transparent); cursor:pointer; }
  .err-box ha-icon { --mdc-icon-size:20px; }
  .idle-note { margin-top:4px; font-size:13px; color:var(--sp-muted); text-align:center; }

  .actions { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:14px; }
  .btn { all:unset; cursor:pointer; display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 16px;
         border-radius:20px; font-size:13px; font-weight:500; color:var(--primary-text-color);
         background:color-mix(in srgb,var(--primary-text-color) 7%,transparent); transition:background .2s,color .2s; }
  .btn:hover { background:color-mix(in srgb,var(--primary-text-color) 11%,transparent); }
  .btn:focus-visible { outline:2px solid var(--primary-color,#03a9f4); outline-offset:2px; }
  .btn ha-icon { --mdc-icon-size:20px; color:var(--sp-muted); }
  .btn.ico { width:40px; padding:0; justify-content:center; }
  .btn.pri { background:color-mix(in srgb,var(--sp-a) 18%,transparent); }
  .btn.pri ha-icon { color:var(--sp-a); }
  .btn.danger ha-icon { color:var(--sp-err); }
  .btn.armed { background:var(--sp-err); color:#fff; } .btn.armed ha-icon { color:#fff; }

  .toast { position:absolute; left:50%; bottom:12px; transform:translate(-50%,20px); opacity:0; pointer-events:none;
           padding:8px 14px; border-radius:10px; font-size:13px; background:var(--primary-text-color); color:var(--sp-bg);
           transition:opacity .25s, transform .25s; max-width:85%; text-align:center; z-index:2; }
  .toast.show { opacity:1; transform:translate(-50%,0); }
  .banner { display:flex; align-items:center; gap:10px; margin:-4px 0 12px; padding:8px 12px; border-radius:12px; font-size:13px;
            background:color-mix(in srgb,var(--sp-warn) 18%,transparent); }
  .banner button { all:unset; cursor:pointer; margin-left:auto; font-weight:600; color:var(--primary-color,#03a9f4); }
  .note { padding:24px 8px; text-align:center; color:var(--sp-muted); font-size:13px; }

  .backdrop { position:fixed; inset:0; z-index:9; background:rgba(0,0,0,.45); display:flex;
              align-items:center; justify-content:center; padding:16px; }
  .dlg { width:min(560px,100%); max-height:min(80vh,720px); display:flex; flex-direction:column; overflow:hidden;
         background:var(--sp-bg); color:var(--primary-text-color); border-radius:20px; box-shadow:0 12px 40px rgba(0,0,0,.35); }
  .dlg header { display:flex; align-items:center; gap:8px; padding:12px 12px 8px 20px; }
  .dlg header .t { flex:1; font-size:17px; font-weight:500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dlg header .t small { display:block; font-size:12px; color:var(--sp-muted); font-weight:400; }
  .ib { all:unset; cursor:pointer; width:40px; height:40px; border-radius:50%; display:inline-flex; align-items:center;
        justify-content:center; flex:0 0 auto; }
  .ib:hover { background:color-mix(in srgb,var(--primary-text-color) 8%,transparent); }
  .ib ha-icon { --mdc-icon-size:20px; color:var(--sp-muted); }
  .ib.go ha-icon { color:var(--sp-a); } .ib.del ha-icon { color:var(--sp-err); }
  .ib[disabled] { opacity:.35; pointer-events:none; }
  .dlg .body { overflow:auto; padding:0 12px 16px; }
  .store { margin:0 8px 10px; }
  .wr-h { display:flex; justify-content:space-between; gap:8px; font-size:12.5px; color:var(--sp-muted); margin-bottom:5px; }
  .wr-bar { height:6px; border-radius:3px; background:var(--sp-track); overflow:hidden; }
  .wr-bar div { height:100%; border-radius:3px; background:var(--sp-a); }
  .fl { display:flex; flex-direction:column; }
  .fr { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:12px; min-height:44px; }
  .fr:hover { background:color-mix(in srgb,var(--primary-text-color) 5%,transparent); }
  .fr > ha-icon { --mdc-icon-size:22px; color:var(--sp-resin); flex:0 0 auto; }
  .fr.dir { cursor:pointer; } .fr.dir > ha-icon { color:var(--sp-a); }
  .fr .n { flex:1; min-width:0; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .fr .n small { display:block; font-size:11.5px; color:var(--sp-muted); }
  .fr .q { font-size:13px; color:var(--sp-muted); white-space:nowrap; }
  .fr .yes, .fr .no { all:unset; cursor:pointer; font-size:13px; font-weight:600; padding:6px 10px; border-radius:8px; }
  .fr .yes { color:#fff; background:var(--sp-a); } .fr .yes.del { background:var(--sp-err); }
  .fr .no { color:var(--sp-muted); }
  .cam { background:#000; aspect-ratio:16/9; border-radius:12px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
  .cam ha-camera-stream { width:100%; height:100%; }
  .cam .note { color:#bbb; }
  @container (max-width:380px) {
    .stat { gap:8px; } .stat .pct { font-size:28px; } .stat .opn { font-size:14.5px; } .stat .rem .v { font-size:15px; }
    .cells { gap:6px; } .cell { padding:7px 8px; } .cell .v { font-size:13px; }
    .actions { gap:8px; } .btn { padding:0 12px; } .btn.ico { padding:0; }
  }
`;

const tpl = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

class SDCPPrinterCard extends HTMLElement {
  static getConfigElement() { return document.createElement("sdcp-printer-card-editor"); }

  static getStubConfig(hass) {
    const dev = SDCPPrinterCard._devices(hass)[0];
    return dev ? { device: dev } : {};
  }

  static _devices(hass) {
    const out = [];
    for (const e of Object.values(hass?.entities || {})) {
      if (e.platform === DOMAIN && e.device_id && !out.includes(e.device_id)) out.push(e.device_id);
    }
    return out;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cfg = {};
    this._ents = null;
    this._dlg = null;
    this._toastT = 0;
    this._armed = 0;
    this._sig = {};
  }

  setConfig(config) {
    this._cfg = { theme: "auto", show_controls: true, show_files: true, show_camera: true, show_health: true,
                  ...(config || {}) };
    this._ents = null;
    this._sig = {};
    this.shadowRoot.innerHTML = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._onDrawing = this._onDrawing || (() => { this._sig.scene = null; this._render(); });
    window.addEventListener("sdcp-drawing-registered", this._onDrawing);
  }

  disconnectedCallback() {
    if (this._onDrawing) window.removeEventListener("sdcp-drawing-registered", this._onDrawing);
  }

  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  // ---- i18n / formatting ---------------------------------------------------
  get _t() {
    const l = (this._hass?.locale?.language || this._hass?.language || "en").slice(0, 2);
    return I18N[l] || I18N.en;
  }
  get _lang() { return this._hass?.locale?.language || this._hass?.language || "en"; }
  _fmt(v, d = 0) {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return new Intl.NumberFormat(this._lang, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  }
  _dur(min) {
    if (min === null || min === undefined || Number.isNaN(min)) return "—";
    const t = this._t;
    const m = Math.max(0, Math.round(min));
    const h = Math.floor(m / 60);
    if (h >= 1) return `${h} ${t.h} ${String(m % 60).padStart(2, "0")} ${t.min}`;
    if (m >= 1) return `${m} ${t.min}`;
    return `${Math.max(0, Math.round(min * 60))} ${t.s}`;
  }
  _when(date) {
    if (!date || Number.isNaN(date.getTime())) return "—";
    const t = this._t;
    const now = new Date();
    const hm = date.toLocaleTimeString(this._lang, { hour: "2-digit", minute: "2-digit" });
    const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diff = Math.round((day(date) - day(now)) / 86400000);
    if (diff === 0) return `${t.today} ${hm}`;
    if (diff === 1) return `${t.tomorrow} ${hm}`;
    return `${date.toLocaleDateString(this._lang, { weekday: "short" })} ${hm}`;
  }
  _bytes(n) {
    if (n === null || n === undefined) return "—";
    const u = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return `${this._fmt(n, i >= 3 ? 1 : 0)} ${u[i]}`;
  }

  // ---- entities ------------------------------------------------------------
  _device() {
    if (this._cfg.device) return this._cfg.device;
    return SDCPPrinterCard._devices(this._hass)[0] || null;
  }
  _map() {
    const dev = this._device();
    const sig = `${dev}|${Object.keys(this._hass.entities || {}).length}`;
    if (this._ents && this._ents.sig === sig) return this._ents;
    const by = {};
    const health = [];
    for (const e of Object.values(this._hass.entities || {})) {
      if (e.platform !== DOMAIN || e.device_id !== dev) continue;
      const k = e.translation_key || e.entity_id.split(".")[1];
      if (e.entity_id.startsWith("binary_sensor.") && (k.startsWith("health_") || e.entity_id.includes("_health_"))) {
        health.push(e.entity_id);
        if (k.startsWith("health_") && !by[k]) by[k] = e.entity_id;
      } else if (!by[k]) {
        by[k] = e.entity_id;
      }
    }
    this._ents = { sig, by, health };
    return this._ents;
  }
  _id(k) { return this._map().by[k]; }
  _s(k) { const id = this._id(k); return id ? this._hass.states[id] : undefined; }
  _v(k) { const s = this._s(k); return s && !["unknown", "unavailable"].includes(s.state) ? s.state : null; }
  _n(k) { const v = this._v(k); const n = v === null ? NaN : Number(v); return Number.isFinite(n) ? n : null; }
  _on(k) { return this._v(k) === "on"; }
  _name(id) {
    const s = this._hass.states[id];
    let n = s?.attributes?.friendly_name || id;
    const dn = this._devName();
    if (dn && n.startsWith(dn + " ")) n = n.slice(dn.length + 1);
    return n;
  }
  _devName() {
    const d = this._hass.devices?.[this._device()];
    return d?.name_by_user || d?.name || "";
  }

  // ---- state model -----------------------------------------------------------
  _model() {
    const t = this._t;
    const online = this._v("connected") === "on" || (this._id("connected") === undefined && this._v("print_status") !== null);
    const stage = this._v("print_status");
    const machine = this._v("machine_status");
    const active = ACTIVE.has(stage);
    const paused = PAUSED.has(stage);
    const fileState = this._s("filename");
    const file = this._v("filename");
    const fa = fileState?.attributes || {};
    const cl = this._n("current_layer") ?? fa.current_layer ?? 0;
    const tl = this._n("total_layers") ?? fa.total_layers ?? 0;
    const pct = this._n("progress") ?? (tl ? (cl / tl) * 100 : 0);
    const err = this._v("print_error");
    const faults = this._map().health.filter((id) => this._hass.states[id]?.state === "on");
    let kind = "idle";
    if (!online) kind = "offline";
    else if (err && err !== "none") kind = "error";
    else if (paused) kind = "paused";
    else if (active) kind = "run";
    else if (stage === "complete") kind = "done";
    else if (machine && machine !== "idle") kind = "busy";
    let label = !online ? t.offline : t.st[stage] || t.ms[machine] || t.st.idle;
    if (online && machine && machine !== "idle" && machine !== "printing" && !active && !paused) label = t.ms[machine] || label;
    return { t, online, stage, machine, active, paused, file, fa, cl, tl, pct, err, faults, kind, label,
             hasJob: !!file && tl > 0 };
  }

  // ---- rendering -------------------------------------------------------------
  _render() {
    if (!this._hass) return;
    const root = this.shadowRoot;
    if (!root.firstChild) {
      root.innerHTML = `<style>${STYLE}</style><ha-card>
        <div class="hdr"><div class="title" data-title></div><div class="chips" data-chips></div></div>
        <div data-status></div><div data-scene></div><div data-main></div><div class="toast" data-toast></div></ha-card><div data-dlg></div>`;
      root.addEventListener("click", (ev) => this._click(ev));
    }
    const theme = this._cfg.theme;
    if (theme === "dark" || theme === "light") this.setAttribute("data-theme", theme);
    else this.removeAttribute("data-theme");

    const dev = this._device();
    const main = root.querySelector("[data-main]");
    if (!dev) {
      this._set(main, "nodev", `<div class="note">${esc(this._t.no_device)}</div>`);
      root.querySelector("[data-title]").textContent = this._cfg.title || this._t.printer;
      return;
    }
    const m = this._model();
    const dev_ = this._hass.devices?.[dev];
    const title = this._cfg.title || this._devName() || this._t.printer;
    const model = dev_?.model && dev_.model !== title ? dev_.model : "";
    this._set(root.querySelector("[data-title]"), "title", `${esc(title)}${model ? `<small>${esc(model)}</small>` : ""}`);
    this._set(root.querySelector("[data-chips]"), "chips", this._chips(m));
    this._set(root.querySelector("[data-status]"), "status", this._status(m));
    this._scene(m, root.querySelector("[data-scene]"));
    this._set(main, "main", [this._cells(m), this._job(m), this._errBox(m), this._actions(m)].join(""));
    if (this._dlg) this._renderDlg();
  }

  _set(el, key, html) {
    if (this._sig[key] === html) return;
    this._sig[key] = html;
    el.innerHTML = html;
  }

  _color(m) {
    return { run: "var(--sp-a)", paused: "var(--sp-warn)", done: "var(--sp-ok)", error: "var(--sp-err)",
      offline: "var(--sp-err)", busy: "var(--sp-uv)", idle: "var(--sp-muted)" }[m.kind];
  }

  _chips(m) {
    let h = "";
    if (m.faults.length && m.online) {
      h += `<span class="chip err" data-more="${esc(m.faults[0])}"><ha-icon icon="${ICONS.warn}"></ha-icon>${esc(m.faults.length > 1 ? `${m.t.health_bad} · ${m.faults.length}` : this._name(m.faults[0]))}</span>`;
    }
    // the operation itself is shown large in the status strip; the header only flags faults
    return h;
  }

  // ---- printer scene ---------------------------------------------------------
  _health(tk) {
    const id = this._id(tk);
    if (!id || this._cfg.show_health === false) return { id: id || null, bad: false, known: false };
    return { id, bad: this._hass.states[id]?.state === "on", known: true };
  }

  /** One callout: label / value / sub text beside the printer, leader line to the part. */
  _co(c) {
    const left = c.side === "l";
    const x = left ? 4 : 416;
    const anchor = left ? "start" : "end";
    const lx = left ? 112 : 308;
    const ex = left ? 122 : 298;
    const y = c.y;
    const hd = c.health?.known ? `<circle class="hd" cx="${left ? x + 3 : x - 3}" cy="${y - 3.5}" r="3"></circle>` : "";
    const tx = c.health?.known ? (left ? x + 10 : x - 10) : x;
    const ly = y + 10;
    const path = `M${lx} ${ly} L${ex} ${ly} L${c.ax} ${c.ay}`;
    const more = c.more || c.health?.id || "";
    return `<g class="co ${c.health?.bad ? "bad" : ""}" data-more="${esc(more)}" style="--c:${c.color || "var(--sp-a)"}">
      <title>${esc(c.title || c.lb)}</title>
      <rect x="${left ? 0 : 300}" y="${y - 14}" width="120" height="${c.sb ? 46 : 34}" fill="transparent"></rect>
      ${hd}<text class="lb" x="${tx}" y="${y}" text-anchor="${anchor}">${esc(c.lb)}</text>
      <text class="vl" x="${x}" y="${y + 15}" text-anchor="${anchor}">${esc(c.vl)}</text>
      ${c.sb ? `<text class="sb ${c.sbc || ""}" x="${x}" y="${y + 28}" text-anchor="${anchor}">${esc(c.sb)}</text>` : ""}
      <path class="ln" d="${path}"></path><circle class="pin" cx="${c.ax}" cy="${c.ay}" r="2.6"></circle></g>`;
  }

  /** Drawing id: card config, then the integration's printer_profile, then the model name. */
  _profile() {
    const want = this._cfg.printer;
    if (want && want !== "auto") return want;
    const attrs = this._s("machine_status")?.attributes || {};
    if (attrs.printer_profile) return attrs.printer_profile;
    const model = this._hass.devices?.[this._device()]?.model || "";
    for (const [re, id] of MODEL_PROFILES) if (re.test(model)) return id;
    return `generic-${this._kind()}`;
  }

  _kind() {
    const attrs = this._s("machine_status")?.attributes || {};
    if (attrs.printer_kind) return attrs.printer_kind;
    return this._id("nozzle_temp") || this._id("bed_temp") ? "fdm" : "resin";
  }

  /** URL of a drawing module: `drawings:` in the card config, then the bundled files. */
  _drawingFile(id) {
    return (this._cfg.drawings || {})[id] || SCENE_FILES[id] || null;
  }

  _loadScene(id) {
    if (!SCENE_LOADS[id]) {
      SCENE_LOADS[id] = import(sceneUrl(this._drawingFile(id))).catch((err) => {
        console.error(`sdcp-printer-card: cannot load the ${id} drawing`, err);
        SCENE_LOADS[id] = "failed";
      });
    }
    if (SCENE_LOADS[id] !== "failed") Promise.resolve(SCENE_LOADS[id]).then(() => this._render());
  }

  /** Helpers handed to drawings — the stable part of the drawing API. */
  _api(m, sc) {
    const lang = (this._hass?.locale?.language || this._hass?.language || "en").slice(0, 2);
    const own = sc.i18n ? sc.i18n[lang] || sc.i18n.en || {} : {};
    return {
      version: API_VERSION,
      t: { ...m.t, ...own },
      esc, tpl,
      fmt: (v, d = 0) => this._fmt(v, d),
      dur: (min) => this._dur(min),
      when: (date) => this._when(date),
      id: (key) => this._id(key),
      state: (key) => this._s(key),
      value: (key) => this._v(key),
      n: (key) => this._n(key),
      on: (key) => this._on(key),
      health: (key) => this._health(key),
      callout: (c) => this._co(c),
      callouts: (list) => `<g data-part="cos">${list.map((c) => this._co(c)).join("")}</g>`,
      resinCallouts: (g) => this._cosResin(m, g),
      zPx: (span) => this._zPx(m, span),
      color: this._color(m),
    };
  }

  _scene(m, host) {
    let id = this._profile();
    if (!SCENES[id]) {
      if (this._drawingFile(id) && SCENE_LOADS[id] !== "failed") {
        this._loadScene(id);
      } else if (id !== `generic-${this._kind()}`) {
        id = `generic-${this._kind()}`;  // unknown or broken drawing: fall back
        if (!SCENES[id]) this._loadScene(id);
      }
    }
    const sc = SCENES[id];
    if (!sc) {
      if (this._sig.scene !== "ph") { this._sig.scene = "ph"; host.innerHTML = '<div class="scene-ph"></div>'; }
      return;
    }
    if (sc.style && !this.shadowRoot.querySelector(`style[data-scene="${id}"]`)) {
      const st = document.createElement("style");
      st.dataset.scene = id;
      st.textContent = sc.style;
      this.shadowRoot.appendChild(st);
    }
    let html;
    try {
      html = sc.render.call(this, m, this._api(m, sc));
    } catch (err) {
      console.error(`sdcp-printer-card: the ${id} drawing failed`, err);
      return;
    }
    if (this._sig.scene === html) return;
    this._sig.scene = html;
    // keep the SVG node so CSS transitions (plate travel) animate between updates
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const next = tmp.firstElementChild;
    const cur = host.firstElementChild;
    if (!cur || !next || cur.dataset.kind !== next.dataset.kind) { host.innerHTML = html; return; }
    cur.setAttribute("class", next.getAttribute("class"));
    for (const part of ["dyn", "cos"]) {
      const a = cur.querySelector(`[data-part="${part}"]`);
      const b = next.querySelector(`[data-part="${part}"]`);
      if (a && b) a.replaceWith(b);
    }
    const car = cur.querySelector("[data-carriage]");
    const ncar = next.querySelector("[data-carriage]");
    if (car && ncar) {
      car.setAttribute("style", ncar.getAttribute("style"));
      car.innerHTML = ncar.innerHTML;
    }
  }

  _zPx(m, span) {
    const fa = m.fa;
    let z = Number(fa.z_height);
    if (!Number.isFinite(z) && fa.layer_height) z = fa.layer_height * m.cl;
    if (Number.isFinite(z) && z > 0) return Math.max(2, Math.min(span, (z / 220) * span * 1.6));
    return m.hasJob ? Math.max(2, (m.pct / 100) * span * 0.6) : 0;
  }



  /** Callouts of a resin printer; a drawing may move the anchor points with g.anchors. */
  _cosResin(m, g) {
    const t = m.t;
    const fa = m.fa;
    const A = { vat: [141, 181], film: [150, 198.6], uv: [134, 226], tilt: [279, 188.5], lcd: [262, 202], zm: [300, 196], ...(g.anchors || {}) };
    const cos = [];
    // left: plate (load cell), vat, release film, UV LED
    const z = Number(fa.z_height);
    const mhgt = Number(fa.model_height);
    cos.push({ side: "l", y: 40, lb: t.plate, title: `${t.plate} · ${t.strain}`,
      vl: Number.isFinite(z) && m.hasJob ? `Z ${this._fmt(z, 1)} ${t.mm}` : m.online ? t.parked : "—",
      sb: Number.isFinite(mhgt) && m.hasJob ? tpl(t.of, { v: `${this._fmt(mhgt, 1)} ${t.mm}` }) : "",
      ax: 160, ay: g.plateY - 3.5, health: this._health("health_strain_gauge"), more: this._id("filename") });
    if (this._id("vat_temp")) {
      const v = this._n("vat_temp");
      const tg = this._n("vat_target_temp");
      cos.push({ side: "l", y: 112, lb: t.vat, vl: `${this._fmt(v, v !== null && v % 1 ? 1 : 0)} °C`,
        sb: g.heating && tg ? `${t.heating} → ${this._fmt(tg)} °C` : tg ? tpl(t.target, { t: `${this._fmt(tg)} °C` }) : "",
        sbc: g.heating ? "hot" : "", ax: A.vat[0], ay: A.vat[1], color: g.heating ? "var(--sp-heat)" : undefined,
        health: this._health("health_tank"), more: this._id("vat_temp") });
    }
    if (this._id("release_film")) {
      const f = this._n("release_film");
      const max = Number(this._s("release_film")?.attributes?.max) || null;
      const pct = max && f !== null ? (f / max) * 100 : null;
      cos.push({ side: "l", y: 174, lb: t.film, vl: this._fmt(f),
        sb: pct !== null ? tpl(t.wear, { p: this._fmt(pct) }) : t.cycles,
        sbc: pct !== null && pct >= 80 ? "hot" : "", ax: A.film[0], ay: A.film[1],
        health: this._health("health_release_film"), more: this._id("release_film") });
    }
    if (this._id("uv_led_temp")) {
      cos.push({ side: "l", y: 236, lb: t.uv, vl: `${this._fmt(this._n("uv_led_temp"), 1)} °C`,
        sb: g.exposing ? t.uv_on : t.uv_off, sbc: g.exposing ? "on" : "", ax: A.uv[0], ay: A.uv[1],
        color: "var(--sp-uv)", health: this._health("health_uv_sensor"), more: this._id("uv_led_temp") });
    }
    // right: layer / model, vat tilt, LCD, Z motor
    if (m.hasJob) {
      const ly = fa.layer_height ? `${this._fmt(fa.layer_height, 3).replace(/0$/, "")} ${t.mm}` : "";
      const ex = fa.exposure_time ? `${this._fmt(fa.exposure_time, 1)} ${t.s}` : "";
      cos.push({ side: "r", y: 40, lb: t.layer, vl: `${this._fmt(m.cl)} / ${this._fmt(m.tl)}`,
        sb: [ly, ex].filter(Boolean).join(" · "), ax: g.mh > 4 ? 232 : 254, ay: g.mh > 4 ? g.plateY + Math.min(g.mh * 0.5, 40) : g.plateY - 3.5,
        color: "var(--sp-resin)", more: this._id("current_layer") });
    }
    const tilt = this._health("health_tilt_motor");
    if (tilt.known) {
      cos.push({ side: "r", y: 112, lb: t.tilt, vl: tilt.bad ? t.fault : m.stage === "lifting" ? t.peel : t.ok,
        ax: A.tilt[0], ay: A.tilt[1], health: tilt });
    }
    if (this._id("lcd_usage") || this._health("health_lcd").known) {
      const h = this._n("lcd_usage");
      cos.push({ side: "r", y: 174, lb: t.lcd, vl: h !== null ? `${this._fmt(h, h < 100 ? 1 : 0)} ${t.h}` : "—",
        sb: g.exposing ? t.uv_on : t.lcd_hours, sbc: g.exposing ? "on" : "", ax: A.lcd[0], ay: A.lcd[1],
        color: "var(--sp-uv)", health: this._health("health_lcd"), more: this._id("lcd_usage") });
    }
    const zm = this._health("health_z_motor");
    const mv = !m.online ? "—" : m.stage === "lifting" ? `↑ ${t.up}` : m.stage === "dropping" ? `↓ ${t.down}` : m.stage === "homing" ? t.st.homing : m.active ? t.hold : t.idle_m;
    cos.push({ side: "r", y: 236, lb: t.z_motor, vl: zm.bad ? t.fault : mv,
      sb: m.active && m.cl > 0 && this._n("print_elapsed") ? tpl(t.per_layer, { s: this._fmt((this._n("print_elapsed") * 60) / m.cl, 1) }) : "",
      ax: A.zm[0], ay: A.zm[1], health: zm, more: this._id("print_status") });
    return `<g data-part="cos">${cos.map((c) => this._co(c)).join("")}</g>`;
  }


  // ---- status strip (above the printer) and time cells (below) ---------------
  _status(m) {
    const t = m.t;
    if (!m.online) {
      const lc = this._s("connected")?.last_changed;
      return `<div class="stat" style="--c:var(--sp-err)"><div class="op"><span class="opn"><span class="dot"></span>${esc(t.offline)}</span>
        <span class="ops">${lc ? esc(tpl(t.lost, { t: this._when(new Date(lc)) })) : ""}</span></div></div>`;
    }
    const c = this._color(m);
    const opName = t.st[m.stage] || m.label;
    if (!m.hasJob) {
      const fs = this._n("free_storage");
      const unit = this._s("free_storage")?.attributes?.unit_of_measurement || "";
      return `<div class="stat" style="--c:${c}"><div class="op" data-more="${esc(this._id("print_status") || "")}">
        <span class="opn"><span class="dot"></span>${esc(m.kind === "busy" ? m.label : opName)}</span>
        <span class="ops">${esc(m.kind === "busy" ? "" : t.ready)}${fs !== null ? ` · ${esc(tpl(t.free, { v: `${this._fmt(fs, 2)} ${unit}` }))}` : ""}</span></div></div>`;
    }
    const pct = Math.max(0, Math.min(100, m.pct));
    const running = m.active || m.paused;
    const rem = this._n("print_remaining");
    const right = running
      ? `<div class="rem" data-more="${esc(this._id("print_remaining") || "")}"><span class="k">${esc(t.remaining)}</span><span class="v">${esc(this._dur(rem))}</span></div>`
      : `<div class="rem" data-more="${esc(this._id("print_elapsed") || "")}"><span class="k">${esc(t.finished)}</span><span class="v">${esc(this._dur(this._n("print_elapsed")))}</span></div>`;
    return `<div class="stat" style="--c:${c}">
      <div class="pct" data-more="${esc(this._id("progress") || "")}">${this._fmt(Math.floor(pct * 10) / 10, pct >= 99.95 ? 0 : 1)}<small>%</small></div>
      <div class="op" data-more="${esc(this._id("print_status") || "")}"><span class="opn"><span class="dot ${m.kind === "run" ? "run" : ""}"></span>${esc(opName)}</span>
        <span class="ops">${esc(tpl(t.layer_of, { c: this._fmt(m.cl), t: this._fmt(m.tl) }))}</span></div>
      ${right}</div>
      <div class="bar" style="--c:${c}" data-more="${esc(this._id("progress") || "")}"><div style="width:${pct.toFixed(2)}%"></div></div>`;
  }

  _cells(m) {
    const t = m.t;
    if (!m.online || !m.hasJob) return "";
    const cells = [];
    const el = this._n("print_elapsed");
    if (m.active || m.paused) {
      const fin = this._v("print_finish");
      cells.push(["print_elapsed", ICONS.time, t.elapsed, this._dur(el)]);
      cells.push(["print_finish", ICONS.flag, t.finish, fin ? this._when(new Date(fin)) : "—"]);
      cells.push(["print_elapsed", ICONS.play, t.started, el !== null ? this._when(new Date(Date.now() - el * 60000)) : "—"]);
    } else {
      const last = this._s("print_status")?.last_changed;
      cells.push(["print_status", ICONS.flag, t.ended, last ? this._when(new Date(last)) : "—"]);
      cells.push(["total_layers", ICONS.layers, t.layers_t, this._fmt(m.tl)]);
    }
    return `<div class="cells" style="grid-template-columns:repeat(${cells.length},1fr)">${cells.map(([k, ic, l, v]) => `<div class="cell" data-more="${esc(this._id(k) || "")}"><div class="k"><ha-icon icon="${ic}"></ha-icon>${esc(l)}</div><div class="v">${esc(v)}</div></div>`).join("")}</div>`;
  }

  _job(m) {
    if (!m.file || !m.online) return "";
    const t = m.t;
    const fa = m.fa;
    const pic = this._s("thumbnail");
    const picUrl = pic && pic.state !== "unavailable" ? pic.attributes?.entity_picture : null;
    const name = String(m.file).replace(/\.(ctb|goo|prz|cbddlp|pwmx|jxs|gcode|3mf)$/i, "");
    const meta = [];
    if (fa.resin_volume) meta.push(`<span><b>${this._fmt(fa.resin_volume, 1)}</b> ${t.ml}</span>`);
    if (fa.resin_weight) meta.push(`<span><b>${this._fmt(fa.resin_weight, 1)}</b> ${t.g}</span>`);
    if (fa.bottom_layers) meta.push(`<span>${esc(tpl(t.bottom, { n: fa.bottom_layers, s: this._fmt(fa.bottom_exposure_time || 0, 0) }))}</span>`);
    if (fa.model_height) meta.push(`<span>${esc(t.height)} <b>${this._fmt(fa.model_height, 1)}</b> ${t.mm}</span>`);
    return `<div class="job" data-more="${esc(this._id("filename") || "")}">
      <div class="thumb">${picUrl ? `<img src="${esc(picUrl)}" alt="">` : `<ha-icon icon="${ICONS.file}"></ha-icon>`}</div>
      <div class="nm"><div class="fn" title="${esc(m.file)}">${esc(name)}</div><div class="meta">${meta.join("")}</div></div></div>`;
  }

  _errBox(m) {
    if (!m.err || m.err === "none" || !m.online) return "";
    return `<div class="err-box" data-more="${esc(this._id("print_error") || "")}"><ha-icon icon="${ICONS.err}"></ha-icon>
      ${esc(m.t.error)}: ${esc(m.t.e[m.err] || m.err)}</div>`;
  }

  _actions(m) {
    const t = m.t;
    const b = [];
    if (this._cfg.show_controls && m.online) {
      if (m.paused && this._id("resume")) b.push(`<button class="btn pri" data-act="press" data-k="resume"><ha-icon icon="${ICONS.play}"></ha-icon>${esc(t.resume)}</button>`);
      else if (m.active && this._id("pause")) b.push(`<button class="btn" data-act="press" data-k="pause"><ha-icon icon="${ICONS.pause}"></ha-icon>${esc(t.pause)}</button>`);
      if ((m.active || m.paused) && this._id("stop")) {
        const armed = this._armed > Date.now();
        b.push(`<button class="btn danger ${armed ? "armed" : ""}" data-act="stop"><ha-icon icon="${ICONS.stop}"></ha-icon>${esc(armed ? t.stop_confirm : t.stop)}</button>`);
      }
    }
    const compact = b.length > 0;
    const sec = (act, icon, label) => `<button class="btn ${compact ? "ico" : ""}" data-act="${act}" title="${esc(label)}" aria-label="${esc(label)}"><ha-icon icon="${icon}"></ha-icon>${compact ? "" : esc(label)}</button>`;
    if (this._cfg.show_files && m.online) b.push(sec("files", ICONS.files, t.files));
    const cam = this._s("camera");
    if (this._cfg.show_camera && cam && cam.state !== "unavailable") b.push(sec("camera", ICONS.camera, t.camera));
    return b.length ? `<div class="actions">${b.join("")}</div>` : "";
  }

  // ---- interaction ---------------------------------------------------------
  _click(ev) {
    let el = null;
    for (const n of ev.composedPath()) {
      if (!n || n.nodeType !== 1 || !n.dataset) continue;
      if (n.dataset.act || n.dataset.more !== undefined) { el = n; break; }
      if (n.dataset.stop !== undefined) return; // click inside a dialog, not on an action
    }
    if (!el) return;
    const act = el.dataset.act;
    if (!act) {
      if (el.dataset.more) this._moreInfo(el.dataset.more);
      return;
    }
    ev.stopPropagation();
    switch (act) {
      case "press": this._press(el.dataset.k); break;
      case "stop":
        if (this._armed > Date.now()) { this._armed = 0; this._press("stop"); }
        else { this._armed = Date.now() + 4000; setTimeout(() => this._render(), 4100); }
        this._render();
        break;
      case "files": this._openFiles("/"); break;
      case "camera": this._dlg = { kind: "camera" }; this._renderDlg(); break;
      case "close": this._dlg = null; this._renderDlg(); break;
      case "dir": this._openFiles(el.dataset.path); break;
      case "up": this._openFiles(this._parent(this._dlg.path)); break;
      case "ask": this._dlg.ask = { path: el.dataset.path, op: el.dataset.op }; this._renderDlg(); break;
      case "no": this._dlg.ask = null; this._renderDlg(); break;
      case "yes": this._fileOp(); break;
      default: break;
    }
  }

  _moreInfo(entityId) {
    const e = new Event("hass-more-info", { bubbles: true, composed: true });
    e.detail = { entityId };
    this.dispatchEvent(e);
  }

  async _press(k) {
    const id = this._id(k);
    if (!id) return;
    try {
      await this._hass.callService("button", "press", { entity_id: id });
      this._toast(this._t.sent);
    } catch (err) {
      this._toast(tpl(this._t.failed, { e: err?.message || err }));
    }
  }

  _toast(msg) {
    const el = this.shadowRoot.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.remove("show"), 3000);
  }

  // ---- files ---------------------------------------------------------------
  _parent(p) {
    const parts = String(p || "/").replace(/\/+$/, "").split("/").filter(Boolean);
    parts.pop();
    return parts.length ? `/${parts.join("/")}` : "/";
  }

  async _openFiles(path) {
    const prev = this._dlg?.kind === "files" ? this._dlg : null;
    this._dlg = { kind: "files", path, items: null, error: null, storages: prev?.storages || null, ask: null };
    this._renderDlg();
    try {
      const res = await this._hass.callWS({ type: `${DOMAIN}/files`, device_id: this._device(), path });
      if (this._dlg?.path !== path) return;
      let items = res.items || [];
      if (path === "/") {
        this._dlg.storages = items.filter((i) => i.dir);
        if (items.length === 1 && items[0].dir) return this._openFiles(items[0].path);
      }
      items = items.sort((a, b) => (b.dir - a.dir) || String(a.path).localeCompare(String(b.path)));
      this._dlg.items = items;
    } catch (err) {
      if (this._dlg?.path === path) this._dlg.error = err?.message || String(err);
    }
    this._renderDlg();
  }

  async _fileOp() {
    const { path, op } = this._dlg.ask || {};
    if (!path) return;
    const t = this._t;
    this._dlg.ask = null;
    try {
      if (op === "print") {
        await this._hass.callService(DOMAIN, "start_print", { device_id: this._device(), filename: path.split("/").pop() });
        this._dlg = null;
        this._renderDlg();
        this._toast(t.started_ok);
        return;
      }
      await this._hass.callService(DOMAIN, "delete_files", { device_id: this._device(), files: [path] });
      this._toast(t.deleted);
      this._openFiles(this._dlg.path);
    } catch (err) {
      this._toast(tpl(t.failed, { e: err?.message || err }));
      this._renderDlg();
    }
  }

  _renderDlg() {
    const host = this.shadowRoot.querySelector("[data-dlg]");
    if (!host) return;
    const d = this._dlg;
    if (!d) { host.innerHTML = ""; this._sig.dlg = null; return; }
    const t = this._t;
    if (d.kind === "camera") {
      const cam = this._s("camera");
      if (this._sig.dlg !== "camera") {
        this._sig.dlg = "camera";
        host.innerHTML = `<div class="backdrop" data-act="close"><div class="dlg" data-stop>
          <header><div class="t">${esc(t.camera)}<small>${esc(this._devName())}</small></div>
          <button class="ib" data-act="close" title="${esc(t.close)}"><ha-icon icon="${ICONS.close}"></ha-icon></button></header>
          <div class="body"><div class="cam" data-cam></div></div></div></div>`;
        const box = host.querySelector("[data-cam]");
        if (cam && customElements.get("ha-camera-stream")) {
          const s = document.createElement("ha-camera-stream");
          s.hass = this._hass; s.stateObj = cam; s.muted = true; s.controls = true; s.allowExoPlayer = true;
          box.appendChild(s);
        } else {
          box.innerHTML = `<div class="note">${esc(t.no_camera)}</div>`;
        }
      } else {
        const s = host.querySelector("ha-camera-stream");
        if (s) { s.hass = this._hass; s.stateObj = this._s("camera"); }
      }
      return;
    }
    // files
    const m = this._model();
    const busy = m.active || m.paused || (m.machine && m.machine !== "idle");
    let body;
    if (d.error) body = `<div class="note">${esc(tpl(t.failed, { e: d.error }))}</div>`;
    else if (!d.items) body = `<div class="note">${esc(t.loading)}</div>`;
    else if (!d.items.length) body = `<div class="note">${esc(t.empty)}</div>`;
    else {
      body = `<div class="fl">${d.items.map((i) => {
        const nm = String(i.path).split("/").filter(Boolean).pop() || i.path;
        if (i.dir) {
          const sub = i.total ? tpl(t.used, { u: this._bytes(i.used), t: this._bytes(i.total) }) : "";
          const icon = /usb/i.test(i.path) ? ICONS.usb : d.path === "/" ? ICONS.sd : ICONS.folder;
          return `<div class="fr dir" data-act="dir" data-path="${esc(i.path)}"><ha-icon icon="${icon}"></ha-icon>
            <div class="n">${esc(nm)}${sub ? `<small>${esc(sub)}</small>` : ""}</div></div>`;
        }
        const ask = d.ask && d.ask.path === i.path;
        const right = ask
          ? `<span class="q">${esc(d.ask.op === "print" ? t.print_q : t.delete_q)}</span>
             <button class="yes ${d.ask.op === "delete" ? "del" : ""}" data-act="yes">${esc(t.yes)}</button>
             <button class="no" data-act="no">${esc(t.no)}</button>`
          : `<button class="ib go" data-act="ask" data-op="print" data-path="${esc(i.path)}" title="${esc(busy ? t.busy : t.print)}" ${busy ? "disabled" : ""}><ha-icon icon="${ICONS.play}"></ha-icon></button>
             <button class="ib del" data-act="ask" data-op="delete" data-path="${esc(i.path)}" title="${esc(t.delete)}" ${busy && m.file && i.path.endsWith("/" + m.file) ? "disabled" : ""}><ha-icon icon="${ICONS.del}"></ha-icon></button>`;
        const sz = i.size ? `<small>${esc(this._bytes(i.size))}</small>` : "";
        return `<div class="fr"><ha-icon icon="${ICONS.file}"></ha-icon><div class="n" title="${esc(i.path)}">${esc(nm)}${sz}</div>${right}</div>`;
      }).join("")}</div>`;
    }
    const st = (d.storages || []).find((s) => d.path.startsWith(s.path) && s.total);
    const store = st ? `<div class="store wr"><div class="wr-h"><span>${esc(st.path)}</span><span>${esc(tpl(t.used, { u: this._bytes(st.used), t: this._bytes(st.total) }))}</span></div>
      <div class="wr-bar"><div style="width:${((st.used / st.total) * 100).toFixed(1)}%"></div></div></div>` : "";
    const canUp = d.path !== "/" && !(d.storages?.length === 1 && d.path === d.storages[0].path);
    const html = `<div class="backdrop" data-act="close"><div class="dlg" data-stop>
      <header>${canUp ? `<button class="ib" data-act="up" title="${esc(t.back)}"><ha-icon icon="${ICONS.up}"></ha-icon></button>` : ""}
      <div class="t">${esc(t.files)}<small>${esc(d.path)}</small></div>
      <button class="ib" data-act="close" title="${esc(t.close)}"><ha-icon icon="${ICONS.close}"></ha-icon></button></header>
      <div class="body">${store}${body}</div></div></div>`;
    if (this._sig.dlg !== html) {
      this._sig.dlg = html;
      const scroll = host.querySelector(".body")?.scrollTop || 0;
      host.innerHTML = html;
      const b = host.querySelector(".body");
      if (b) b.scrollTop = scroll;
    }
  }

}

const EDITOR_LABELS = {
  en: { device: "Device", title: "Title", theme: "Theme", printer: "Printer drawing", show_controls: "Print controls",
        show_files: "File browser", show_camera: "Camera button", show_health: "Self-test dots on the parts" },
  ru: { device: "Устройство", title: "Заголовок", theme: "Тема", printer: "Рисунок принтера", show_controls: "Управление печатью",
        show_files: "Файлы", show_camera: "Кнопка камеры", show_health: "Самодиагностика на узлах" },
  uk: { device: "Пристрій", title: "Заголовок", theme: "Тема", printer: "Малюнок принтера", show_controls: "Керування друком",
        show_files: "Файли", show_camera: "Кнопка камери", show_health: "Самодіагностика на вузлах" },
  fr: { device: "Appareil", title: "Titre", theme: "Thème", printer: "Dessin de l'imprimante", show_controls: "Commandes d'impression",
        show_files: "Fichiers", show_camera: "Bouton caméra", show_health: "Autotest sur les pièces" },
  de: { device: "Gerät", title: "Titel", theme: "Design", printer: "Druckerzeichnung", show_controls: "Drucksteuerung",
        show_files: "Dateien", show_camera: "Kamera-Taste", show_health: "Selbsttest an den Bauteilen" },
  es: { device: "Dispositivo", title: "Título", theme: "Tema", printer: "Dibujo de la impresora", show_controls: "Control de impresión",
        show_files: "Archivos", show_camera: "Botón de cámara", show_health: "Autodiagnóstico en las piezas" },
};

// ---- visual editor ----------------------------------------------------------
class SDCPPrinterCardEditor extends HTMLElement {
  setConfig(config) { this._cfg = config; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    if (!this._hass || !this._cfg) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => {
        const l = (this._hass?.locale?.language || this._hass?.language || "en").slice(0, 2);
        return (EDITOR_LABELS[l] || EDITOR_LABELS.en)[s.name] || EDITOR_LABELS.en[s.name] || s.name;
      };
      this._form.addEventListener("value-changed", (ev) => {
        const e = new Event("config-changed", { bubbles: true, composed: true });
        e.detail = { config: ev.detail.value };
        this.dispatchEvent(e);
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = { theme: "auto", show_controls: true, show_files: true, show_camera: true, show_health: true, printer: "auto", ...this._cfg };
    this._form.schema = [
      { name: "device", selector: { device: { integration: DOMAIN } } },
      { name: "title", selector: { text: {} } },
      { name: "theme", selector: { select: { mode: "dropdown", options: ["auto", "light", "dark"] } } },
      { name: "printer", selector: { select: { mode: "dropdown", custom_value: true,
        options: [...new Set(["auto", ...Object.keys(SCENE_FILES), ...Object.keys(SCENES)])] } } },
      { type: "grid", name: "", schema: [
        { name: "show_controls", selector: { boolean: {} } },
        { name: "show_files", selector: { boolean: {} } },
        { name: "show_camera", selector: { boolean: {} } },
        { name: "show_health", selector: { boolean: {} } },
      ] },
    ];
  }
}

if (!customElements.get("sdcp-printer-card-editor")) customElements.define("sdcp-printer-card-editor", SDCPPrinterCardEditor);
if (!customElements.get("sdcp-printer-card")) {
  customElements.define("sdcp-printer-card", SDCPPrinterCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "sdcp-printer-card",
    name: "SDCP 3D Printer",
    description: "Resin / FDM printer on the SDCP protocol: progress ring, job, temperatures, consumables, files and camera.",
    preview: true,
  });
  console.info(`%c SDCP-PRINTER-CARD %c ${CARD_VERSION} `, "background:#4f86e8;color:#fff;font-weight:600", "");
}
