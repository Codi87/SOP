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

// helper (come index)
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
  if (href === "mezzi.html") a.classList.add("active");
  li.appendChild(a);
  menu.appendChild(li);
});

// Riferimenti DOM
const formContainer = document.getElementById("form-container");
const form = document.getElementById("mezzi-form");
const list = document.getElementById("mezzi-list");
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
    openDialog(formContainer, form.targa);
    submitBtn.textContent = editIndex === null ? "Aggiungi Mezzo" : "Salva Modifiche";
  } else {
    closeDialog(formContainer);
    form.reset();
    form.comitato.removeAttribute('readonly');
    editIndex = null;
    submitBtn.textContent = "Aggiungi Mezzo";
  }
}

btnApriForm.addEventListener("click", () => {
  if (role === "sol") {
    form.comitato.value = comitato || "";
    form.comitato.setAttribute('readonly', true);
  }
  toggleForm(true);
});

btnChiudiForm.addEventListener("click", () => toggleForm(false));

// mezzi visibili: SOP/amministratore tutti, SOL solo proprio comitato
function getVisibleMezzi() {
  const locali = JSON.parse(localStorage.getItem("mezzi") || "[]");
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
  if (parts.length === 3) {
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  return itDate;
}

function showInfoPopup(mezzo) {
  const dettagli = `
<div><span class="info-label">Targa:</span><span class="info-value">${mezzo.targa || ""}</span></div>
<div><span class="info-label">Tipo mezzo:</span><span class="info-value">${mezzo.tipoMezzo || ""}</span></div>
<div><span class="info-label">Selettiva radio / nominativo:</span><span class="info-value">${mezzo.selettivaRadio || ""}</span></div>
<div><span class="info-label">Numero posti a bordo:</span><span class="info-value">${mezzo.posti || ""}</span></div>
<div><span class="info-label">Comitato assegnatario:</span><span class="info-value">${mezzo.comitato || ""}</span></div>
<div><span class="info-label">Sede / Distaccamento:</span><span class="info-value">${mezzo.sede || ""}</span></div>
<div><span class="info-label">Data immatricolazione:</span><span class="info-value">${formatDate(mezzo.dataImmatricolazione) || ""}</span></div>
<div><span class="info-label">Data assegnazione al comitato:</span><span class="info-value">${formatDate(mezzo.dataAssegnazione) || ""}</span></div>
<div><span class="info-label">Categoria CRI:</span><span class="info-value">${mezzo.categoriaCRI || ""}</span></div>
<div><span class="info-label">Classe veicolo / omologazione:</span><span class="info-value">${mezzo.classeVeicolo || ""}</span></div>
<div><span class="info-label">Alimentazione:</span><span class="info-value">${mezzo.alimentazione || ""}</span></div>
<div><span class="info-label">Anno di costruzione:</span><span class="info-value">${mezzo.anno || ""}</span></div>
<div><span class="info-label">Stato mezzo:</span><span class="info-value">${mezzo.statoMezzo || ""}</span></div>
<div><span class="info-label">Numero di telaio:</span><span class="info-value">${mezzo.telaio || ""}</span></div>
<div><span class="info-label">Dotazioni principali:</span><span class="info-value">${mezzo.dotazioni || "Non specificate"}</span></div>
<div><span class="info-label">Note / annotazioni:</span><span class="info-value">${mezzo.note || "Nessuna"}</span></div>
  `;
  infoContent.innerHTML = dettagli;
  openDialog(infoPopup);
}

function hideInfoPopup() {
  closeDialog(infoPopup);
}
infoClose.addEventListener("click", hideInfoPopup);

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>"']/g, match => {
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

function renderMezzi() {
  const filter = searchInput.value.trim().toLowerCase();
  list.innerHTML = "";

  const visibili = getVisibleMezzi();
  const tutti = JSON.parse(localStorage.getItem("mezzi") || "[]");

  visibili
    .filter(m =>
      (m.targa || "").toLowerCase().includes(filter) ||
      (m.tipoMezzo || "").toLowerCase().includes(filter) ||
      (m.comitato || "").toLowerCase().includes(filter) ||
      (m.selettivaRadio || "").toLowerCase().includes(filter)
    )
    .forEach(m => {
      const globalIndex = tutti.findIndex(me => me.targa === m.targa && me.selettivaRadio === m.selettivaRadio);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(m.targa)}</td>
        <td>${escapeHtml(m.tipoMezzo)}</td>
        <td>${escapeHtml(m.comitato)}</td>
        <td>${escapeHtml(String(m.posti || ""))}</td>
        <td>
          <button type="button" class="action-btn edit-btn" aria-label="Modifica mezzo ${escapeHtml(m.targa)}" onclick="editMezzo(${globalIndex})">✏️ Modifica</button>
          <button type="button" class="action-btn delete-btn" aria-label="Elimina mezzo ${escapeHtml(m.targa)}" onclick="deleteMezzo(${globalIndex})">🗑️ Elimina</button>
          <button type="button" class="action-btn info-btn" aria-label="Info mezzo ${escapeHtml(m.targa)}" onclick="showInfoPopupByIndex(${globalIndex})">ℹ️ Info</button>
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

  const nuovoMezzo = {
    targa: form.targa.value.trim().toUpperCase(),
    tipoMezzo: form.tipoMezzo.value.trim(),
    selettivaRadio: form.selettivaRadio.value.trim().toUpperCase(),
    posti: form.posti.value ? parseInt(form.posti.value, 10) : "",
    comitato: form.comitato.value.trim(),
    sede: form.sede.value.trim(),
    dataImmatricolazione: form.dataImmatricolazione.value,
    dataAssegnazione: form.dataAssegnazione.value,
    categoriaCRI: form.categoriaCRI.value.trim(),
    classeVeicolo: form.classeVeicolo.value.trim(),
    alimentazione: form.alimentazione.value.trim(),
    anno: form.anno.value ? parseInt(form.anno.value, 10) : "",
    statoMezzo: form.statoMezzo.value.trim(),
    telaio: form.telaio.value.trim(),
    dotazioni: form.dotazioni.value.trim(),
    note: form.note.value.trim()
  };

  const locali = JSON.parse(localStorage.getItem("mezzi") || "[]");

  // Evito doppioni targa + selettiva
  const duplicateIndex = locali.findIndex((m, idx) =>
    m.targa === nuovoMezzo.targa &&
    m.selettivaRadio === nuovoMezzo.selettivaRadio &&
    idx !== editIndex
  );

  if (duplicateIndex !== -1) {
    alert("❌ Errore: questo mezzo (targa + selettiva) è già presente!");
    return;
  }

  if (editIndex === null) {
    locali.push(nuovoMezzo);
  } else {
    locali[editIndex] = nuovoMezzo;
    editIndex = null;
    submitBtn.textContent = "Aggiungi Mezzo";
  }

  localStorage.setItem("mezzi", JSON.stringify(locali));
  toggleForm(false);
  renderMezzi();
});

window.editMezzo = function(index) {
  const locali = JSON.parse(localStorage.getItem("mezzi") || "[]");
  const m = locali[index];
  if (!m) return;
  editIndex = index;
  submitBtn.textContent = "Salva Modifiche";

  form.targa.value = m.targa || "";
  form.tipoMezzo.value = m.tipoMezzo || "";
  form.selettivaRadio.value = m.selettivaRadio || "";
  form.posti.value = m.posti || "";
  form.comitato.value = m.comitato || "";
  form.sede.value = m.sede || "";
  form.dataImmatricolazione.value = m.dataImmatricolazione || "";
  form.dataAssegnazione.value = m.dataAssegnazione || "";
  form.categoriaCRI.value = m.categoriaCRI || "";
  form.classeVeicolo.value = m.classeVeicolo || "";
  form.alimentazione.value = m.alimentazione || "";
  form.anno.value = m.anno || "";
  form.statoMezzo.value = m.statoMezzo || "";
  form.telaio.value = m.telaio || "";
  form.dotazioni.value = m.dotazioni || "";
  form.note.value = m.note || "";

  if (role === "sol") {
    form.comitato.setAttribute('readonly', true);
  } else {
    form.comitato.removeAttribute('readonly');
  }

  toggleForm(true);
};

window.deleteMezzo = function(index) {
  const locali = JSON.parse(localStorage.getItem("mezzi") || "[]");
  const m = locali[index];
  if (!m) return;

  if (confirm(`🗑️ Sei sicuro di voler eliminare il mezzo:\n\nTarga: ${m.targa}\nTipo: ${m.tipoMezzo}\nSelettiva: ${m.selettivaRadio}\n\n⚠️ Questa azione è irreversibile!`)) {
    locali.splice(index, 1);
    localStorage.setItem("mezzi", JSON.stringify(locali));
    renderMezzi();
    if (editIndex === index) {
      toggleForm(false);
      editIndex = null;
      submitBtn.textContent = "Aggiungi Mezzo";
    }
  }
};

window.showInfoPopupByIndex = function(index) {
  const locali = JSON.parse(localStorage.getItem("mezzi") || "[]");
  const m = locali[index];
  if (!m) return;
  showInfoPopup(m);
};

/* ===========================
   DEMO MEZZI (10 Pesaro + 10 Urbino) - solo se mancano
=========================== */
function seedDemoMezzi(){
  const locali = JSON.parse(localStorage.getItem("mezzi") || "[]");

  function exists(targa, selettivaRadio){
    return locali.some(m =>
      (m.targa || "").toUpperCase() === targa.toUpperCase() &&
      (m.selettivaRadio || "").toUpperCase() === selettivaRadio.toUpperCase()
    );
  }

  function addMezzo(m){
    const t = (m.targa || "").toUpperCase();
    const s = (m.selettivaRadio || "").toUpperCase();
    if (!t || !s) return;
    if (exists(t, s)) return;
    locali.push({
      targa: t,
      tipoMezzo: m.tipoMezzo || "Ambulanza",
      selettivaRadio: s,
      posti: Number.isFinite(m.posti) ? m.posti : (m.posti ? parseInt(m.posti,10) : 4),
      comitato: m.comitato || "",
      sede: m.sede || "",
      dataImmatricolazione: m.dataImmatricolazione || "",
      dataAssegnazione: m.dataAssegnazione || "",
      categoriaCRI: m.categoriaCRI || "",
      classeVeicolo: m.classeVeicolo || "",
      alimentazione: m.alimentazione || "",
      anno: m.anno || "",
      statoMezzo: m.statoMezzo || "Operativo",
      telaio: m.telaio || "",
      dotazioni: m.dotazioni || "Zaino emergenza, DAE, bombole O2",
      note: m.note || ""
    });
  }

  const now = new Date();
  const year = now.getFullYear();

  // 10 MEZZI PESARO
  const mezziPesaro = [
    { targa:"CRI001PS", selettivaRadio:"PS-ALFA-1", tipoMezzo:"Ambulanza", posti:4, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-4, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"PS0001" },
    { targa:"CRI002PS", selettivaRadio:"PS-ALFA-2", tipoMezzo:"Ambulanza", posti:4, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-5, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"PS0002" },
    { targa:"CRI003PS", selettivaRadio:"PS-DELTA-1", tipoMezzo:"Auto Medica", posti:5, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Benzina", anno: year-3, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"PS0003" },
    { targa:"CRI004PS", selettivaRadio:"PS-ECHO-1", tipoMezzo:"Pulmino", posti:9, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-6, categoriaCRI:"Trasporti", classeVeicolo:"M2", statoMezzo:"Operativo", telaio:"PS0004" },
    { targa:"CRI005PS", selettivaRadio:"PS-LOG-1", tipoMezzo:"Furgone", posti:3, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-7, categoriaCRI:"Logistica", classeVeicolo:"N1", statoMezzo:"Operativo", telaio:"PS0005" },
    { targa:"CRI006PS", selettivaRadio:"PS-4X4-1", tipoMezzo:"Fuoristrada", posti:5, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-8, categoriaCRI:"Protezione Civile", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"PS0006" },
    { targa:"CRI007PS", selettivaRadio:"PS-TLC-1", tipoMezzo:"Unità TLC", posti:3, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-6, categoriaCRI:"TLC", classeVeicolo:"N1", statoMezzo:"Operativo", telaio:"PS0007" },
    { targa:"CRI008PS", selettivaRadio:"PS-SUP-1", tipoMezzo:"Auto di Supporto", posti:5, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Ibrida", anno: year-2, categoriaCRI:"Supporto", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"PS0008" },
    { targa:"CRI009PS", selettivaRadio:"PS-LOG-2", tipoMezzo:"Furgone", posti:3, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-9, categoriaCRI:"Logistica", classeVeicolo:"N1", statoMezzo:"Manutenzione", telaio:"PS0009", note:"In officina per tagliando." },
    { targa:"CRI010PS", selettivaRadio:"PS-ALFA-3", tipoMezzo:"Ambulanza", posti:4, comitato:"Pesaro", sede:"Pesaro", alimentazione:"Diesel", anno: year-1, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"PS0010" }
  ];

  // 10 MEZZI URBINO
  const mezziUrbino = [
    { targa:"CRI001UR", selettivaRadio:"UR-ALFA-1", tipoMezzo:"Ambulanza", posti:4, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-4, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"UR0001" },
    { targa:"CRI002UR", selettivaRadio:"UR-ALFA-2", tipoMezzo:"Ambulanza", posti:4, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-5, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"UR0002" },
    { targa:"CRI003UR", selettivaRadio:"UR-DELTA-1", tipoMezzo:"Auto Medica", posti:5, comitato:"Urbino", sede:"Urbino", alimentazione:"Benzina", anno: year-3, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"UR0003" },
    { targa:"CRI004UR", selettivaRadio:"UR-ECHO-1", tipoMezzo:"Pulmino", posti:9, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-6, categoriaCRI:"Trasporti", classeVeicolo:"M2", statoMezzo:"Operativo", telaio:"UR0004" },
    { targa:"CRI005UR", selettivaRadio:"UR-LOG-1", tipoMezzo:"Furgone", posti:3, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-7, categoriaCRI:"Logistica", classeVeicolo:"N1", statoMezzo:"Operativo", telaio:"UR0005" },
    { targa:"CRI006UR", selettivaRadio:"UR-4X4-1", tipoMezzo:"Fuoristrada", posti:5, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-8, categoriaCRI:"Protezione Civile", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"UR0006" },
    { targa:"CRI007UR", selettivaRadio:"UR-TLC-1", tipoMezzo:"Unità TLC", posti:3, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-6, categoriaCRI:"TLC", classeVeicolo:"N1", statoMezzo:"Operativo", telaio:"UR0007" },
    { targa:"CRI008UR", selettivaRadio:"UR-SUP-1", tipoMezzo:"Auto di Supporto", posti:5, comitato:"Urbino", sede:"Urbino", alimentazione:"Ibrida", anno: year-2, categoriaCRI:"Supporto", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"UR0008" },
    { targa:"CRI009UR", selettivaRadio:"UR-LOG-2", tipoMezzo:"Furgone", posti:3, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-9, categoriaCRI:"Logistica", classeVeicolo:"N1", statoMezzo:"Manutenzione", telaio:"UR0009", note:"In manutenzione programmata." },
    { targa:"CRI010UR", selettivaRadio:"UR-ALFA-3", tipoMezzo:"Ambulanza", posti:4, comitato:"Urbino", sede:"Urbino", alimentazione:"Diesel", anno: year-1, categoriaCRI:"Sanitario", classeVeicolo:"M1", statoMezzo:"Operativo", telaio:"UR0010" }
  ];

  mezziPesaro.forEach(addMezzo);
  mezziUrbino.forEach(addMezzo);

  localStorage.setItem("mezzi", JSON.stringify(locali));
}

searchInput.addEventListener("input", renderMezzi);
seedDemoMezzi();
renderMezzi();
