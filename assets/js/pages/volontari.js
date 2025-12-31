const userId = localStorage.getItem("userId");
const role = (localStorage.getItem("role") || "").toLowerCase().trim();
const comitato = localStorage.getItem("comitato") || "";

if (!userId) {
  alert("Devi effettuare il login");
  window.location.href = "login.html";
}

/* ===== LOGOUT ===== */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
document.getElementById("logout").onclick = logout;

/* ===== LOGO come INDEX ===== */
const logoImg = document.getElementById("logo-cri");
let logoSrc = "logo.svg";

const normalize = (s) => (s || "").toString().toLowerCase().trim();

/* ===== RUOLI SISTEMA (compatibile con admin.html) ===== */
const ruoloMapKey = "cri_ruoli_map";
function loadRuoliMap(){
  try { return JSON.parse(localStorage.getItem(ruoloMapKey) || "{}") || {}; }
  catch { return {}; }
}
function saveRuoliMap(m){
  localStorage.setItem(ruoloMapKey, JSON.stringify(m || {}));
}
function normalizeRoleValue(r){
  const x = normalize(r);
  if (!x) return "volontario";
  if (x === "admin") return "amministratore";
  if (x === "tlc provinciale" || x === "tlc-provinciale" || x === "tlcprovinciale") return "tlc_provinciale";
  return x;
}
function getRoleForCf(cfUpper){
  const id = (cfUpper || "").toUpperCase().trim();
  const map = loadRuoliMap();
  return normalizeRoleValue(map[id]?.ruolo || "");
}
function setRoleForVolontario(vol, selectedRole, oldCfUpper){
  const map = loadRuoliMap();
  const newCf = (vol?.cf || "").toUpperCase().trim();
  const oldCf = (oldCfUpper || "").toUpperCase().trim();
  const r = normalizeRoleValue(selectedRole);

  if (oldCf && oldCf !== newCf) delete map[oldCf];

  if (r === "volontario"){
    delete map[newCf];
  } else {
    map[newCf] = {
      ruolo: r,
      nome: `${vol?.nome || ""} ${vol?.cognome || ""}`.trim() || "Admin CRI",
      comitato: vol?.comitato || ""
    };
  }
  saveRuoliMap(map);
}

/* ===== Tooltip qualifiche (hover) ===== */
const qualificaDesc = {
  "OPEM": "Operatore CRI Attività in Emergenza",
  "CSA": "Corso Sicurezza Acquatica",
  "OPSA": "Operatore Polivalente di Salvataggio in Acqua",
  "TLC 1": "Operatore Telecomunicazioni",
  "TLC 2": "Specialista Telecomunicazioni",
  "UC-OC": "Operatore Cinofilo CRI",
  "ASP-C": "Specializzazione per Operatore di Supporto Ristorazione in Emergenza",
  "CAE": "Coordinatore Delle Attività di Emergenza",
  "CSP-A": "Operatore di Sala Operativa",
  "CSP-D": "Operatore Specializzato CRI in Logistica in Emergenza",
  "SMTS": "Operatore Soccorso con Mezzi e Tecniche Speciali",
  "AUTISTA SOCCORRITORE": "Autista Soccorritore Necessario TSSA",
  "SOCCORRITORE": "Soccorritore Necessario TSSA",
  "TS": "Corso Trasporti Sanitari",
  "OSG": "Operatore Sociale Generico",
  "LOGISTA": "Logista Generico Senza Corso",
  "OPERATORE UAS (A1/A3-A2-STS)": "Operatore UAS Certificato Con Attestati",
  "OPSOCEM": "Operatore Sociale CRI in Emergenza"
  // HACCP e MEDIATORE LINGUISTICO: nessuna descrizione
};

