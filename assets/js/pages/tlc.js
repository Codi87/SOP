document.addEventListener("DOMContentLoaded", () => {
  const userId = (localStorage.getItem("userId") || "").toUpperCase();
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const comitatoOperatore = (localStorage.getItem("comitato") || "");

  if (!userId) {
    alert("Devi effettuare il login");
    window.location.href = "login.html";
    return;
  }

  // ✅ In TLC: logo sempre TLC per tutti (come richiesto)
  const logoImg = document.getElementById("logo-cri");
  if (logoImg) {
    logoImg.src = "logo-tlc.svg";
    logoImg.onerror = () => { logoImg.src = "logo.svg"; };
  }

  // ---- Dati base ----
  const volontari = JSON.parse(localStorage.getItem("volontari") || "[]");
  const me = volontari.find(v => (v.cf || "").toUpperCase() === userId) || null;
  const mieQualifiche = me?.qualifiche || [];

  const isVolontario = role === "volontario";
  const isOperatoreTlcVol = isVolontario && (mieQualifiche.includes("TLC 1") || mieQualifiche.includes("TLC 2") || (mieQualifiche.includes("TLC 1") || mieQualifiche.includes("TLC 2") || mieQualifiche.includes("OPERATORE TLC")));
  const tlcQualLabel = mieQualifiche.includes("TLC 2") ? "TLC 2" : (mieQualifiche.includes("TLC 1") ? "TLC 1" : "OPERATORE TLC");

  // ✅ Approva solo: amministratore o tlc provinciale
  const approverRoles = ["amministratore", "tlc_provinciale"];
  const viewerRoles = ["sop", "sol"];
  const isApprover = approverRoles.includes(role);
  const isViewer = viewerRoles.includes(role);

  const canViewTlc = isApprover || isViewer || isOperatoreTlcVol;
  if (!canViewTlc) {
    alert("Accesso negato: non hai i permessi TLC");
    window.location.href = isVolontario ? "index-volontario.html" : "index.html";
    return;
  }

  // ---- Menu (ALLINEATO A INDEX + Admin per ruoli abilitati) ----
  const menu = document.getElementById("menu-sidebar");
  menu.innerHTML = "";

  const menuVol = [
  { text: "🏠 Home", href: "index-volontario.html" },
  { text: "📋 Mia Anagrafica", href: "anagrafica-volontario.html" },
  { text: "📅 Eventi", href: "eventi-volontario.html" }
];

  const items = [];

  if (isVolontario) {
    items.push(...menuVol);
    // ✅ TLC visibile ai volontari SOLO se hanno TLC 1 o TLC 2 (come prima)
    if (isOperatoreTlcVol) {
      items.push({ text: "📡 TLC", href: "tlc.html" });
    }
  } else {
    // stesso ordine/voci di index
    items.push(
      { text: "🏠 Home", href: "index.html" },
      { text: "✅ Approvazioni", href: "iscrizioni-in-attesa.html" },
      { text: "👥 Volontari", href: "volontari.html" },
      { text: "🚗 Mezzi", href: "mezzi.html" },
      { text: "📦 Materiali", href: "materiali.html" },
      { text: "🚨 Emergenze", href: "emergenze.html" },
      { text: "📅 Eventi", href: "eventi.html" },
      { text: "📄 Documenti", href: "documenti.html" }
    );

    // TLC: come index
    if (["sop", "sol", "amministratore", "tlc_provinciale"].includes(role)) {
      items.push({ text: "📡 TLC", href: "tlc.html" });
    }

    // ✅ Admin: aggiunto come richiesto, con gli stessi requisiti di index
    if (["sop", "sol", "amministratore"].includes(role)) {
      items.push({ text: "⚙️ Admin", href: "admin.html" });
    }
  }

  items.forEach(it => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = it.href;
    a.textContent = it.text;
    if (it.href === "tlc.html") a.classList.add("active");
    li.appendChild(a);
    menu.appendChild(li);
  });

  // ✅ Logout identico a index
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // ---- UI header ----
  const welcome = document.getElementById("welcome-tlc");
  const ruoloInfo = document.getElementById("ruolo-info");
  const noteBox = document.getElementById("note-box");

  if (isApprover) {
    welcome.textContent = `Benvenuto - Area TLC (Approvatore ore)`;
    ruoloInfo.innerHTML = `<strong>Ruolo:</strong> ${role.toUpperCase()}<br><strong>Permessi:</strong> approva/rifiuta timbrature`;
    noteBox.style.display = "block";
    noteBox.textContent = "✅ Puoi approvare o rifiutare le timbrature TLC in stato 'attesa'.";
  } else if (isViewer) {
    welcome.textContent = `Benvenuto - Area TLC (Visualizzazione)`;
    ruoloInfo.innerHTML = `<strong>Ruolo:</strong> ${role.toUpperCase()}<br><strong>Permessi:</strong> sola visualizzazione`;
    noteBox.style.display = "block";
    noteBox.textContent = "ℹ️ Puoi vedere le timbrature, ma non puoi approvare ore (solo Amministratore / TLC Provinciale).";
  } else {
    const name = `${me?.nome || ""} ${me?.cognome || ""}`.trim() || "Operatore";
    welcome.textContent = `Benvenuto ${name} - Area Telecomunicazioni CRI`;
    ruoloInfo.innerHTML = `<strong>Ruolo:</strong> VOLONTARIO<br><strong>Qualifica:</strong> ${tlcQualLabel}`;
  }

  const inserimento = document.getElementById("inserimento-timbratura");
  const toolbarAdmin = document.getElementById("toolbar-admin");
  inserimento.style.display = (isOperatoreTlcVol ? "block" : "none");
  toolbarAdmin.style.display = (isApprover ? "flex" : "none");

  function loadTimbrature() { return JSON.parse(localStorage.getItem("timbrature-tlc") || "[]"); }
  function saveTimbrature(arr) { localStorage.setItem("timbrature-tlc", JSON.stringify(arr)); }

  function minutesBetween(inizio, fine) {
    if (!inizio || !fine) return 0;
    const [h1, m1] = inizio.split(":").map(Number);
    const [h2, m2] = fine.split(":").map(Number);
    let start = h1 * 60 + m1;
    let end = h2 * 60 + m2;
    let diff = end - start;
    if (diff < 0) diff += 24 * 60;
    return diff;
  }
  function formatHM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${String(m).padStart(2,"0")}m`;
  }
  function getComitatoByCf(cfUpper) {
    const v = volontari.find(x => (x.cf || "").toUpperCase() === (cfUpper || "").toUpperCase());
    return v?.comitato || "";
  }
  function getNomeByCf(cfUpper) {
    const v = volontari.find(x => (x.cf || "").toUpperCase() === (cfUpper || "").toUpperCase());
    if (!v) return cfUpper;
    return `${v.nome || ""} ${v.cognome || ""}`.trim() || cfUpper;
  }

  function buildComitatoFilter() {
    const sel = document.getElementById("filtro-comitato");
    if (!sel) return;
    const comitati = Array.from(new Set(volontari.map(v => (v.comitato || "").trim()).filter(Boolean))).sort();
    sel.innerHTML = `<option value="ALL">Tutti</option>` + comitati.map(c => `<option value="${c}">${c}</option>`).join("");
  }
  if (isApprover) buildComitatoFilter();

  const lista = document.getElementById("lista-timbrature-tlc");
  const totale = document.getElementById("totale-ore-tlc");
  const oreBox = document.getElementById("ore-tlc-svolte");
  const oreLabel = document.getElementById("ore-label");
  const titolo = document.getElementById("timbrature-title");

  function getVisibleTimbrature(all) {
    if (isOperatoreTlcVol) return all.filter(t => (t.utente || "").toUpperCase() === userId);

    if (isViewer) {
      const c = (comitatoOperatore || "").toLowerCase();
      if (!c || c === "tutti") return all;
      return all.filter(t => ((t.comitato || getComitatoByCf(t.utente)) || "").toLowerCase() === c);
    }

    if (isApprover) {
      const filtroCom = (document.getElementById("filtro-comitato")?.value || "ALL");
      const filtroStato = (document.getElementById("filtro-stato")?.value || "ALL");
      return all.filter(t => {
        const com = (t.comitato || getComitatoByCf(t.utente) || "");
        const okCom = (filtroCom === "ALL") ? true : com === filtroCom;
        const okStato = (filtroStato === "ALL") ? true : (t.stato === filtroStato);
        return okCom && okStato;
      });
    }
    return all;
  }

  function calcApprovedMinutes(allVisible) {
    return allVisible
      .filter(t => t.stato === "approvato")
      .reduce((sum, t) => sum + minutesBetween(t.inizio, t.fine), 0);
  }

  function render() {
    const all = loadTimbrature();

    if (isOperatoreTlcVol) titolo.textContent = "⏱️ Le mie timbrature TLC";
    else if (isApprover) titolo.textContent = "⏱️ Timbrature TLC - Approvazioni";
    else titolo.textContent = "⏱️ Timbrature TLC - Visualizzazione";

    const vis = getVisibleTimbrature(all);

    const approvedMin = calcApprovedMinutes(vis);
    oreBox.textContent = (approvedMin / 60).toFixed(2);
    oreLabel.textContent = "ore totali approvate";
    totale.textContent = `${(approvedMin / 60).toFixed(2)} ore totali approvate (${formatHM(approvedMin)})`;

    if (!vis.length) {
      lista.innerHTML = `
        <li class="timbratura-item attesa">
          <div class="timbratura-tipo">Nessuna timbratura</div>
          <div class="timbratura-dettagli">Non ci sono dati da mostrare.</div>
          <span class="badge attesa">VUOTO</span>
        </li>`;
      return;
    }

    const sorted = [...vis].sort((a,b) => String(b.data||"").localeCompare(String(a.data||"")));

    lista.innerHTML = sorted.map(t => {
      const com = t.comitato || getComitatoByCf(t.utente);
      const nome = getNomeByCf((t.utente || "").toUpperCase());
      const min = minutesBetween(t.inizio, t.fine);
      const hm = formatHM(min);
      const statoClass = t.stato || "attesa";

      const headerExtra = (isOperatoreTlcVol)
        ? ``
        : `<div style="margin-top:6px;color:#555;font-weight:700;">👤 ${nome} • 🏢 ${com || "—"}</div>`;

      const azioni = (isApprover && statoClass === "attesa")
        ? `
          <button class="btn-azione approva" type="button" onclick="approvaTimbratura(${t.id})">✅ Approva</button>
          <button class="btn-azione rifiuta" type="button" onclick="rifiutaTimbratura(${t.id})">❌ Rifiuta</button>
        `
        : ``;

      return `
        <li class="timbratura-item ${statoClass}">
          <div class="timbratura-tipo">${t.tipo || "Timbratura TLC"}</div>
          ${headerExtra}
          <div class="timbratura-dettagli">
            📍 ${t.luogo || ""} <br>
            📅 ${t.data || ""} • 🕐 ${t.inizio || ""} - ${t.fine || ""} • ⏱️ ${hm}
          </div>
          <span class="badge ${statoClass}">${String(statoClass).toUpperCase()}</span>
          ${azioni}
        </li>
      `;
    }).join("");
  }

  window.approvaTimbratura = function(id) {
    if (!isApprover) return;
    const all = loadTimbrature();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return;
    all[idx].stato = "approvato";
    saveTimbrature(all);
    render();
  };

  window.rifiutaTimbratura = function(id) {
    if (!isApprover) return;
    const all = loadTimbrature();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return;
    all[idx].stato = "rifiutato";
    saveTimbrature(all);
    render();
  };

  const form = document.getElementById("form-timbratura-tlc");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!isOperatoreTlcVol) return;

      const data = document.getElementById("data-tlc").value;
      const inizio = document.getElementById("ora-inizio-tlc").value;
      const fine = document.getElementById("ora-fine-tlc").value;
      const luogo = document.getElementById("luogo-tlc").value.trim();
      const tipo = document.getElementById("tipo-tlc").value.trim();

      if (!data || !inizio || !fine || !luogo || !tipo) return;

      const nuovo = {
        id: Date.now(),
        utente: userId,
        comitato: me?.comitato || "",
        data, inizio, fine, luogo, tipo,
        stato: "attesa"
      };

      const all = loadTimbrature();
      all.push(nuovo);
      saveTimbrature(all);
      form.reset();
      render();
    });
  }

  if (isApprover) {
    document.getElementById("filtro-comitato")?.addEventListener("change", render);
    document.getElementById("filtro-stato")?.addEventListener("change", render);
  }

  render();
});
