const userId = localStorage.getItem("userId");
const role = (localStorage.getItem("role") || "").toLowerCase().trim();
const comitato = localStorage.getItem("comitato");

if (!userId) {
  alert("Devi effettuare il login");
  window.location.href = "login.html";
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
document.getElementById("logout").onclick = logout;

// helper come index
const normalize = (s) => (s || "").toString().toLowerCase().trim();

// LOGO dinamico (come index)
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

// MENU laterale (come index, con TLC + Admin se previsti)
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
  if (href === "materiali.html") a.classList.add("active");
  li.appendChild(a);
  menu.appendChild(li);
});

// Riferimenti DOM
const formContainer = document.getElementById("form-container");
const form = document.getElementById("materiali-form");
const list = document.getElementById("materiali-list");
const searchInput = document.getElementById("search");
const btnApriForm = document.getElementById("btn-apri-form");
const btnChiudiForm = document.getElementById("btn-chiudi-form");
const submitBtn = document.getElementById("submit-btn");
const infoPopup = document.getElementById("info-popup");
const infoContent = document.getElementById("info-content");
const infoClose = document.getElementById("info-close");

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
    if (e.key === "Escape") toggleForm(false);
  }
  if (infoPopup.classList.contains("active")) {
    trapFocus(infoPopup, e);
    if (e.key === "Escape") hideInfoPopup();
  }
}

function toggleForm(show) {
  if (show) {
    hideInfoPopup();
    openDialog(formContainer, form.codice);
    submitBtn.textContent = editIndex === null ? "Aggiungi Materiale" : "Salva Modifiche";
  } else {
    closeDialog(formContainer);
    form.reset();
    form.comitato.removeAttribute("readonly");
    editIndex = null;
    submitBtn.textContent = "Aggiungi Materiale";
  }
}

btnApriForm.addEventListener("click", () => {
  if (role === "sol") {
    form.comitato.value = comitato || "";
    form.comitato.setAttribute("readonly", true);
  }
  toggleForm(true);
});

btnChiudiForm.addEventListener("click", () => toggleForm(false));

// Materiali visibili: SOP/amministratore tutti, SOL solo proprio comitato
function getVisibleMateriali() {
  const locali = JSON.parse(localStorage.getItem("materiali") || "[]");
  if (role === "sop" || role === "amministratore") return locali;

  if (role === "sol") {
    const c = (comitato || "").toLowerCase();
    if (!c) return locali;
    return locali.filter(m => (m.comitato || "").toLowerCase() === c);
  }
  return locali;
}

function formatDate(itDate) {
  if (!itDate) return "";
  const parts = itDate.split("-");
  if (parts.length === 3) return parts[2] + "/" + parts[1] + "/" + parts[0];
  return itDate;
}

function getStatoBadgeClass(stato) {
  const s = (stato || "").toLowerCase();
  if (s.includes("disponibile") || s.includes("in uso")) return "ok";
  if (s.includes("da reintegrare")) return "warn";
  if (s.includes("scaduto") || s.includes("fuori")) return "bad";
  return "";
}

