/* ===========================
   UTENTE / SESSIONE
=========================== */
const userId = localStorage.getItem("userId") || "";
const role = (localStorage.getItem("role") || "").toLowerCase();
const comitato = localStorage.getItem("comitato") || "";
const cfUtente = ((localStorage.getItem("cf") || localStorage.getItem("userId") || "") + "").toUpperCase();

if (!userId) {
  alert("Devi effettuare il login");
  window.location.href = "login.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
document.getElementById("logout").addEventListener("click", logout);

function normalize(s){ return (s || "").toLowerCase().trim(); }

/* ===========================
   LOGO + MENU (IDENTICI A index.html)
=========================== */
const logoImg = document.getElementById("logo-cri");
let logoSrc = "logo.svg";

if (role === "sol") {
  const c = normalize(comitato);
  const map = {
    "pesaro": "logo-pesaro.svg",
    "urbino": "logo-urbino.svg",
    "fano": "logo-fano.svg",
    "pergola": "logo-pergola.svg",
    "marotta-mondolfo": "logo-marotta-mondolfo.svg",
    "fossombrone": "logo-fossombrone.svg",
    "cagli": "logo-cagli.svg",
    "montelabbate": "logo-montelabbate.svg",
    "fermignano": "logo-fermignano.svg",
    "sant'angelo in vado": "logo-santangeloinvado.svg",
    "santangelo in vado": "logo-santangeloinvado.svg",
    "sant-angelo-in-vado": "logo-santangeloinvado.svg"
  };
  logoSrc = map[c] || "logo-sop.svg";
} else if (role === "sop" || role === "amministratore" || role === "tlc_provinciale") {
  logoSrc = "logo-sop.svg";
}
logoImg.src = logoSrc;
logoImg.onerror = () => { logoImg.src = "logo-sop.svg"; };

const menu = document.getElementById("menu-sidebar");
menu.innerHTML = "";

const items = [
  { text: "🏠 Home", href: "index.html" },
  { text: "✅ Approvazioni", href: "iscrizioni-in-attesa.html" },
  { text: "👥 Volontari", href: "volontari.html" },
  { text: "🚗 Mezzi", href: "mezzi.html" },
  { text: "📦 Materiali", href: "materiali.html" },
  { text: "🚨 Emergenze", href: "emergenze.html" },
  { text: "📅 Eventi", href: "eventi.html" },
  { text: "📄 Documenti", href: "documenti.html" }
];

if (["sop", "sol", "amministratore", "tlc_provinciale"].includes(role)) {
  items.push({ text: "📡 TLC", href: "tlc.html" });
}
if (["sop", "sol", "amministratore"].includes(role)) {
  items.push({ text: "⚙️ Admin", href: "admin.html" });
}

items.forEach(({ text, href }) => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  if (href === "eventi.html") a.classList.add("active");
  li.appendChild(a);
  menu.appendChild(li);
});

/* ===========================
   DOM
=========================== */
const formContainer = document.getElementById("form-container");
const form = document.getElementById("eventi-form");
const list = document.getElementById("eventi-list");
const searchInput = document.getElementById("search");
const btnApriForm = document.getElementById("btn-apri-form");
const btnChiudiForm = document.getElementById("btn-chiudi-form");
const submitBtn = document.getElementById("submit-btn");
const infoPopup = document.getElementById("info-popup");
const infoContent = document.getElementById("info-content");
const infoClose = document.getElementById("info-close");

const inputQualificheRichieste = document.getElementById("qualificheRichieste");
const inputQualificheData = document.getElementById("qualificheRichiesteData");
const inputPatentiData = document.getElementById("patentiRichiesteData");
const btnPickRequisiti = document.getElementById("btn-pick-requisiti");

const reqPopup = document.getElementById("req-popup");
const reqCloseX = document.getElementById("req-close-x");
const reqCancel = document.getElementById("req-cancel");
const reqSave = document.getElementById("req-save");
const reqQualificheWrap = document.getElementById("req-qualifiche");
const reqPatentiWrap = document.getElementById("req-patenti");

let editIndex = null;
let lastFocusedElement = null;
let currentInfoEventId = null;
let reqLastFocused = null;
let reqSnapshot = { qualifiche: [], patenti: [] };

/* ===========================
   OPTIONS
=========================== */
const QUALIFICHE_OPTIONS = [
  "OPEM",
  "CSA",
  "OPSA",
  "TLC 1",
  "TLC 2",
  "UC-OC",
  "ASP-C",
  "CAE",
  "CSP-A",
  "CSP-D",
  "SMTS",
  "AUTISTA SOCCORRITORE",
  "SOCCORRITORE",
  "TS",
  "OSG",
  "LOGISTA",
  "OPERATORE UAS (A1/A3-A2-STS)",
  "HACCP",
  "OPSOCEM",
  "MEDIATORE LINGUISTICO"
];

const PATENTI_OPTIONS = [
  "PATENTE 1","PATENTE 2","PATENTE 2B","PATENTE 3","PATENTE 4","PATENTE 5","PATENTE 5B",
  "PATENTE 6","PATENTE 7","PATENTE 7B","PATENTE 8","PATENTE 9","NESSUNA"
];