const tooltip = document.getElementById("qualifica-tooltip");
function showTooltip(text, x, y){
  if (!tooltip) return;
  tooltip.textContent = text;
  tooltip.style.display = "block";
  tooltip.setAttribute("aria-hidden", "false");

  const pad = 12;
  tooltip.style.left = (x + pad) + "px";
  tooltip.style.top = (y + pad) + "px";

  // clamp to viewport
  const rect = tooltip.getBoundingClientRect();
  let nx = x + pad, ny = y + pad;
  if (rect.right > window.innerWidth - 8) nx = Math.max(8, window.innerWidth - rect.width - 8);
  if (rect.bottom > window.innerHeight - 8) ny = Math.max(8, window.innerHeight - rect.height - 8);
  tooltip.style.left = nx + "px";
  tooltip.style.top = ny + "px";
}
function hideTooltip(){
  if (!tooltip) return;
  tooltip.style.display = "none";
  tooltip.setAttribute("aria-hidden", "true");
}
function attachQualificheTooltips(){
  const labels = document.querySelectorAll(".qualifiche-container label");
  labels.forEach(label => {
    const input = label.querySelector("input.qualifica-checkbox");
    if (!input) return;
    const key = (input.value || "").trim();
    const desc = qualificaDesc[key] || "";
    if (!desc) return; // niente popup se non c'è descrizione

    const handlerMove = (e) => showTooltip(desc, e.clientX, e.clientY);
    label.addEventListener("mouseenter", handlerMove);
    label.addEventListener("mousemove", handlerMove);
    label.addEventListener("mouseleave", hideTooltip);

    // accessibilità tastiera: focus sul checkbox
    input.addEventListener("focus", (e) => {
      const r = input.getBoundingClientRect();
      showTooltip(desc, r.left + r.width/2, r.top);
    });
    input.addEventListener("blur", hideTooltip);
  });
}
attachQualificheTooltips();

/* ===== Aliases per vecchie qualifiche (compatibilità dati) ===== */
const qualificaAlias = {
  "AUTISTA SOCCORRITORE TSSA": "AUTISTA SOCCORRITORE",
  "SOCCORRITORE TSSA": "SOCCORRITORE",
  "OPEM GENERICO": "OPEM",
  "OPEM LOGISTA": "LOGISTA",
  "OPERATORE TLC": "TLC 1",
  "OPERATORE SOCIALE GENERICO": "OSG",
  "CAE COORDINATORE ATTIVITA IN EMERGENZA": "CAE",
  "OPERATORE SOCIALE IN EMERGENZA": "OPSOCEM"
};

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

/* ===== MENU come INDEX (con TLC + Admin) ===== */
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

const current = (location.pathname.split("/").pop() || "").toLowerCase();

items.forEach(({ text, href }) => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;

  const hrefLower = (href || "").toLowerCase();
  if (current && current === hrefLower) a.classList.add("active");
  if (!current && hrefLower === "volontari.html") a.classList.add("active");
  if (current && current.includes("volontari") && hrefLower === "volontari.html") a.classList.add("active");

  li.appendChild(a);
  menu.appendChild(li);
});

const formContainer = document.getElementById("form-container");
const form = document.getElementById("volontari-form");
const list = document.getElementById("volontari-list");
const searchInput = document.getElementById("search");
const btnApriForm = document.getElementById("btn-apri-form");
const btnChiudiForm = document.getElementById("btn-chiudi-form");
const submitBtn = document.getElementById("submit-btn");
const infoPopup = document.getElementById("info-popup");
const infoContent = document.getElementById("info-content");
const infoClose = document.getElementById("info-close");

const rowRuolo = document.getElementById("row-ruolo");
const ruoloSelect = document.getElementById("ruoloSpeciale");
let editOldCf = null;

// Mostra la selezione ruolo solo all'Amministratore
if (rowRuolo) rowRuolo.style.display = (role === "amministratore") ? "flex" : "none";

let editIndex = null;
let lastFocusedElement = null;

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
      if (document.activeElement === first) {
        last.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }
  }
}

function openDialog(container, firstFocusElement) {
  lastFocusedElement = document.activeElement;
  container.classList.add("active");
  container.setAttribute("aria-hidden", "false");

  if (firstFocusElement) {
    firstFocusElement.focus();
  } else {
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
    if (e.key === "Escape") {
      toggleForm(false);
    }
  }
  if (infoPopup.classList.contains("active")) {
    trapFocus(infoPopup, e);
    if (e.key === "Escape") {
      hideInfoPopup();
    }
  }
}