function showInfoPopup(materiale) {
  const dettagli = `
<div><span class="info-label">Codice / ID:</span><span class="info-value">${escapeHtml(materiale.codice || "")}</span></div>
<div><span class="info-label">Nome materiale:</span><span class="info-value">${escapeHtml(materiale.nome || "")}</span></div>
<div><span class="info-label">Categoria:</span><span class="info-value">${escapeHtml(materiale.categoria || "")}</span></div>
<div><span class="info-label">Stato:</span><span class="info-value">${escapeHtml(materiale.stato || "")}</span></div>
<div><span class="info-label">Quantità:</span><span class="info-value">${escapeHtml(String(materiale.quantita ?? ""))}${materiale.unita ? " " + escapeHtml(materiale.unita) : ""}</span></div>
<div><span class="info-label">Comitato assegnatario:</span><span class="info-value">${escapeHtml(materiale.comitato || "")}</span></div>
<div><span class="info-label">Ubicazione:</span><span class="info-value">${escapeHtml(materiale.ubicazione || "")}</span></div>
<div><span class="info-label">Data carico:</span><span class="info-value">${escapeHtml(formatDate(materiale.dataCarico) || "")}</span></div>
<div><span class="info-label">Data scadenza:</span><span class="info-value">${escapeHtml(formatDate(materiale.dataScadenza) || "")}</span></div>
<div><span class="info-label">Lotto / seriale:</span><span class="info-value">${escapeHtml(materiale.lotto || "")}</span></div>
<div><span class="info-label">Fornitore / provenienza:</span><span class="info-value">${escapeHtml(materiale.fornitore || "")}</span></div>
<div><span class="info-label">Note / annotazioni:</span><span class="info-value">${escapeHtml(materiale.note || "Nessuna")}</span></div>
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
  const str = String(text);
  return str.replace(/[&<>"']/g, match => {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return escapeMap[match];
  });
}

function renderMateriali() {
  const filter = searchInput.value.trim().toLowerCase();
  list.innerHTML = "";

  const visibili = getVisibleMateriali();
  const tutti = JSON.parse(localStorage.getItem("materiali") || "[]");

  visibili
    .filter(m =>
      (m.codice || "").toLowerCase().includes(filter) ||
      (m.nome || "").toLowerCase().includes(filter) ||
      (m.categoria || "").toLowerCase().includes(filter) ||
      (m.comitato || "").toLowerCase().includes(filter) ||
      (m.ubicazione || "").toLowerCase().includes(filter) ||
      (m.stato || "").toLowerCase().includes(filter) ||
      (m.lotto || "").toLowerCase().includes(filter)
    )
    .forEach(m => {
      const globalIndex = tutti.findIndex(mm =>
        (mm.codice === m.codice) &&
        (mm.comitato === m.comitato) &&
        (mm.lotto || "") === (m.lotto || "")
      );

      const badgeClass = getStatoBadgeClass(m.stato);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(m.codice)}</td>
        <td>${escapeHtml(m.nome)}</td>
        <td>${escapeHtml(m.categoria)}</td>
        <td>${escapeHtml(m.comitato)}</td>
        <td>${escapeHtml(String(m.quantita ?? ""))}${m.unita ? " " + escapeHtml(m.unita) : ""}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(m.stato || "")}</span></td>
        <td>
          <button type="button" class="action-btn edit-btn" aria-label="Modifica materiale ${escapeHtml(m.codice)}" onclick="editMateriale(${globalIndex})">✏️ Modifica</button>
          <button type="button" class="action-btn delete-btn" aria-label="Elimina materiale ${escapeHtml(m.codice)}" onclick="deleteMateriale(${globalIndex})">🗑️ Elimina</button>
          <button type="button" class="action-btn info-btn" aria-label="Info materiale ${escapeHtml(m.codice)}" onclick="showInfoPopupByIndex(${globalIndex})">ℹ️ Info</button>
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

  const nuovoMateriale = {
    codice: form.codice.value.trim().toUpperCase(),
    nome: form.nome.value.trim(),
    categoria: form.categoria.value.trim(),
    stato: form.stato.value.trim(),
    quantita: form.quantita.value !== "" ? parseInt(form.quantita.value, 10) : 0,
    unita: form.unita.value.trim(),
    comitato: form.comitato.value.trim(),
    ubicazione: form.ubicazione.value.trim(),
    dataCarico: form.dataCarico.value,
    dataScadenza: form.dataScadenza.value,
    lotto: form.lotto.value.trim(),
    fornitore: form.fornitore.value.trim(),
    note: form.note.value.trim()
  };

  const locali = JSON.parse(localStorage.getItem("materiali") || "[]");

  const duplicateIndex = locali.findIndex((m, idx) =>
    (m.codice || "").toUpperCase() === nuovoMateriale.codice &&
    (m.comitato || "").toLowerCase() === (nuovoMateriale.comitato || "").toLowerCase() &&
    (m.lotto || "") === (nuovoMateriale.lotto || "") &&
    idx !== editIndex
  );

  if (duplicateIndex !== -1) {
    alert("❌ Errore: questo materiale (codice + comitato + lotto) è già presente!");
    return;
  }

  if (editIndex === null) {
    locali.push(nuovoMateriale);
  } else {
    locali[editIndex] = nuovoMateriale;
    editIndex = null;
    submitBtn.textContent = "Aggiungi Materiale";
  }

  localStorage.setItem("materiali", JSON.stringify(locali));
  toggleForm(false);
  renderMateriali();
});

window.editMateriale = function(index) {
  const locali = JSON.parse(localStorage.getItem("materiali") || "[]");
  const m = locali[index];
  if (!m) return;

  editIndex = index;
  submitBtn.textContent = "Salva Modifiche";

  form.codice.value = m.codice || "";
  form.nome.value = m.nome || "";
  form.categoria.value = m.categoria || "";
  form.stato.value = m.stato || "";
  form.quantita.value = (m.quantita ?? "");
  form.unita.value = m.unita || "";
  form.comitato.value = m.comitato || "";
  form.ubicazione.value = m.ubicazione || "";
  form.dataCarico.value = m.dataCarico || "";
  form.dataScadenza.value = m.dataScadenza || "";
  form.lotto.value = m.lotto || "";
  form.fornitore.value = m.fornitore || "";
  form.note.value = m.note || "";

  if (role === "sol") {
    form.comitato.setAttribute("readonly", true);
  } else {
    form.comitato.removeAttribute("readonly");
  }

  toggleForm(true);
};

window.deleteMateriale = function(index) {
  const locali = JSON.parse(localStorage.getItem("materiali") || "[]");
  const m = locali[index];
  if (!m) return;

  if (confirm(`🗑️ Sei sicuro di voler eliminare il materiale:\n\nCodice: ${m.codice}\nNome: ${m.nome}\nComitato: ${m.comitato}\n\n⚠️ Questa azione è irreversibile!`)) {
    locali.splice(index, 1);
    localStorage.setItem("materiali", JSON.stringify(locali));
    renderMateriali();

    if (editIndex === index) {
      toggleForm(false);
      editIndex = null;
      submitBtn.textContent = "Aggiungi Materiale";
    }
  }
};

window.showInfoPopupByIndex = function(index) {
  const locali = JSON.parse(localStorage.getItem("materiali") || "[]");
  const m = locali[index];
  if (!m) return;
  showInfoPopup(m);
};

/* ===========================
   DEMO MATERIALI (10 Pesaro + 10 Urbino) - solo se mancano
=========================== */
function seedDemoMateriali(){
  const locali = JSON.parse(localStorage.getItem("materiali") || "[]");

  function key(codice, comitato, lotto){
    return `${(codice||"").toUpperCase()}|${(comitato||"").toLowerCase().trim()}|${(lotto||"").trim()}`;
  }

  const existing = new Set(locali.map(m => key(m.codice, m.comitato, m.lotto)));

  function add(mat){
    const k = key(mat.codice, mat.comitato, mat.lotto);
    if (!mat.codice || !mat.comitato) return;
    if (existing.has(k)) return;
    existing.add(k);
    locali.push(mat);
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const pad2 = (n) => String(n).padStart(2, "0");
  const toISO = (y,m,d) => `${y}-${pad2(m)}-${pad2(d)}`;

  // date demo
  const dataCarico = toISO(yyyy-1, 6, 15);
  const scad1 = toISO(yyyy+1, 12, 31);
  const scad2 = toISO(yyyy, 8, 31);
  const scad3 = toISO(yyyy+2, 3, 31);

  function base(comitatoLabel, idx, obj){
    const i = String(idx).padStart(2, "0");
    return {
      codice: (obj.codice || `MAT-${comitatoLabel.slice(0,2).toUpperCase()}-${i}`).toUpperCase(),
      nome: obj.nome || "Materiale",
      categoria: obj.categoria || "Varie",
      stato: obj.stato || "Disponibile",
      quantita: Number.isFinite(obj.quantita) ? obj.quantita : 0,
      unita: obj.unita || "pz",
      comitato: comitatoLabel,
      ubicazione: obj.ubicazione || "Magazzino",
      dataCarico: obj.dataCarico || dataCarico,
      dataScadenza: obj.dataScadenza || "",
      lotto: (obj.lotto || `${comitatoLabel.slice(0,2).toUpperCase()}-${i}`).trim(),
      fornitore: obj.fornitore || "CRI",
      note: obj.note || ""
    };
  }

  // 10 materiali PESARO
  const pesaro = [
    base("Pesaro", 1, { codice:"KIT-PS-01", nome:"Kit medicazione", categoria:"Sanitario", stato:"Disponibile", quantita:12, unita:"pz", ubicazione:"Magazzino A - Scaffale 1", dataScadenza: scad1 }),
    base("Pesaro", 2, { codice:"DAE-PS-01", nome:"Defibrillatore (DAE)", categoria:"Sanitario", stato:"In uso", quantita:2, unita:"pz", ubicazione:"Ambulanza CRI010PS", note:"Controllo batterie mensile." }),
    base("Pesaro", 3, { codice:"O2-PS-01", nome:"Bombola ossigeno 2L", categoria:"Sanitario", stato:"Disponibile", quantita:8, unita:"pz", ubicazione:"Magazzino A - Scaffale 2" }),
    base("Pesaro", 4, { codice:"PPE-PS-01", nome:"Guanti nitrile (scatole)", categoria:"DPI", stato:"Disponibile", quantita:30, unita:"scat", ubicazione:"Magazzino A - Scaffale 3", dataScadenza: scad3 }),
    base("Pesaro", 5, { codice:"MAS-PS-01", nome:"Mascherine FFP2", categoria:"DPI", stato:"Da reintegrare", quantita:5, unita:"scat", ubicazione:"Magazzino A - Scaffale 3", note:"Sotto soglia minima." }),
    base("Pesaro", 6, { codice:"RAD-PS-01", nome:"Radio portatile", categoria:"TLC", stato:"Disponibile", quantita:10, unita:"pz", ubicazione:"Stanza TLC", lotto:"PS-RAD-2025" }),
    base("Pesaro", 7, { codice:"BAT-PS-01", nome:"Batterie radio", categoria:"TLC", stato:"Disponibile", quantita:20, unita:"pz", ubicazione:"Stanza TLC", dataScadenza: scad2 }),
    base("Pesaro", 8, { codice:"GEN-PS-01", nome:"Generatore 2kW", categoria:"Logistica", stato:"In uso", quantita:1, unita:"pz", ubicazione:"Furgone CRI005PS" }),
    base("Pesaro", 9, { codice:"CON-PS-01", nome:"Coni stradali", categoria:"Logistica", stato:"Disponibile", quantita:25, unita:"pz", ubicazione:"Magazzino B - Scaffale 1" }),
    base("Pesaro",10, { codice:"BND-PS-01", nome:"Bende elastiche", categoria:"Sanitario", stato:"Disponibile", quantita:40, unita:"pz", ubicazione:"Magazzino A - Scaffale 1", dataScadenza: scad1 })
  ];

  // 10 materiali URBINO
  const urbino = [
    base("Urbino", 1, { codice:"KIT-UR-01", nome:"Kit medicazione", categoria:"Sanitario", stato:"Disponibile", quantita:10, unita:"pz", ubicazione:"Magazzino U - Scaffale 1", dataScadenza: scad1 }),
    base("Urbino", 2, { codice:"DAE-UR-01", nome:"Defibrillatore (DAE)", categoria:"Sanitario", stato:"Disponibile", quantita:1, unita:"pz", ubicazione:"Magazzino U - Armadio sanitario", note:"Verifica elettrodi trimestrale." }),
    base("Urbino", 3, { codice:"O2-UR-01", nome:"Bombola ossigeno 5L", categoria:"Sanitario", stato:"In uso", quantita:3, unita:"pz", ubicazione:"Ambulanza CRI001UR" }),
    base("Urbino", 4, { codice:"PPE-UR-01", nome:"Visiere protettive", categoria:"DPI", stato:"Disponibile", quantita:15, unita:"pz", ubicazione:"Magazzino U - Scaffale 2" }),
    base("Urbino", 5, { codice:"MAS-UR-01", nome:"Mascherine chirurgiche", categoria:"DPI", stato:"Disponibile", quantita:20, unita:"scat", ubicazione:"Magazzino U - Scaffale 2", dataScadenza: scad3 }),
    base("Urbino", 6, { codice:"RAD-UR-01", nome:"Radio veicolare", categoria:"TLC", stato:"Disponibile", quantita:4, unita:"pz", ubicazione:"Stanza TLC", lotto:"UR-RAD-2025" }),
    base("Urbino", 7, { codice:"KIT-PC-UR", nome:"Kit protezione civile", categoria:"Protezione Civile", stato:"Disponibile", quantita:5, unita:"pz", ubicazione:"Magazzino U - Area PC" }),
    base("Urbino", 8, { codice:"TOR-UR-01", nome:"Torcia ricaricabile", categoria:"Logistica", stato:"Da reintegrare", quantita:2, unita:"pz", ubicazione:"Magazzino U - Scaffale 3", note:"Necessario reintegro." }),
    base("Urbino", 9, { codice:"COP-UR-01", nome:"Coperte isotermiche", categoria:"Sanitario", stato:"Disponibile", quantita:50, unita:"pz", ubicazione:"Magazzino U - Scaffale 1" }),
    base("Urbino",10, { codice:"DIS-UR-01", nome:"Disinfettante mani", categoria:"Sanitario", stato:"Disponibile", quantita:12, unita:"flac", ubicazione:"Magazzino U - Scaffale 1", dataScadenza: scad2 })
  ];

  pesaro.forEach(add);
  urbino.forEach(add);

  localStorage.setItem("materiali", JSON.stringify(locali));
}

searchInput.addEventListener("input", renderMateriali);
seedDemoMateriali();
renderMateriali();