/* ===========================
   ACCESSIBILITÀ MODALI
=========================== */
function getFocusableElements(container) {
  return container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
  );
}

function trapFocus(container, event) {
  const focusable = getFocusableElements(container);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.key === "Tab") {
    if (event.shiftKey) {
      if (document.activeElement === first) { last.focus(); event.preventDefault(); }
    } else {
      if (document.activeElement === last) { first.focus(); event.preventDefault(); }
    }
  }
}

function openDialog(container, firstFocusElement) {
  lastFocusedElement = document.activeElement;
  container.classList.add("active");
  container.setAttribute("aria-hidden", "false");

  if (firstFocusElement) firstFocusElement.focus();
  else {
    const focusable = getFocusableElements(container);
    if (focusable.length) focusable[0].focus();
  }

  document.addEventListener("keydown", dialogKeydownHandler);
}

function closeDialog(container) {
  container.classList.remove("active");
  container.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", dialogKeydownHandler);

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function dialogKeydownHandler(e) {
  if (formContainer.classList.contains("active")) {
    trapFocus(formContainer, e);
    if (e.key === "Escape") toggleForm(false);
  }
  if (infoPopup.classList.contains("active")) {
    trapFocus(infoPopup, e);
    if (e.key === "Escape") hideInfoPopup();
  }
  if (reqPopup.classList.contains("active")) {
    trapFocus(reqPopup, e);
    if (e.key === "Escape") closeRequisitiPopup(true);
  }
}

/* ===========================
   STORAGE
=========================== */
function getEventi() { return JSON.parse(localStorage.getItem("eventi") || "[]"); }
function setEventi(eventi) { localStorage.setItem("eventi", JSON.stringify(eventi)); }
function getVolontari() { return JSON.parse(localStorage.getItem("volontari") || "[]"); }

function getVolontarioByCf(cf) {
  const volontari = getVolontari();
  const cfu = (cf || "").toUpperCase();
  return volontari.find(v => (v.cf || "").toUpperCase() === cfu) || null;
}

/* ===========================
   DATE / CHIUSURA EVENTI
=========================== */
function startOfToday() {
  const t = new Date();
  t.setHours(0,0,0,0);
  return t;
}

function getEventoEndDate(ev) {
  const d = ev.dataFine || ev.dataInizio;
  if (!d) return null;
  const dt = new Date(d);
  dt.setHours(0,0,0,0);
  return dt;
}

function isEventoChiuso(ev) {
  const end = getEventoEndDate(ev);
  if (!end) return false;
  return end < startOfToday();
}

/* ===========================
   FORMAT / ESCAPE
=========================== */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) return parts[2] + "/" + parts[1] + "/" + parts[0];
  return dateStr;
}

