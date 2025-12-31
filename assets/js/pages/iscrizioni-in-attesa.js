(() => {
  const userId = (localStorage.getItem("userId") || "").toUpperCase();
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const comitato = localStorage.getItem("comitato") || "";

  const normalize = (s) => (s || "").toString().toLowerCase().trim();
  const safeParse = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const val = JSON.parse(raw);
      return val ?? fallback;
    } catch {
      return fallback;
    }
  };
  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

  if (!userId || (role !== "sop" && role !== "sol" && role !== "amministratore")) {
    alert("Accesso riservato SOP/SOL/Amministratore");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // LOGO dinamico (come index: aggiunge tlc_provinciale per sicurezza)
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
  } else if (role === "sop" || role === "amministratore" || role === "tlc_provincinciale" || role === "tlc_provinciale") {
    logoSrc = "logo-sop.svg";
  }
  logoImg.src = logoSrc;
  logoImg.onerror = () => { logoImg.src = "logo-sop.svg"; };

  // ===== MENU come INDEX (voci + condizioni) =====
  const menuEl = document.getElementById("menu-sidebar");
  menuEl.innerHTML = "";

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

    // active robusto
    const hrefLower = (href || "").toLowerCase();
    if (current && current === hrefLower) a.classList.add("active");
    if (!current && hrefLower === "iscrizioni-in-attesa.html") a.classList.add("active");
    if (current && current.includes("iscrizioni-in-attesa") && hrefLower === "iscrizioni-in-attesa.html") a.classList.add("active");

    li.appendChild(a);
    menuEl.appendChild(li);
  });

  const list = document.getElementById("attesa-list");
  const searchInput = document.getElementById("search");
  const stats = document.getElementById("stats");

  const infoPopup = document.getElementById("info-popup");
  const infoContent = document.getElementById("info-content");
  const infoCloseX = document.getElementById("info-close-x");

  // Modale edit (solo candidature)
  const editModal = document.getElementById("edit-modal");
  const editClose = document.getElementById("edit-close");
  const editForm = document.getElementById("edit-form");

  // campi edit
  const e_nome = document.getElementById("e_nome");
  const e_cognome = document.getElementById("e_cognome");
  const e_cf = document.getElementById("e_cf");
  const e_email = document.getElementById("e_email");
  const e_telefono = document.getElementById("e_telefono");
  const e_contattoEmergenza = document.getElementById("e_contattoEmergenza");
  const e_luogoNascita = document.getElementById("e_luogoNascita");
  const e_dataNascita = document.getElementById("e_dataNascita");
  const e_stato = document.getElementById("e_stato");
  const e_indirizzo = document.getElementById("e_indirizzo");
  const e_comune = document.getElementById("e_comune");
  const e_provincia = document.getElementById("e_provincia");
  const e_cap = document.getElementById("e_cap");
  const e_comitato = document.getElementById("e_comitato");
  const e_intolleranze = document.getElementById("e_intolleranze");
  const e_allergie = document.getElementById("e_allergie");
  const e_codiceMGO = document.getElementById("e_codiceMGO");
  const e_consensoGdpr = document.getElementById("e_consensoGdpr");

  let currentEditCf = null;

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    const map = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // SOP/amministratore vedono tutto; SOL solo proprio comitato
  function filterBySol(arr) {
    if (role === "sop" || role === "amministratore") return arr || [];
    const c = normalize(comitato);
    if (!c) return arr || [];
    return (arr || []).filter(x => normalize(x?.comitato) === c);
  }

  function formatIsoToIt(iso) {
    if (!iso) return "";
    if (String(iso).includes("T")) {
      try { return new Date(iso).toLocaleString("it-IT"); } catch { return String(iso); }
    }
    if (String(iso).includes("-")) {
      const parts = String(iso).split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return String(iso);
  }

  function openInfo() {
    infoPopup.classList.add("active");
    infoPopup.focus();
  }
  function closeInfo() { infoPopup.classList.remove("active"); }
  infoCloseX.addEventListener("click", closeInfo);
  infoPopup.addEventListener("click", e => { if (e.target === infoPopup) closeInfo(); });
  infoPopup.addEventListener("keydown", e => { if (e.key === "Escape") closeInfo(); });

  function notifyUpdate() {
    localStorage.setItem("cri_last_update", String(Date.now()));
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cri_updates");
        bc.postMessage({ type: "refresh_dashboard" });
        bc.close();
      }
    } catch {}
  }

  // ====== DATI STORAGE ======
  function getAttesaCandidature() { return safeParse("volontari-pubblici", []); }
  function setAttesaCandidature(arr) {
    localStorage.setItem("volontari-pubblici", JSON.stringify(arr || []));
    notifyUpdate();
  }

  function getRichiesteAggiornamento() {
    return safeParse("richieste-aggiornamenti-volontari", []);
  }
  function setRichiesteAggiornamento(arr) {
    localStorage.setItem("richieste-aggiornamenti-volontari", JSON.stringify(arr || []));
    notifyUpdate();
  }

  function getVolontariAttivi() { return safeParse("volontari", []); }
  function setVolontariAttivi(arr) {
    localStorage.setItem("volontari", JSON.stringify(arr || []));
    notifyUpdate();
  }

  function findVolontarioAttivoByCf(cf) {
    const cfu = (cf || "").toUpperCase().trim();
    const vv = getVolontariAttivi();
    return vv.find(v => ((v.cf || "") + "").toUpperCase().trim() === cfu) || null;
  }

  // ====== HELPERS ACCOUNT + EMAIL (NO SERVER) ======
  function normalizeUserPart(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .replace(/\.+/g, ".");
  }

  function generateUsername(nome, cognome, existingLowerSet) {
    const base = `${normalizeUserPart(nome)}.${normalizeUserPart(cognome)}`.replace(/\.+/g, ".");
    if (!existingLowerSet.has(base)) return base;
    let i = 2;
    while (existingLowerSet.has(`${base}${i}`)) i++;
    return `${base}${i}`;
  }

  function generateTempPassword6() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function buildApprovalEmailText({ nome, cognome, username, tempPassword }) {
    const loginUrl = new URL("login.html", window.location.href).toString();
    return (
`Ciao ${nome || ""} ${cognome || ""},

la tua candidatura è stata approvata.

Username: ${username}
Password temporanea: ${tempPassword}

Al primo accesso ti verrà richiesto di cambiare password.

Link login: ${loginUrl}
`
    );
  }

  async function copyToClipboardSafe(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function openMailClient(to, subject, body) {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  // ====== INFO RENDER ======
  function renderInfoCandidatura(vol) {
    const righe = [
      ["Tipo", "Candidatura"],
      ["Nome", vol.nome],
      ["Cognome", vol.cognome],
      ["Codice Fiscale", vol.cf],
      ["Email", vol.email || ""],
      ["Telefono", vol.telefono],
      ["Contatto Emergenza", vol.contattoEmergenza],
      ["Luogo di nascita", vol.luogoNascita],
      ["Data di nascita", formatIsoToIt(vol.dataNascita)],
      ["Stato", vol.stato || "in_attesa"],
      ["Indirizzo", vol.indirizzo],
      ["Comune", vol.comune],
      ["Provincia", vol.provincia],
      ["CAP", vol.cap],
      ["Comitato", vol.comitato],
      ["Intolleranze", vol.intolleranze || "Nessuna"],
      ["Allergie", vol.allergie || "Nessuna"],
      ["Codice MGO", vol.codiceMGO || "Non inserito"],
      ["Qualifiche", (vol.qualifiche || []).join(", ") || "Nessuna"],
      ["Patenti", (vol.patenti || []).join(", ") || "Nessuna"],
      ["Consenso GDPR", vol.consensoGdpr ? "✅ SI" : "❌ NO"],
      ["Data inserimento", vol.data_inserimento ? formatIsoToIt(vol.data_inserimento) : ""]
    ];

    infoContent.innerHTML = righe.map(([k, v]) => `
      <div class="row">
        <div class="info-label">${escapeHtml(k)}:</div>
        <div class="info-value">${v ? escapeHtml(v) : '<span class="muted">-</span>'}</div>
      </div>
    `).join("");

    document.getElementById("info-title").textContent = "📋 Dettagli Candidatura";
    openInfo();
  }

  function renderInfoAggiornamento(req) {
    const vol = findVolontarioAttivoByCf(req.cf || "");
    const nome = vol ? (vol.nome || "") : "";
    const cognome = vol ? (vol.cognome || "") : "";

    const righe = [
      ["Tipo", "Aggiornamento qualifiche/patenti"],
      ["Nome", nome || "—"],
      ["Cognome", cognome || "—"],
      ["Codice Fiscale", (req.cf || "").toUpperCase()],
      ["Comitato", req.comitato || (vol?.comitato || "")],
      ["Qualifiche richieste", (req.aggiunteQualifiche || []).join(", ") || "Nessuna"],
      ["Patenti richieste", (req.aggiuntePatenti || []).join(", ") || "Nessuna"],
      ["Stato richiesta", req.stato || "pending"],
      ["Data richiesta", req.dataRichiesta ? formatIsoToIt(req.dataRichiesta) : ""],
      ["Ultimo aggiornamento", req.dataUltimoAggiornamento ? formatIsoToIt(req.dataUltimoAggiornamento) : ""],
      ["Decisione", req.dataDecisione ? formatIsoToIt(req.dataDecisione) : "—"],
      ["Deciso da", req.decisoDa || "—"]
    ];

    infoContent.innerHTML = righe.map(([k, v]) => `
      <div class="row">
        <div class="info-label">${escapeHtml(k)}:</div>
        <div class="info-value">${v ? escapeHtml(v) : '<span class="muted">-</span>'}</div>
      </div>
    `).join("");

    document.getElementById("info-title").textContent = "📋 Dettagli Richiesta Aggiornamento";
    openInfo();
  }

  // ====== EDIT MODAL (solo candidature) ======
  function openEditModal() {
    editModal.classList.add("active");
    editModal.setAttribute("aria-hidden", "false");
    setTimeout(() => e_nome.focus(), 0);
  }
  function closeEditModal() {
    editModal.classList.remove("active");
    editModal.setAttribute("aria-hidden", "true");
    editForm.reset();
    currentEditCf = null;
    document.querySelectorAll(".e_qualifica").forEach(cb => cb.checked = false);
    document.querySelectorAll(".e_patente").forEach(cb => cb.checked = false);
  }
  editClose.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", (e) => { if (e.target === editModal) closeEditModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editModal.classList.contains("active")) closeEditModal();
  });

  function fillEditForm(v) {
    currentEditCf = (v.cf || "").toUpperCase().trim();

    e_nome.value = v.nome || "";
    e_cognome.value = v.cognome || "";
    e_cf.value = currentEditCf;
    e_email.value = v.email || "";
    e_telefono.value = v.telefono || "";
    e_contattoEmergenza.value = v.contattoEmergenza || "";
    e_luogoNascita.value = v.luogoNascita || "";
    e_dataNascita.value = v.dataNascita || "";
    e_stato.value = v.stato || "";
    e_indirizzo.value = v.indirizzo || "";
    e_comune.value = v.comune || "";
    e_provincia.value = v.provincia || "";
    e_cap.value = v.cap || "";
    e_comitato.value = v.comitato || "";
    e_intolleranze.value = v.intolleranze || "";
    e_allergie.value = v.allergie || "";
    e_codiceMGO.value = v.codiceMGO || "";
    e_consensoGdpr.checked = !!v.consensoGdpr;

    if (role === "sol") {
      e_comitato.value = comitato || e_comitato.value;
      e_comitato.setAttribute("readonly", true);
    } else {
      e_comitato.removeAttribute("readonly");
    }

    const q = Array.isArray(v.qualifiche) ? v.qualifiche : [];
    const p = Array.isArray(v.patenti) ? v.patenti : [];
    document.querySelectorAll(".e_qualifica").forEach(cb => cb.checked = q.includes(cb.value));
    document.querySelectorAll(".e_patente").forEach(cb => cb.checked = p.includes(cb.value));
  }

  function editByCf(cf) {
    const full = getAttesaCandidature();
    const cfu = (cf || "").toUpperCase().trim();
    const v = full.find(x => (x.cf || "").toUpperCase().trim() === cfu);
    if (!v) return;
    fillEditForm(v);
    openEditModal();
  }

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!editForm.checkValidity()) {
      editForm.reportValidity();
      return;
    }
    if (!currentEditCf) return;

    const full = getAttesaCandidature();
    const idx = full.findIndex(x => (x.cf || "").toUpperCase().trim() === currentEditCf);
    if (idx === -1) return;

    const updated = {
      ...full[idx],
      nome: e_nome.value.trim(),
      cognome: e_cognome.value.trim(),
      email: (e_email.value || "").trim().toLowerCase(),
      telefono: (e_telefono.value || "").trim(),
      contattoEmergenza: (e_contattoEmergenza.value || "").trim(),
      luogoNascita: (e_luogoNascita.value || "").trim(),
      dataNascita: e_dataNascita.value || "",
      stato: (e_stato.value || "").trim(),
      indirizzo: (e_indirizzo.value || "").trim(),
      comune: (e_comune.value || "").trim(),
      provincia: (e_provincia.value || "").trim(),
      cap: (e_cap.value || "").trim(),
      comitato: (e_comitato.value || "").trim(),
      intolleranze: (e_intolleranze.value || "").trim(),
      allergie: (e_allergie.value || "").trim(),
      codiceMGO: (e_codiceMGO.value || "").trim(),
      qualifiche: Array.from(document.querySelectorAll(".e_qualifica:checked")).map(cb => cb.value),
      patenti: Array.from(document.querySelectorAll(".e_patente:checked")).map(cb => cb.value),
      consensoGdpr: !!e_consensoGdpr.checked,
      data_modifica: new Date().toISOString()
    };

    full[idx] = updated;
    setAttesaCandidature(full);

    closeEditModal();
    renderAttesa();
    alert("✅ Candidatura aggiornata!");
  });

  // ====== APPROVA CANDIDATURA (username nome.cognome + password random 6 + mailto) ======
  async function approveByCf(cf) {
    const fullAttesa = getAttesaCandidature();
    const cfu = (cf || "").toUpperCase().trim();

    const v = fullAttesa.find(x => (x.cf || "").toUpperCase().trim() === cfu);
    if (!v) return;

    const email = (v.email || "").trim().toLowerCase();
    if (!email) {
      alert("❌ Questa candidatura non ha una email. Inseriscila prima con ✏️ Modifica.");
      return;
    }

    const volontari = getVolontariAttivi();
    const duplicatoCf = volontari.find(vol => (vol.cf || "").toUpperCase().trim() === cfu);
    if (duplicatoCf) {
      alert("❌ Errore: questo codice fiscale è già presente nei volontari attivi!");
      return;
    }

    // username unico
    const existing = new Set((volontari || []).map(x => (x.username || "").toLowerCase()).filter(Boolean));
    const username = generateUsername(v.nome, v.cognome, existing);

    // password random 6 caratteri
    const tempPassword = generateTempPassword6();

    const ok = confirm(
      `✅ Approvare la candidatura di:\n\n` +
      `${v.nome} ${v.cognome}\nCF: ${v.cf}\nComitato: ${v.comitato}\n\n` +
      `👤 Username: ${username}\n🔐 Password temporanea: ${tempPassword}\n\n` +
      `📧 Preparare una mail a: ${email}`
    );
    if (!ok) return;

    const approved = {
      ...v,
      username,
      password: tempPassword,
      mustChangePassword: true,
      statoApprovazione: "approvato",
      dataApprovazione: new Date().toISOString()
    };
    delete approved.pubblico;
    delete approved.data_inserimento;

    volontari.push(approved);
    setVolontariAttivi(volontari);

    const newFull = fullAttesa.filter(x => (x.cf || "").toUpperCase().trim() !== cfu);
    setAttesaCandidature(newFull);

    // prepara email (NO SERVER: mailto + copia)
    const subject = "Candidatura approvata - Credenziali di accesso CRI";
    const body = buildApprovalEmailText({
      nome: v.nome,
      cognome: v.cognome,
      username,
      tempPassword
    });

    const copied = await copyToClipboardSafe(body);
    openMailClient(email, subject, body);

    renderAttesa();

    alert(
      `✅ Approvato!\n\nUsername: ${username}\nPassword: ${tempPassword}\n\n` +
      (copied ? "📋 Testo email copiato negli appunti." : "⚠️ Non sono riuscito a copiare negli appunti.")
    );
  }

  function deleteByCf(cf) {
    const fullAttesa = getAttesaCandidature();
    const cfu = (cf || "").toUpperCase().trim();

    const v = fullAttesa.find(x => (x.cf || "").toUpperCase().trim() === cfu);
    if (!v) return;

    if (!confirm(`🗑️ Eliminare definitivamente la candidatura di:\n\n${v.nome} ${v.cognome}\nCF: ${v.cf}\n\n⚠️ Questa azione è irreversibile!`)) {
      return;
    }

    const newFull = fullAttesa.filter(x => (x.cf || "").toUpperCase().trim() !== cfu);
    setAttesaCandidature(newFull);

    renderAttesa();
    alert("🗑️ Candidatura eliminata");
  }

  function showInfoByCf(cf) {
    let attesa = filterBySol(getAttesaCandidature());
    const cfu = (cf || "").toUpperCase().trim();
    const v = attesa.find(x => (x.cf || "").toUpperCase().trim() === cfu);
    if (!v) return;
    renderInfoCandidatura(v);
  }

  // ====== APPROVA / RIFIUTA RICHIESTA AGGIORNAMENTO ======
  function normalizePatenti(arr) {
    let p = uniq(arr || []);
    const hasReal = p.some(x => x && x !== "NESSUNA");
    if (hasReal) p = p.filter(x => x !== "NESSUNA");
    if (!p.length) p = ["NESSUNA"];
    return p;
  }

  function approveUpdateRequest(reqId) {
    const richieste = getRichiesteAggiornamento();
    const r = richieste.find(x => String(x.id) === String(reqId) && (x.stato || "pending") === "pending");
    if (!r) { alert("Richiesta non trovata o già gestita."); return; }

    if (role === "sol" && normalize(r.comitato) !== normalize(comitato)) {
      alert("Non puoi approvare richieste di altri comitati.");
      return;
    }

    const cf = (r.cf || "").toUpperCase().trim();
    const vv = getVolontariAttivi();
    const idxV = vv.findIndex(v => ((v.cf || "") + "").toUpperCase().trim() === cf);
    if (idxV === -1) { alert("Volontario non trovato tra gli attivi."); return; }

    const vol = vv[idxV];
    const addQ = uniq(r.aggiunteQualifiche || []);
    const addP = uniq(r.aggiuntePatenti || []);

    if (!confirm(
      `✅ Approvare aggiornamento per CF ${cf}?\n\n` +
      `Qualifiche: ${addQ.length ? addQ.join(", ") : "—"}\n` +
      `Patenti: ${addP.length ? addP.join(", ") : "—"}`
    )) return;

    vol.qualifiche = uniq([...(vol.qualifiche || []), ...addQ]);
    vol.patenti = normalizePatenti([...(vol.patenti || []), ...addP]);

    const pendQ = uniq(vol.pendingQualificheAdd || []);
    const pendP = uniq(vol.pendingPatentiAdd || []);
    vol.pendingQualificheAdd = pendQ.filter(x => !addQ.includes(x));
    vol.pendingPatentiAdd = pendP.filter(x => !addP.includes(x));
    if (!vol.pendingQualificheAdd.length) delete vol.pendingQualificheAdd;
    if (!vol.pendingPatentiAdd.length) delete vol.pendingPatentiAdd;

    vv[idxV] = vol;
    setVolontariAttivi(vv);

    r.stato = "approved";
    r.dataDecisione = new Date().toISOString();
    r.decisoDa = userId || "SOL";
    setRichiesteAggiornamento(richieste);

    renderAttesa();
    alert("✅ Richiesta approvata e applicata al profilo del volontario.");
  }

  function rejectUpdateRequest(reqId) {
    const richieste = getRichiesteAggiornamento();
    const r = richieste.find(x => String(x.id) === String(reqId) && (x.stato || "pending") === "pending");
    if (!r) { alert("Richiesta non trovata o già gestita."); return; }

    if (role === "sol" && normalize(r.comitato) !== normalize(comitato)) {
      alert("Non puoi rifiutare richieste di altri comitati.");
      return;
    }

    const cf = (r.cf || "").toUpperCase().trim();
    const addQ = uniq(r.aggiunteQualifiche || []);
    const addP = uniq(r.aggiuntePatenti || []);

    if (!confirm(
      `❌ Rifiutare aggiornamento per CF ${cf}?\n\n` +
      `Qualifiche: ${addQ.length ? addQ.join(", ") : "—"}\n` +
      `Patenti: ${addP.length ? addP.join(", ") : "—"}`
    )) return;

    const vv = getVolontariAttivi();
    const idxV = vv.findIndex(v => ((v.cf || "") + "").toUpperCase().trim() === cf);
    if (idxV !== -1) {
      const vol = vv[idxV];
      const pendQ = uniq(vol.pendingQualificheAdd || []);
      const pendP = uniq(vol.pendingPatentiAdd || []);
      vol.pendingQualificheAdd = pendQ.filter(x => !addQ.includes(x));
      vol.pendingPatentiAdd = pendP.filter(x => !addP.includes(x));
      if (!vol.pendingQualificheAdd.length) delete vol.pendingQualificheAdd;
      if (!vol.pendingPatentiAdd.length) delete vol.pendingPatentiAdd;
      vv[idxV] = vol;
      setVolontariAttivi(vv);
    }

    r.stato = "rejected";
    r.dataDecisione = new Date().toISOString();
    r.decisoDa = userId || "SOL";
    setRichiesteAggiornamento(richieste);

    renderAttesa();
    alert("❌ Richiesta rifiutata.");
  }

  function showUpdateInfo(reqId) {
    let richieste = getRichiesteAggiornamento().filter(x => (x.stato || "pending") === "pending");
    richieste = filterBySol(richieste);
    const r = richieste.find(x => String(x.id) === String(reqId));
    if (!r) return;
    renderInfoAggiornamento(r);
  }

  window.approveByCf = approveByCf;
  window.deleteByCf = deleteByCf;
  window.showInfoByCf = showInfoByCf;
  window.editByCf = editByCf;

  window.approveUpdateRequest = approveUpdateRequest;
  window.rejectUpdateRequest = rejectUpdateRequest;
  window.showUpdateInfo = showUpdateInfo;

  // ====== RENDER LISTA UNIFICATA ======
  function buildUnifiedPending() {
    let cand = filterBySol(getAttesaCandidature());
    cand = (cand || []).map(v => ({
      kind: "candidatura",
      nome: v.nome || "",
      cognome: v.cognome || "",
      cf: (v.cf || "").toUpperCase().trim(),
      comitato: v.comitato || "",
      dettaglio: "Candidatura",
      raw: v
    }));

    let req = getRichiesteAggiornamento().filter(x => (x.stato || "pending") === "pending");
    req = filterBySol(req);

    req = req.map(r => {
      const cf = (r.cf || "").toUpperCase().trim();
      const vol = findVolontarioAttivoByCf(cf);
      const nome = vol ? (vol.nome || "") : "";
      const cognome = vol ? (vol.cognome || "") : "";
      const q = uniq(r.aggiunteQualifiche || []);
      const p = uniq(r.aggiuntePatenti || []);
      const det = [
        `<span class="badge">Aggiornamento</span>`,
        q.length ? `📋 ${escapeHtml(q.join(", "))}` : "",
        p.length ? `🚗 ${escapeHtml(p.join(", "))}` : ""
      ].filter(Boolean).join("<br>");

      return ({
        kind: "update",
        nome,
        cognome,
        cf,
        comitato: r.comitato || (vol?.comitato || ""),
        dettaglio: det,
        raw: r
      });
    });

    const sortKey = (x) => {
      if (x.kind === "update") return x.raw?.dataUltimoAggiornamento || x.raw?.dataRichiesta || "";
      return x.raw?.data_inserimento || x.raw?.dataRichiesta || "";
    };
    const rank = (x) => x.kind === "update" ? 0 : 1;

    return [...req, ...cand].sort((a, b) => {
      const rA = rank(a), rB = rank(b);
      if (rA !== rB) return rA - rB;
      return String(sortKey(a)).localeCompare(String(sortKey(b)));
    });
  }

  function renderAttesa() {
    const filter = normalize(searchInput.value);
    const unified = buildUnifiedPending();

    const filtered = unified.filter(x => {
      const detPlain = (x.kind === "update")
        ? `${(x.raw?.aggiunteQualifiche || []).join(", ")} ${(x.raw?.aggiuntePatenti || []).join(", ")}`
        : "";
      return (
        normalize(x.nome).includes(filter) ||
        normalize(x.cognome).includes(filter) ||
        normalize(x.cf).includes(filter) ||
        normalize(x.comitato).includes(filter) ||
        normalize(x.kind).includes(filter) ||
        normalize(detPlain).includes(filter)
      );
    });

    const nCand = filtered.filter(x => x.kind === "candidatura").length;
    const nUpd  = filtered.filter(x => x.kind === "update").length;
    const total = filtered.length;

    stats.innerHTML = `
      <strong>${total} richieste in attesa</strong><br>
      <span class="muted">Candidature: ${nCand} • Aggiornamenti qualifiche/patenti: ${nUpd}</span>
    `;

    list.innerHTML = "";
    if (filtered.length === 0) {
      list.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666">✅ Nessuna richiesta in attesa</td></tr>';
      return;
    }

    filtered.forEach(item => {
      const cfEsc = escapeHtml(item.cf);

      let actionsHtml = "";

      if (item.kind === "candidatura") {
        actionsHtml = `
          <button class="action-btn approve-btn" type="button"
            onclick="approveByCf('${cfEsc}')">✅ Approva</button>

          <button class="action-btn edit-btn" type="button"
            onclick="editByCf('${cfEsc}')">✏️ Modifica</button>

          <button class="action-btn delete-btn" type="button"
            onclick="deleteByCf('${cfEsc}')">🗑️ Elimina</button>

          <button class="action-btn info-btn" type="button"
            onclick="showInfoByCf('${cfEsc}')">ℹ️ Info</button>
        `;
      } else {
        const id = item.raw?.id;
        const idEsc = escapeHtml(String(id));
        actionsHtml = `
          <button class="action-btn approve-btn" type="button"
            onclick="approveUpdateRequest('${idEsc}')">✅ Approva</button>

          <button class="action-btn reject-btn" type="button"
            onclick="rejectUpdateRequest('${idEsc}')">❌ Rifiuta</button>

          <button class="action-btn info-btn" type="button"
            onclick="showUpdateInfo('${idEsc}')">ℹ️ Info</button>
        `;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(item.nome || "")}</td>
        <td>${escapeHtml(item.cognome || "")}</td>
        <td>${cfEsc}</td>
        <td>${escapeHtml(item.comitato || "")}</td>
        <td>${item.kind === "candidatura"
          ? `<span class="badge">Candidatura</span>`
          : item.dettaglio
        }</td>
        <td>${actionsHtml}</td>
      `;
      list.appendChild(row);
    });
  }

  searchInput.addEventListener("input", renderAttesa);

  window.addEventListener("storage", (e) => {
    if (!e) return;
    const keys = ["volontari-pubblici", "richieste-aggiornamenti-volontari", "volontari", "cri_last_update"];
    if (keys.includes(e.key)) renderAttesa();
  });
  window.addEventListener("pageshow", () => renderAttesa());
  window.addEventListener("focus", () => renderAttesa());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) renderAttesa(); });

  if ("BroadcastChannel" in window) {
    const bc = new BroadcastChannel("cri_updates");
    bc.addEventListener("message", (ev) => {
      if (ev?.data?.type === "refresh_dashboard") renderAttesa();
    });
    window.addEventListener("beforeunload", () => { try { bc.close(); } catch {} });
  }

  renderAttesa();
})();