function toggleForm(show) {
  if (show) {
    hideInfoPopup();
    openDialog(formContainer, form.nome);
    submitBtn.textContent = editIndex === null ? "Aggiungi Volontario" : "Salva Modifiche";
  } else {
    closeDialog(formContainer);
    form.reset();
    form.comitato.removeAttribute('readonly');
    editIndex = null;
    editOldCf = null;
    if (ruoloSelect) ruoloSelect.value = 'volontario';
    submitBtn.textContent = "Aggiungi Volontario";
  }
}

btnApriForm.addEventListener("click", () => {
  editIndex = null;
  editOldCf = null;
  if (ruoloSelect) ruoloSelect.value = "volontario";
  if (role === "sol") {
    form.comitato.value = comitato || "";
    form.comitato.setAttribute('readonly', true);
  }
  toggleForm(true);
});

btnChiudiForm.addEventListener("click", () => toggleForm(false));

function getVisibleVolontari() {
  const locali = JSON.parse(localStorage.getItem("volontari") || "[]");
  if (role === "sop" || role === "amministratore") return locali;

  if (role === "sol") {
    const c = normalize(comitato);
    if (!c) return locali;
    return locali.filter(v => normalize(v.comitato) === c);
  }
  return locali;
}

function showInfoPopup(volontario) {
  const dataRaw = volontario.dataNascita;
  let dataFormatted = dataRaw;
  if (dataRaw) {
    const parts = dataRaw.split("-");
    if (parts.length === 3) {
      dataFormatted = parts[2] + "/" + parts[1] + "/" + parts[0];
    }
  }

  const dettagli = `
<div><span class="info-label">Nome:</span><span class="info-value">${escapeHtml(volontario.nome || '')}</span></div>
<div><span class="info-label">Cognome:</span><span class="info-value">${escapeHtml(volontario.cognome || '')}</span></div>
<div><span class="info-label">Codice Fiscale:</span><span class="info-value">${escapeHtml(volontario.cf || '')}</span></div>
<div><span class="info-label">📧 Email:</span><span class="info-value">${escapeHtml(volontario.email || 'Non inserita')}</span></div>
<div><span class="info-label">📱 Telefono:</span><span class="info-value">${escapeHtml(volontario.telefono || '')}</span></div>
<div><span class="info-label">🚨 Contatto Emergenza:</span><span class="info-value">${escapeHtml(volontario.contattoEmergenza || '')}</span></div>
<div><span class="info-label">Luogo di nascita:</span><span class="info-value">${escapeHtml(volontario.luogoNascita || '')}</span></div>
<div><span class="info-label">Data di nascita:</span><span class="info-value">${escapeHtml(dataFormatted || '')}</span></div>
<div><span class="info-label">Stato:</span><span class="info-value">${escapeHtml(volontario.stato || 'Italia')}</span></div>
<div><span class="info-label">🏠 Indirizzo:</span><span class="info-value">${escapeHtml(volontario.indirizzo || '')}</span></div>
<div><span class="info-label">Comune:</span><span class="info-value">${escapeHtml(volontario.comune || '')}</span></div>
<div><span class="info-label">Provincia:</span><span class="info-value">${escapeHtml(volontario.provincia || '')}</span></div>
<div><span class="info-label">CAP:</span><span class="info-value">${escapeHtml(volontario.cap || '')}</span></div>
<div><span class="info-label">Comitato:</span><span class="info-value">${escapeHtml(volontario.comitato || '')}</span></div>
<div><span class="info-label">Intolleranze:</span><span class="info-value">${escapeHtml(volontario.intolleranze || "Nessuna")}</span></div>
<div><span class="info-label">Allergie:</span><span class="info-value">${escapeHtml(volontario.allergie || "Nessuna")}</span></div>
<div><span class="info-label">Codice MGO:</span><span class="info-value">${escapeHtml(volontario.codiceMGO || "Non inserito")}</span></div>
<div><span class="info-label">📋 Qualifiche:</span><span class="info-value">${escapeHtml((volontario.qualifiche ? volontario.qualifiche.join(", ") : "Nessuna"))}</span></div>
<div><span class="info-label">🚗 Patenti:</span><span class="info-value">${escapeHtml(((volontario.patenti || []).join(", ") || "Nessuna"))}</span></div>
<div><span class="info-label">Consenso GDPR:</span><span class="info-value">${volontario.consensoGdpr ? "✅ SI" : "❌ NO"}</span></div>
  `;
  infoContent.innerHTML = dettagli;
  openDialog(infoPopup);
}