function escapeHtml(text) {
  if (!text) return "";
  return (text + "").replace(/[&<>"']/g, match => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[match]));
}

/* ===========================
   REQUISITI POPUP
=========================== */
function buildRequisitiUI() {
  reqQualificheWrap.innerHTML = QUALIFICHE_OPTIONS.map((q, i) => {
    const id = `rq-q-${i}`;
    const label = q;
    return `
      <label for="${id}">
        <input type="checkbox" id="${id}" class="rq-qualifica" value="${escapeHtml(q)}">
        ${escapeHtml(label)}
      </label>
    `;
  }).join("");

  reqPatentiWrap.innerHTML = PATENTI_OPTIONS.map((p, i) => {
    const id = `rq-p-${i}`;
    return `
      <label for="${id}">
        <input type="checkbox" id="${id}" class="rq-patente" value="${escapeHtml(p)}">
        ${escapeHtml(p)}
      </label>
    `;
  }).join("");

  if (window.App && App.qualifiche && App.qualifiche.attachTooltips){
    App.qualifiche.attachTooltips({ labelsSelector: '#req-qualifiche label', inputSelector: 'input.rq-qualifica' });
  }
}

function readCsvHidden(inputEl) {
  return (inputEl.value || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function writeCsvHidden(inputEl, arr) {
  inputEl.value = (arr || []).join(", ");
}

function setChecksFromArray(selector, values) {
  const set = new Set((values || []).map(v => (v || "").trim()));
  document.querySelectorAll(selector).forEach(cb => { cb.checked = set.has(cb.value); });
}

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter(cb => cb.checked)
    .map(cb => cb.value);
}

function formatRequisitiString(qualifiche, patenti) {
  const qStr = (qualifiche && qualifiche.length) ? qualifiche.join(", ") : "Nessuna";
  const pStr = (patenti && patenti.length) ? patenti.join(", ") : "Nessuna";
  return `Qualifiche: ${qStr} | Patenti: ${pStr}`;
}

function openRequisitiPopup() {
  reqLastFocused = document.activeElement;
  reqSnapshot = {
    qualifiche: readCsvHidden(inputQualificheData),
    patenti: readCsvHidden(inputPatentiData)
  };

  setChecksFromArray(".rq-qualifica", reqSnapshot.qualifiche);
  setChecksFromArray(".rq-patente", reqSnapshot.patenti);

  reqPopup.classList.add("active");
  reqPopup.setAttribute("aria-hidden", "false");
  const focusable = getFocusableElements(reqPopup);
  if (focusable.length) focusable[0].focus();
}

function closeRequisitiPopup(restoreSnapshot) {
  if (restoreSnapshot) {
    writeCsvHidden(inputQualificheData, reqSnapshot.qualifiche);
    writeCsvHidden(inputPatentiData, reqSnapshot.patenti);
    inputQualificheRichieste.value = formatRequisitiString(reqSnapshot.qualifiche, reqSnapshot.patenti);
  }

  reqPopup.classList.remove("active");
  reqPopup.setAttribute("aria-hidden", "true");

  if (reqLastFocused && typeof reqLastFocused.focus === "function") reqLastFocused.focus();
}

btnPickRequisiti.addEventListener("click", openRequisitiPopup);
inputQualificheRichieste.addEventListener("click", openRequisitiPopup);

reqCloseX.addEventListener("click", () => closeRequisitiPopup(true));
reqCancel.addEventListener("click", () => closeRequisitiPopup(true));
reqPopup.addEventListener("click", (e) => { if (e.target === reqPopup) closeRequisitiPopup(true); });

reqSave.addEventListener("click", () => {
  let qualificheSel = getCheckedValues(".rq-qualifica");
  let patentiSel = getCheckedValues(".rq-patente");

  if (patentiSel.includes("NESSUNA") && patentiSel.length > 1) {
    patentiSel = patentiSel.filter(x => x !== "NESSUNA");
  }

  writeCsvHidden(inputQualificheData, qualificheSel);
  writeCsvHidden(inputPatentiData, patentiSel);

  inputQualificheRichieste.value = formatRequisitiString(qualificheSel, patentiSel);

  closeRequisitiPopup(false);
});

/* ===========================
   ISCRIZIONI
=========================== */
function normalizeIscrizioniForEvento(ev) {
  let changed = false;

  if (!Array.isArray(ev.iscrizioni)) { ev.iscrizioni = []; changed = true; }

  if (ev.iscrizioni.length && typeof ev.iscrizioni[0] === "string") {
    const old = ev.iscrizioni.slice();
    ev.iscrizioni = old.map(cf => {
      const v = getVolontarioByCf(cf);
      return {
        cf: (cf || "").toUpperCase(),
        comitato: normalize(v?.comitato || ""),
        stato: "approved",
        dataRichiesta: null,
        dataDecisione: null,
        decisoDa: null
      };
    });
    changed = true;
  }

  ev.iscrizioni = (ev.iscrizioni || []).map(x => {
    if (!x || typeof x !== "object") { changed = true; return null; }
    const out = {
      cf: ((x.cf || "") + "").toUpperCase(),
      comitato: normalize(x.comitato || ""),
      stato: (x.stato || "pending"),
      dataRichiesta: x.dataRichiesta || null,
      dataDecisione: x.dataDecisione || null,
      decisoDa: x.decisoDa || null
    };
    if (!out.cf) changed = true;
    if (!["pending","approved","rejected","removed"].includes(out.stato)) { out.stato = "pending"; changed = true; }
    return out.cf ? out : null;
  }).filter(Boolean);

  return changed;
}

function normalizeRequisitiEvento(ev) {
  let changed = false;
  if (!Array.isArray(ev.qualificheRichieste)) ev.qualificheRichieste = [];
  if (!Array.isArray(ev.patentiRichieste)) ev.patentiRichieste = [];

  const patSet = new Set(PATENTI_OPTIONS);
  const newQual = [];
  ev.qualificheRichieste.forEach(x => {
    const v = (x || "").trim();
    if (!v) return;
    if (patSet.has(v)) {
      if (!ev.patentiRichieste.includes(v)) { ev.patentiRichieste.push(v); changed = true; }
    } else newQual.push(v);
  });
  if (newQual.length !== ev.qualificheRichieste.length) { ev.qualificheRichieste = newQual; changed = true; }

  if (ev.patentiRichieste.includes("NESSUNA") && ev.patentiRichieste.length > 1) {
    ev.patentiRichieste = ev.patentiRichieste.filter(x => x !== "NESSUNA");
    changed = true;
  }

  return changed;
}

function badgeForStato(stato){
  if (stato === "pending") return '<span class="badge badge-pending">In attesa</span>';
  if (stato === "approved") return '<span class="badge badge-approved">Approvato</span>';
  if (stato === "rejected") return '<span class="badge badge-rejected">Rifiutato</span>';
  if (stato === "removed") return '<span class="badge badge-rejected">Rimosso</span>';
  return '<span class="badge badge-pending">In attesa</span>';
}

function countIscrizioni(ev) {
  normalizeIscrizioniForEvento(ev);
  const iscr = ev.iscrizioni || [];
  const approved = iscr.filter(x => x.stato === "approved").length;
  const pending  = iscr.filter(x => x.stato === "pending").length;
  const rejected = iscr.filter(x => x.stato === "rejected").length;
  const removed  = iscr.filter(x => x.stato === "removed").length;
  return {approved, pending, rejected, removed, total: iscr.length};
}
function countOccupati(ev) {
  normalizeIscrizioniForEvento(ev);
  const iscr = ev.iscrizioni || [];
  return iscr.filter(x => x.stato === "approved" || x.stato === "pending").length;
}

/* ===========================
   ✅ REGOLE REQUISITI (OR)
=========================== */
function intersects(a, b) {
  const A = new Set((a || []).map(x => (x || "").trim()).filter(Boolean));
  for (const x of (b || [])) {
    const v = (x || "").trim();
    if (v && A.has(v)) return true;
  }
  return false;
}

function volontarioSoddisfaRequisiti(ev, vol) {
  normalizeRequisitiEvento(ev);

  const reqQ = ev.qualificheRichieste || [];
  const reqP = ev.patentiRichieste || [];

  const volQ = (vol?.qualifiche || []);
  const volP = (vol?.patenti || []);

  const okQ = reqQ.length === 0 ? true : intersects(volQ, reqQ);

  const reqPclean = reqP.filter(x => x && x !== "NESSUNA");
  const okP = reqPclean.length === 0 ? true : intersects(volP, reqPclean);

  return okQ && okP;
}

/* ===========================
   VISIBILITÀ EVENTI
=========================== */
function getVisibleEventi() {
  const eventi = getEventi();
  const c = normalize(comitato);

  return eventi.filter(ev => {
    normalizeRequisitiEvento(ev);

    const approvazioni = ev.approvazioni || {};
    const isApprovedGlobally = approvazioni["ALL"] === "approved";
    const closed = isEventoChiuso(ev);

    if (role === "sop" || role === "amministratore") return true;
    if (role === "sol") return true;

    if (role === "volontario") {
      if (closed) return false;
      if (!c) return false;

      if (isApprovedGlobally) return true;
      const stato = approvazioni[c] || "pending";
      return stato === "approved";
    }

    return false;
  });
}

/* ===========================
   POPUP INFO
=========================== */
function volontarioLabel(cf) {
  const v = getVolontarioByCf(cf);
  const name = v ? `${v.nome || ""} ${v.cognome || ""}`.trim() : "";
  return name ? `${escapeHtml(name)} (${escapeHtml(cf)})` : escapeHtml(cf);
}

function canManageIscrizioniForEvent(ev) {
  if (!(role === "sol" || role === "amministratore")) return false;
  const c = normalize(comitato);
  if (!c) return false;

  const creator = normalize(ev.comitatoCreatore);
  const dest = (ev.destSol || []).map(x => normalize(x));
  const approvazioni = ev.approvazioni || {};
  const globalApproved = approvazioni["ALL"] === "approved";
  return creator === c || dest.includes(c) || globalApproved;
}

function getMyIscrizione(ev, cf) {
  normalizeIscrizioniForEvento(ev);
  const cSol = normalize(comitato);
  const cfu = (cf || "").toUpperCase();
  return (ev.iscrizioni || []).find(x => x.cf === cfu && x.comitato === cSol) || null;
}

function richiediIscrizione(eventId) {
  if (role !== "volontario") return;

  const eventi = getEventi();
  const ev = eventi.find(e => e.id === eventId);
  if (!ev) { alert("Evento non trovato."); return; }

  normalizeIscrizioniForEvento(ev);
  normalizeRequisitiEvento(ev);

  if (isEventoChiuso(ev)) {
    alert("⛔ Evento chiuso: la data dell'evento è passata, non è più possibile iscriversi.");
    return;
  }

  const vol = getVolontarioByCf(cfUtente);
  if (!vol) {
    alert("Volontario non trovato in archivio. Contatta la SOL.");
    return;
  }

  if (!volontarioSoddisfaRequisiti(ev, vol)) {
    alert("⛔ Non possiedi i requisiti richiesti (serve almeno 1 qualifica/patente richiesta).");
    return;
  }

  const max = ev.maxPartecipanti || 0;
  if (max > 0) {
    const occupati = countOccupati(ev);
    if (occupati >= max) {
      alert("⛔ Evento pieno: capienza massima raggiunta.");
      return;
    }
  }

  const cSol = normalize(vol.comitato || comitato);
  const already = (ev.iscrizioni || []).find(x => x.cf === cfUtente && x.comitato === cSol);
  if (already) {
    alert("Hai già una richiesta per questo evento.");
    return;
  }

  ev.iscrizioni.push({
    cf: cfUtente,
    comitato: cSol,
    stato: "pending",
    dataRichiesta: new Date().toISOString(),
    dataDecisione: null,
    decisoDa: null
  });

  setEventi(eventi);
  alert("✅ Richiesta inviata alla tua SOL. Rimane in attesa di approvazione.");
  renderEventi();
}

function decideIscrizione(eventId, cfVol, decisione) {
  const eventi = getEventi();
  const ev = eventi.find(e => e.id === eventId);
  if (!ev) { alert("Evento non trovato."); return; }

  normalizeIscrizioniForEvento(ev);

  if (!canManageIscrizioniForEvent(ev)) {
    alert("Non hai i permessi per gestire le iscrizioni di questo evento.");
    return;
  }

  const cSol = normalize(comitato);
  const idx = (ev.iscrizioni || []).findIndex(x => x.cf === (cfVol || "").toUpperCase() && x.comitato === cSol);
  if (idx === -1) { alert("Richiesta non trovata."); return; }

  if (decisione === "approved") {
    const max = ev.maxPartecipanti || 0;
    if (max > 0) {
      const occupati = countOccupati(ev);
      if (occupati > max) {
        alert("Capienza superata. Controlla max partecipanti / richieste.");
        return;
      }
    }
  }

  ev.iscrizioni[idx].stato = decisione;
  ev.iscrizioni[idx].dataDecisione = new Date().toISOString();
  ev.iscrizioni[idx].decisoDa = cfUtente || userId;

  setEventi(eventi);
  showInfoPopup(ev);
  renderEventi();
}

function showInfoPopup(evento) {
  normalizeIscrizioniForEvento(evento);
  normalizeRequisitiEvento(evento);
  currentInfoEventId = evento.id;

  const approvazioni = evento.approvazioni || {};
  const destinatariList = [];
  if (evento.destSol && evento.destSol.length > 0) destinatariList.push("SOL: " + evento.destSol.join(", "));
  if (evento.destSop) destinatariList.push("SOP");
  const destinatariStr = destinatariList.length ? destinatariList.join(" | ") : "Solo comitato creatore";

  const statoBase = approvazioni["ALL"] === "approved"
    ? "Approvato dalla SOP (visibile a tutti)"
    : "Approvazioni locali in corso";

  const counts = countIscrizioni(evento);
  const max = evento.maxPartecipanti || 0;
  const posti = max > 0
    ? `✅ Approvati: ${counts.approved} | 🕒 In attesa: ${counts.pending} | ❌ Rifiutati: ${counts.rejected} | 🗑️ Rimossi: ${counts.removed} (Max: ${max})`
    : `✅ Approvati: ${counts.approved} | 🕒 In attesa: ${counts.pending} | ❌ Rifiutati: ${counts.rejected} | 🗑️ Rimossi: ${counts.removed} (Illimitato)`;

  const qualStr = (evento.qualificheRichieste || []).join(", ") || "Nessuna";
  const patStr  = (evento.patentiRichieste || []).join(", ") || "Nessuna";
  const closed = isEventoChiuso(evento);

  const dettagli = `
<div><span class="info-label">Titolo:</span><span class="info-value">${escapeHtml(evento.titolo)}</span></div>
<div><span class="info-label">Tipo evento:</span><span class="info-value">${escapeHtml(evento.tipoEvento)}</span></div>
<div><span class="info-label">Luogo:</span><span class="info-value">${escapeHtml(evento.luogo)}</span></div>
<div><span class="info-label">Data/Ora inizio:</span><span class="info-value">${formatDate(evento.dataInizio)} ${evento.oraInizio || ""}</span></div>
<div><span class="info-label">Data/Ora fine:</span><span class="info-value">${formatDate(evento.dataFine)} ${evento.oraFine || ""}</span></div>
<div><span class="info-label">Comitato creatore:</span><span class="info-value">${escapeHtml(evento.comitatoCreatore)}</span></div>
<div><span class="info-label">Destinatari:</span><span class="info-value">${escapeHtml(destinatariStr)}</span></div>
<div><span class="info-label">Stato approvazioni:</span><span class="info-value">${escapeHtml(statoBase)}</span></div>
<div><span class="info-label">Stato evento:</span><span class="info-value">${closed ? '<span class="badge badge-closed">CHIUSO</span>' : '<span class="badge badge-approved">APERTO</span>'}</span></div>
<div><span class="info-label">Iscrizioni:</span><span class="info-value">${escapeHtml(posti)}</span></div>
<div><span class="info-label">Qualifiche richieste:</span><span class="info-value">${escapeHtml(qualStr)}</span></div>
<div><span class="info-label">Patenti richieste:</span><span class="info-value">${escapeHtml(patStr)}</span></div>
<div><span class="info-label">Descrizione:</span><span class="info-value">${escapeHtml(evento.descrizione)}</span></div>
  `;

  let bloccoVol = "";
  if (role === "volontario") {
    const vol = getVolontarioByCf(cfUtente);
    const okReq = vol ? volontarioSoddisfaRequisiti(evento, vol) : false;
    const dis = closed ? "disabled" : (!okReq ? "disabled" : "");
    const reason = closed
      ? "Evento chiuso: data passata."
      : (!okReq ? "Non possiedi i requisiti richiesti (basta 1 qualifica/patente richiesta)." : "");

    bloccoVol = `
      <div class="section-title">🙋 Iscrizione volontario</div>
      <div style="display:flex; align-items:center; gap:10px; padding:10px 0;">
        <button class="action-btn signup-btn" type="button" ${dis}
          onclick="richiediIscrizione(${evento.id})">✅ Richiedi iscrizione</button>
        <span style="color:#666;">${escapeHtml(reason)}</span>
      </div>
    `;
  }

  let gestione = "";
  if (canManageIscrizioniForEvent(evento)) {
    const cSol = normalize(comitato);
    const soli = (evento.iscrizioni || []).filter(x => x.comitato === cSol);

    gestione += `<div class="section-title">👥 Iscrizioni della tua SOL (${escapeHtml(comitato)})</div>`;

    const rows = soli.map(x => {
      const statoBadge = badgeForStato(x.stato);
      let actionHtml = "";
      if (x.stato === "pending") {
        actionHtml = `
          <button class="ok" data-cf="${escapeHtml(x.cf)}" data-action="approved">Approva</button>
          <button class="no" data-cf="${escapeHtml(x.cf)}" data-action="rejected">Rifiuta</button>
        `;
      } else {
        actionHtml = `<span style="color:#666;">—</span>`;
      }

      return `
        <tr>
          <td>${volontarioLabel(x.cf)}</td>
          <td>${escapeHtml(x.dataRichiesta ? new Date(x.dataRichiesta).toLocaleString() : "")}</td>
          <td>${statoBadge}</td>
          <td class="mini-actions">${actionHtml}</td>
        </tr>
      `;
    }).join("");

    gestione += `
      <table class="mini-table" aria-label="Iscrizioni SOL">
        <thead>
          <tr>
            <th>Volontario</th>
            <th>Data richiesta</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="4" style="color:#666;">Nessuna iscrizione per la tua SOL su questo evento.</td></tr>`}
        </tbody>
      </table>
    `;
  }

  infoContent.innerHTML = dettagli + bloccoVol + gestione;

  infoContent.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cf = (btn.getAttribute("data-cf") || "").toUpperCase();
      const action = btn.getAttribute("data-action");
      decideIscrizione(currentInfoEventId, cf, action);
    });
  });

  openDialog(infoPopup);
}

function hideInfoPopup() {
  currentInfoEventId = null;
  closeDialog(infoPopup);
}
infoClose.addEventListener("click", hideInfoPopup);

/* ===========================
   FORM EVENTI
=========================== */
function toggleForm(show) {
  if (show) {
    form.comitatoCreatore.value = comitato || "";
    const q = readCsvHidden(inputQualificheData);
    const p = readCsvHidden(inputPatentiData);
    inputQualificheRichieste.value = formatRequisitiString(q, p);
    openDialog(formContainer, form.titolo);
    submitBtn.textContent = editIndex === null ? "Crea Evento" : "Salva Modifiche";
  } else {
    closeDialog(formContainer);
    form.reset();
    form.comitatoCreatore.value = comitato || "";
    form.visibilita.value = "Solo comitato creatore";
    editIndex = null;
    submitBtn.textContent = "Crea Evento";
    inputQualificheData.value = "";
    inputPatentiData.value = "";
    inputQualificheRichieste.value = "";
  }
}

btnApriForm.addEventListener("click", () => {
  if (!(role === "sol" || role === "sop" || role === "amministratore")) {
    alert("Solo SOL/SOP/Amministratore possono creare o modificare eventi.");
    return;
  }
  toggleForm(true);
});
btnChiudiForm.addEventListener("click", () => toggleForm(false));

/* ===========================
   RENDER EVENTI
=========================== */
function renderEventi() {
  const filter = searchInput.value.trim().toLowerCase();
  list.innerHTML = "";

  const eventi = getEventi();
  const visibili = getVisibleEventi();

  visibili
    .filter(ev =>
      (ev.titolo || "").toLowerCase().includes(filter) ||
      (ev.luogo || "").toLowerCase().includes(filter) ||
      (ev.comitatoCreatore || "").toLowerCase().includes(filter)
    )
    .forEach(ev => {
      const globalIndex = eventi.findIndex(e => e.id === ev.id);
      const approvazioni = ev.approvazioni || {};
      const isGlobalApproved = approvazioni["ALL"] === "approved";
      const closed = isEventoChiuso(ev);

      const destinatari = [];
      if (ev.destSol && ev.destSol.length > 0) destinatari.push("SOL: " + ev.destSol.join(", "));
      if (ev.destSop) destinatari.push("SOP");
      const destinatariStr = destinatari.length ? destinatari.join(" | ") : "Solo comitato creatore";

      let statoHtml = "";
      if (closed) statoHtml += '<span class="badge badge-closed">CHIUSO</span>';

      if (isGlobalApproved) {
        statoHtml += '<span class="badge badge-approved">SOP: approvato</span>';
      } else {
        const keys = Object.keys(approvazioni);
        const keysNoAll = keys.filter(k => k !== "ALL");
        if (keysNoAll.length === 0) {
          statoHtml += '<span class="badge badge-pending">In attesa</span>';
        } else {
          keysNoAll.forEach(k => {
            const stato = approvazioni[k];
            if (stato === "approved") statoHtml += '<span class="badge badge-approved">' + escapeHtml(k) + ': OK</span>';
            else if (stato === "rejected") statoHtml += '<span class="badge badge-rejected">' + escapeHtml(k) + ': NO</span>';
            else statoHtml += '<span class="badge badge-pending">' + escapeHtml(k) + ': in attesa</span>';
          });
        }
      }

      normalizeIscrizioniForEvento(ev);
      const counts = countIscrizioni(ev);
      const max = ev.maxPartecipanti || 0;
      const posti = max > 0
        ? `✅ ${counts.approved} | 🕒 ${counts.pending} / Max ${max}`
        : `✅ ${counts.approved} | 🕒 ${counts.pending}`;

      let azioni = `
        <button type="button" class="action-btn info-btn"
          aria-label="Dettagli evento ${escapeHtml(ev.titolo)}"
          onclick="showInfoPopupByIndex(${globalIndex})">ℹ️ Info</button>
      `;

      if (canManageIscrizioniForEvent(ev)) {
        azioni += `<button type="button" class="action-btn manage-btn" onclick="showInfoPopupByIndex(${globalIndex})">👥 Iscrizioni</button>`;
      }

      const cLower = normalize(comitato);
      const creatorLower = normalize(ev.comitatoCreatore);
      if ((role === "sol" || role === "sop" || role === "amministratore") && cLower === creatorLower) {
        azioni += `
          <button type="button" class="action-btn edit-btn" onclick="editEvento(${globalIndex})">✏️ Modifica</button>
          <button type="button" class="action-btn delete-btn" onclick="deleteEvento(${globalIndex})">🗑️ Elimina</button>
        `;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(ev.titolo)}</td>
        <td>${formatDate(ev.dataInizio)} ${ev.oraInizio || ""}</td>
        <td>${escapeHtml(ev.comitatoCreatore)}</td>
        <td>${escapeHtml(destinatariStr)}</td>
        <td>${statoHtml}</td>
        <td>${escapeHtml(posti)}</td>
        <td>${azioni}</td>
      `;
      list.appendChild(row);
    });
}

/* ===========================
   SUBMIT / EDIT / DELETE / INFO
=========================== */
form.addEventListener("submit", e => {
  e.preventDefault();

  if (!(role === "sol" || role === "sop" || role === "amministratore")) {
    alert("Solo SOL/SOP/Amministratore possono creare o modificare eventi.");
    return;
  }

  if (!form.checkValidity()) { form.reportValidity(); return; }

  const eventi = getEventi();

  const destSolRaw = form.destSol.value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const creatorLower = normalize(form.comitatoCreatore.value);
  const approvazioniBase = (editIndex === null ? {} : (eventi[editIndex].approvazioni || {}));
  approvazioniBase[creatorLower] = "approved";

  const qualificheSel = readCsvHidden(inputQualificheData);
  const patentiSel = readCsvHidden(inputPatentiData);

  const nuovoEvento = {
    id: editIndex === null ? Date.now() : eventi[editIndex].id,
    titolo: form.titolo.value.trim(),
    luogo: form.luogo.value.trim(),
    dataInizio: form.dataInizio.value,
    oraInizio: form.oraInizio.value,
    dataFine: form.dataFine.value,
    oraFine: form.oraFine.value,
    maxPartecipanti: form.maxPartecipanti.value ? parseInt(form.maxPartecipanti.value, 10) : 0,
    tipoEvento: form.tipoEvento.value.trim(),
    qualificheRichieste: qualificheSel,
    patentiRichieste: patentiSel,
    comitatoCreatore: form.comitatoCreatore.value.trim(),
    descrizione: form.descrizione.value.trim(),
    destSol: destSolRaw,
    destSop: form.destSop.checked,
    approvazioni: approvazioniBase,
    iscrizioni: editIndex === null ? [] : (eventi[editIndex].iscrizioni || [])
  };

  normalizeIscrizioniForEvento(nuovoEvento);
  normalizeRequisitiEvento(nuovoEvento);

  if (editIndex === null) eventi.push(nuovoEvento);
  else {
    eventi[editIndex] = nuovoEvento;
    editIndex = null;
    submitBtn.textContent = "Crea Evento";
  }

  setEventi(eventi);
  toggleForm(false);
  renderEventi();
});

window.editEvento = function(index) {
  const eventi = getEventi();
  const ev = eventi[index];
  if (!ev) return;

  const cLower = normalize(comitato);
  const creatorLower = normalize(ev.comitatoCreatore);
  if (role === "sol" && cLower !== creatorLower) {
    alert("Puoi modificare solo gli eventi creati dal tuo comitato.");
    return;
  }

  normalizeRequisitiEvento(ev);

  editIndex = index;
  submitBtn.textContent = "Salva Modifiche";

  form.titolo.value = ev.titolo || "";
  form.luogo.value = ev.luogo || "";
  form.dataInizio.value = ev.dataInizio || "";
  form.oraInizio.value = ev.oraInizio || "";
  form.dataFine.value = ev.dataFine || "";
  form.oraFine.value = ev.oraFine || "";
  form.maxPartecipanti.value = ev.maxPartecipanti || "";
  form.tipoEvento.value = ev.tipoEvento || "";

  writeCsvHidden(inputQualificheData, ev.qualificheRichieste || []);
  writeCsvHidden(inputPatentiData, ev.patentiRichieste || []);
  inputQualificheRichieste.value = formatRequisitiString(ev.qualificheRichieste || [], ev.patentiRichieste || []);

  form.comitatoCreatore.value = ev.comitatoCreatore || (comitato || "");
  form.descrizione.value = ev.descrizione || "";
  form.destSol.value = (ev.destSol || []).join(", ");
  form.destSop.checked = !!ev.destSop;

  openDialog(formContainer, form.titolo);
};

window.deleteEvento = function(index) {
  const eventi = getEventi();
  const ev = eventi[index];
  if (!ev) return;

  const cLower = normalize(comitato);
  const creatorLower = normalize(ev.comitatoCreatore);

  if (!(role === "sop" || role === "amministratore" || (role === "sol" && cLower === creatorLower))) {
    alert("Non hai i permessi per eliminare questo evento.");
    return;
  }

  if (confirm(`🗑️ Sei sicuro di voler eliminare l'evento:\n\n${ev.titolo}\n${ev.luogo}\n\n⚠️ Questa azione è irreversibile!`)) {
    eventi.splice(index, 1);
    setEventi(eventi);
    renderEventi();
    if (editIndex === index) {
      toggleForm(false);
      editIndex = null;
      submitBtn.textContent = "Crea Evento";
    }
  }
};

window.showInfoPopupByIndex = function(index) {
  const eventi = getEventi();
  const ev = eventi[index];
  if (!ev) return;
  showInfoPopup(ev);
};

/* ===========================
   INIT
=========================== */

/* ===========================
   DEMO EVENTI (turni emergenze Pesaro/Urbino)
   - crea 3 turni (08-14, 14-20, 20-08) su giorni diversi
   - evita duplicati per (titolo + dataInizio + oraInizio + comitatoCreatore)
=========================== */
function seedDemoEventiEmergenze(){
  const eventi = getEventi();

  function exists(ev){
    return eventi.some(x =>
      (x.titolo || "").trim() === (ev.titolo || "").trim() &&
      (x.dataInizio || "") === (ev.dataInizio || "") &&
      (x.oraInizio || "") === (ev.oraInizio || "") &&
      normalize(x.comitatoCreatore) === normalize(ev.comitatoCreatore)
    );
  }

  // helper date ISO yyyy-mm-dd
  const pad2 = (n) => String(n).padStart(2, "0");
  function addDays(base, days){
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }
  function toISODate(d){
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }

  // scegliamo giorni "diversi": oggi+1, oggi+3, oggi+6
  const base = new Date();
  base.setHours(0,0,0,0);
  const d1 = toISODate(addDays(base, 1));
  const d2 = toISODate(addDays(base, 3));
  const d3 = toISODate(addDays(base, 6));

  // turni richiesti
  // 08-14 (stesso giorno)
  // 14-20 (stesso giorno)
  // 20-08 (notte: finisce il giorno dopo)
  function makeShift(comitatoCreatore, luogo, whenDate, start, end, endDateOverride){
    const creatorLower = normalize(comitatoCreatore);
    const approvazioni = {};
    approvazioni[creatorLower] = "approved"; // come la logica emergenze: creatore già ok

    const ev = {
      id: Date.now() + Math.floor(Math.random() * 1000000),
      titolo: `Turno Emergenza ${comitatoCreatore} (${start}-${end})`,
      luogo: luogo,
      dataInizio: whenDate,
      oraInizio: start,
      dataFine: endDateOverride || whenDate,
      oraFine: end,
      maxPartecipanti: 0,
      tipoEvento: "Emergenza / Turno",
      qualificheRichieste: [],   // puoi metterle se vuoi
      patentiRichieste: [],      // puoi metterle se vuoi
      comitatoCreatore: comitatoCreatore,
      descrizione: `Turno operativo per emergenza ${comitatoCreatore}. Fascia ${start}-${end}.`,
      destSol: [],               // opzionale: metti ["Pesaro","Urbino"] se vuoi estenderlo
      destSop: false,
      approvazioni: approvazioni,
      iscrizioni: []
    };

    normalizeIscrizioniForEvento(ev);
    normalizeRequisitiEvento(ev);
    return ev;
  }

  // PESARO: 3 turni in giorni diversi
  const pesaro_1 = makeShift("Pesaro", "Pesaro (zona intervento)", d1, "08:00", "14:00");
  const pesaro_2 = makeShift("Pesaro", "Pesaro (zona intervento)", d2, "14:00", "20:00");
  // notte: fine giorno successivo
  const pesaro_3 = makeShift("Pesaro", "Pesaro (zona intervento)", d3, "20:00", "08:00", toISODate(addDays(new Date(d3+"T00:00:00"), 1)));

  // URBINO: 3 turni in giorni diversi (spostati di 1 giorno rispetto a Pesaro)
  const urbino_1 = makeShift("Urbino", "Urbino (zona intervento)", toISODate(addDays(new Date(d1+"T00:00:00"), 1)), "08:00", "14:00");
  const urbino_2 = makeShift("Urbino", "Urbino (zona intervento)", toISODate(addDays(new Date(d2+"T00:00:00"), 1)), "14:00", "20:00");
  const urbino_3 = makeShift("Urbino", "Urbino (zona intervento)", toISODate(addDays(new Date(d3+"T00:00:00"), 1)), "20:00", "08:00",
    toISODate(addDays(new Date(toISODate(addDays(new Date(d3+"T00:00:00"), 1))+"T00:00:00"), 1))
  );

  [pesaro_1, pesaro_2, pesaro_3, urbino_1, urbino_2, urbino_3].forEach(ev => {
    if (!exists(ev)) eventi.push(ev);
  });

  setEventi(eventi);
}

buildRequisitiUI();
seedDemoEventiEmergenze();
searchInput.addEventListener("input", renderEventi);
renderEventi();