function hideInfoPopup() {
  closeDialog(infoPopup);
}

infoClose.addEventListener("click", hideInfoPopup);

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, match => {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return escapeMap[match];
  });
}

function renderVolontari() {
  const filter = searchInput.value.trim().toLowerCase();
  list.innerHTML = "";

  const visibili = getVisibleVolontari();
  const tutti = JSON.parse(localStorage.getItem("volontari") || "[]");

  visibili
    .filter(v =>
      (v.nome || '').toLowerCase().includes(filter) ||
      (v.cognome || '').toLowerCase().includes(filter) ||
      (v.cf || '').toLowerCase().includes(filter) ||
      (v.email || '').toLowerCase().includes(filter)
    )
    .forEach(v => {
      const globalIndex = tutti.findIndex(vol => vol.cf === v.cf);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(v.nome)}</td>
        <td>${escapeHtml(v.cognome)}</td>
        <td>${escapeHtml(v.cf)}</td>
        <td>${escapeHtml(v.telefono)}</td>
        <td>
          <button type="button" class="action-btn edit-btn" aria-label="Modifica ${escapeHtml(v.nome)} ${escapeHtml(v.cognome)}" onclick="editVolontario(${globalIndex})">✏️ Modifica</button>
          <button type="button" class="action-btn delete-btn" aria-label="Elimina ${escapeHtml(v.nome)} ${escapeHtml(v.cognome)}" onclick="deleteVolontario(${globalIndex})">🗑️ Elimina</button>
          <button type="button" class="action-btn info-btn" aria-label="Info ${escapeHtml(v.nome)} ${escapeHtml(v.cognome)}" onclick="showInfoPopupByIndex(${globalIndex})">ℹ️ Info</button>
        </td>
      `;
      list.appendChild(row);
    });
}

form.addEventListener("submit", e => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const telefono = form.telefono.value.trim();
  const contattoEmergenza = form.contattoEmergenza.value.trim();
  if (telefono && contattoEmergenza && telefono === contattoEmergenza) {
    alert("❌ Il numero di telefono e il contatto di emergenza devono essere DIVERSI!");
    form.telefono.focus();
    return;
  }

  let selectedRole = "volontario";
  if (role === "amministratore" && ruoloSelect) {
    selectedRole = normalizeRoleValue(ruoloSelect.value);
  } else if (editIndex !== null) {
    const localiTmp = JSON.parse(localStorage.getItem("volontari") || "[]");
    const vOld = localiTmp[editIndex] || {};
    selectedRole = normalizeRoleValue(vOld.ruolo || vOld.role || getRoleForCf(vOld.cf) || "volontario");
  }

  const nuovoVolontario = {
    nome: form.nome.value.trim(),
    cognome: form.cognome.value.trim(),
    cf: form.cf.value.trim().toUpperCase(),
    email: form.email.value.trim().toLowerCase(),
    telefono,
    contattoEmergenza,
    luogoNascita: form.luogoNascita.value.trim(),
    dataNascita: form.dataNascita.value,
    stato: form.stato.value.trim(),
    indirizzo: form.indirizzo.value.trim(),
    comune: form.comune.value.trim(),
    provincia: form.provincia.value.trim(),
    cap: form.cap.value.trim(),
    comitato: form.comitato.value.trim(),
    intolleranze: form.intolleranze.value.trim(),
    allergie: form.allergie.value.trim(),
    codiceMGO: form.codiceMGO.value.trim(),
    qualifiche: Array.from(form.querySelectorAll(".qualifica-checkbox:checked")).map(cb => cb.value),
    patenti: Array.from(form.querySelectorAll(".patenti-checkbox:checked")).map(cb => cb.value),
    consensoGdpr: form.consensoGdpr.checked
  };

  if (selectedRole !== "volontario") {
    nuovoVolontario.ruolo = selectedRole;
    nuovoVolontario.role = selectedRole;
  }

  const locali = JSON.parse(localStorage.getItem("volontari") || "[]");
  const duplicateIndex = locali.findIndex((v, idx) => v.cf === nuovoVolontario.cf && idx !== editIndex);

  if (duplicateIndex !== -1) {
    alert("❌ Errore: codice fiscale già presente per un altro volontario!");
    return;
  }

  if (editIndex === null) {
    locali.push(nuovoVolontario);
  } else {
    locali[editIndex] = nuovoVolontario;
    editIndex = null;
    submitBtn.textContent = "Aggiungi Volontario";
  }

  localStorage.setItem("volontari", JSON.stringify(locali));

  if (role === "amministratore") {
    setRoleForVolontario(nuovoVolontario, selectedRole, editOldCf);
  }

  toggleForm(false);
  renderVolontari();
});

window.editVolontario = function(index){
  const locali = JSON.parse(localStorage.getItem("volontari") || "[]");
  const v = locali[index];
  editIndex = index;
  editOldCf = (v.cf || "").toUpperCase().trim();

  if (ruoloSelect) {
    const fromMap = getRoleForCf(v.cf);
    ruoloSelect.value = normalizeRoleValue(fromMap || v.ruolo || v.role || "volontario");
  }
  submitBtn.textContent = "Salva Modifiche";

  form.nome.value = v.nome || "";
  form.cognome.value = v.cognome || "";
  form.cf.value = v.cf || "";
  form.email.value = v.email || "";
  form.telefono.value = v.telefono || "";
  form.contattoEmergenza.value = v.contattoEmergenza || "";
  form.luogoNascita.value = v.luogoNascita || "";
  form.dataNascita.value = v.dataNascita || "";
  form.stato.value = v.stato || "";
  form.indirizzo.value = v.indirizzo || "";
  form.comune.value = v.comune || "";
  form.provincia.value = v.provincia || "";
  form.cap.value = v.cap || "";
  form.comitato.value = v.comitato || "";
  form.intolleranze.value = v.intolleranze || "";
  form.allergie.value = v.allergie || "";
  form.codiceMGO.value = v.codiceMGO || "";
  form.consensoGdpr.checked = !!v.consensoGdpr;

  if (role === "sol") {
    form.comitato.setAttribute('readonly', true);
  } else {
    form.comitato.removeAttribute('readonly');
  }

  const qSet = new Set((v.qualifiche || []).map(x => String(x || "").trim()));
  // compatibilità: mappa vecchi valori a nuove sigle
  const normalized = new Set();
  qSet.forEach(val => {
    normalized.add(val);
    if (qualificaAlias[val]) normalized.add(qualificaAlias[val]);
  });

  form.querySelectorAll(".qualifica-checkbox").forEach(cb => {
    cb.checked = normalized.has(cb.value);
  });

  form.querySelectorAll(".patenti-checkbox").forEach(cb => {
    cb.checked = v.patenti?.includes(cb.value) || false;
  });

  toggleForm(true);
};

window.deleteVolontario = function(index){
  const locali = JSON.parse(localStorage.getItem("volontari") || "[]");
  const v = locali[index];
  if(confirm(`🗑️ Sei sicuro di voler eliminare:\n\n${v.nome} ${v.cognome}\nCF: ${v.cf}\n\n⚠️ Questa azione è irreversibile!`)){
    locali.splice(index,1);
    localStorage.setItem("volontari", JSON.stringify(locali));
    renderVolontari();
    if(editIndex === index){
      toggleForm(false);
      editIndex = null;
      submitBtn.textContent = "Aggiungi Volontario";
    }
  }
};

window.showInfoPopupByIndex = function(index){
  const locali = JSON.parse(localStorage.getItem("volontari") || "[]");
  const v = locali[index];
  if(!v) return;
  showInfoPopup(v);
};

searchInput.addEventListener("input", renderVolontari);
renderVolontari();
