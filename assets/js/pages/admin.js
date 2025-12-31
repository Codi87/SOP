document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const comitato = localStorage.getItem("comitato") || "";

  // ✅ Accesso: SOP, Amministratore e SOL
  if (!userId || (role !== "sop" && role !== "amministratore" && role !== "sol")) {
    alert("Accesso riservato a SOP / SOL / Amministratore");
    window.location.href = "login.html";
    return;
  }

  const normalize = (s) => (s || "").toString().toLowerCase().trim();

  // ✅ LOGO (uguale a index.html)
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

  // Titolo
  const pageTitle = document.getElementById("page-title");
  if (role === "sop" || role === "amministratore") pageTitle.textContent = "⚙️ Area Admin - SOP Provinciale";
  if (role === "sol") pageTitle.textContent = `⚙️ Area Admin - SOL ${comitato}`;

  // Logout
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // ✅ MENU IDENTICO A index.html
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
  if (["sop","sol","amministratore","tlc_provinciale"].includes(role)) items.push({ text: "📡 TLC", href: "tlc.html" });
  if (["sop","sol","amministratore"].includes(role)) items.push({ text: "⚙️ Admin", href: "admin.html" });

  items.forEach(({ text, href }) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    if (href === "admin.html") a.classList.add("active");
    li.appendChild(a);
    menu.appendChild(li);
  });

  /* =========================
     STATISTICHE
  ========================= */
  const safeParse = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  };

  const myCom = normalize(comitato);

  // 1. Iscrizioni in attesa
  let iscrizioni = safeParse("volontari-pubblici", []);
  if (!Array.isArray(iscrizioni)) iscrizioni = [];
  if (role === "sol") iscrizioni = iscrizioni.filter(v => normalize(v?.comitato) === myCom);
  document.getElementById("num-iscrizioni").textContent = String(iscrizioni.length);

  // 2. Volontari
  let volontari = safeParse("volontari", []);
  if (!Array.isArray(volontari)) volontari = [];
  if (role === "sol") volontari = volontari.filter(v => normalize(v?.comitato) === myCom);
  document.getElementById("num-volontari").textContent = String(volontari.length);

  // 3. Mezzi
  let mezzi = safeParse("mezzi", []);
  if (!Array.isArray(mezzi)) mezzi = [];
  if (role === "sol") mezzi = mezzi.filter(m => normalize(m?.comitato) === myCom);
  document.getElementById("num-mezzi").textContent = String(mezzi.length);

  // 4. Materiali
  let materiali = safeParse("materiali", []);
  if (!Array.isArray(materiali)) materiali = [];
  if (role === "sol") materiali = materiali.filter(m => normalize(m?.comitato) === myCom);
  document.getElementById("num-materiali").textContent = String(materiali.length);

  // 5. Emergenze
  let emergenze = safeParse("emergenze", []);
  if (!Array.isArray(emergenze)) emergenze = [];
  if (role === "sol") emergenze = emergenze.filter(e => normalize(e?.comitato) === myCom);
  document.getElementById("num-emergenze").textContent = String(emergenze.length);

  // 6. Eventi
  let eventi = safeParse("eventi", []);
  if (!Array.isArray(eventi)) eventi = [];
  if (role === "sol") eventi = eventi.filter(e => normalize(e?.comitatoCreatore || e?.comitato || "") === myCom);
  document.getElementById("num-eventi").textContent = String(eventi.length);

  // 7. Timbrature TLC in attesa
  let timbratureTlc = safeParse("timbrature-tlc", []);
  if (!Array.isArray(timbratureTlc)) timbratureTlc = [];
  const timbratureInAttesa = timbratureTlc.filter(t => (t?.stato || "") === "attesa").length;
  document.getElementById("num-timbrature-tlc").textContent = String(timbratureInAttesa);

  // 8. Ore TLC approvate
  function calcolaOre(inizio, fine){
    if (!inizio || !fine) return 0;
    const [h1,m1] = String(inizio).split(":").map(Number);
    const [h2,m2] = String(fine).split(":").map(Number);
    if ([h1,m1,h2,m2].some(x => Number.isNaN(x))) return 0;
    const diffMin = (h2*60 + m2) - (h1*60 + m1);
    return Math.max(0, Math.floor(diffMin/60));
  }
  const totaleOreApprovate = timbratureTlc
    .filter(t => (t?.stato || "") === "approvato")
    .reduce((sum, t) => sum + calcolaOre(t?.inizio, t?.fine), 0);
  document.getElementById("totale-ore-tlc").textContent = String(totaleOreApprovate);

  /* =========================
     RUOLI (solo Admin)
  ========================= */
  const escapeHtml = (t) => (t == null ? "" : String(t).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m])));

  function normalizeRoleValue(r){
    const x = normalize(r);
    if (!x) return "volontario";
    if (x === "admin") return "amministratore";
    if (x === "tlc provinciale" || x === "tlc-provinciale" || x === "tlcprovinciale") return "tlc_provinciale";
    return x;
  }

  function cleanDisplayName(name){
    const cleaned = String(name || "").trim();
    if (!cleaned) return "";
    // ✅ FIX: se il nome è solo "_" / "-" / spazi (anche con caratteri invisibili) => Admin CRI
    const stripped = cleaned.replace(/[_\-\s]+/g, "");
    if (!stripped) return "Admin CRI";
    // fallback extra: se rimuovendo tutto ciò che non è lettera/numero resta vuoto => Admin CRI
    const alnum = cleaned.replace(/[^a-z0-9]+/gi, "");
    if (!alnum) return "Admin CRI";
    return cleaned;
  }

  function roleBadgeClass(r){
    const x = normalizeRoleValue(r);
    if (x === "amministratore") return "rb-admin";
    if (x === "sop") return "rb-sop";
    if (x === "tlc_provinciale") return "rb-tlc";
    if (x === "sol") return "rb-sol";
    return "";
  }
  function roleLabel(r){
    const x = normalizeRoleValue(r);
    if (x === "amministratore") return "ADMIN";
    if (x === "sop") return "SOP";
    if (x === "tlc_provinciale") return "TLCP";
    if (x === "sol") return "SOL";
    return "Volontario";
  }

  const ruoloMapKey = "cri_ruoli_map";
  function loadRuoliMap(){ return safeParse(ruoloMapKey, {}) || {}; }
  function saveRuoliMap(m){ localStorage.setItem(ruoloMapKey, JSON.stringify(m || {})); }

  function pickId(obj){
    return ((obj?.cf || obj?.userId || obj?.username || obj?.email || obj?.id || "") + "").toUpperCase().trim();
  }
  function pickNome(obj){
    const raw = (`${obj?.nome || ""} ${obj?.cognome || ""}`.trim()) ||
                (obj?.nomeCompleto || obj?.name || obj?.displayName || "_");
    return cleanDisplayName(raw) || "—";
  }
  function pickComitato(obj){
    return obj?.comitato || obj?.comitatoCreatore || obj?.comitatoEvento || obj?.comitato_volontario || obj?.comitatoVolontario || obj?.comitatoOrigine || obj?.comitato_origine || "—";
  }
  function pickRawRole(obj){
    return obj?.ruolo || obj?.role || obj?.ruoloSistema || obj?.ruoloUtente || obj?.privilegio || obj?.permessi || "";
  }

  // scan robusto: array o object in localStorage con role non volontario
  function scanLocalStorageForUsers(){
    const out = [];
    for (let i=0; i<localStorage.length; i++){
      const k = localStorage.key(i);
      if (!k) continue;
      if (/^(mezzi|materiali|eventi|emergenze|timbrature|volontari|volontari-pubblici|cri_ruoli_map|approvazioni)/i.test(k)) continue;

      const val = safeParse(k, null);
      if (!val) continue;

      if (Array.isArray(val)){
        val.forEach(x => {
          if (!x || typeof x !== "object") return;
          const rid = pickId(x);
          const rr = normalizeRoleValue(pickRawRole(x));
          if (rid && rr !== "volontario") out.push(x);
        });
      } else if (typeof val === "object"){
        const rid = pickId(val);
        const rr = normalizeRoleValue(pickRawRole(val));
        if (rid && rr !== "volontario") out.push(val);
      }
    }
    return out;
  }

  function collectRoleHolders(){
    const volontariAll = safeParse("volontari", []) || [];
    const rolesMap = loadRuoliMap();

    const candidates = [
      ...volontariAll,
      ...scanLocalStorageForUsers()
    ];

    // aggiungi sempre utente corrente
    candidates.push({
      userId,
      nomeCompleto: localStorage.getItem("nomeCompleto") || "",
      comitato,
      role
    });

    const byId = new Map();

    candidates.forEach(obj => {
      const id = pickId(obj);
      if (!id) return;

      const mapEntry = rolesMap[id] || {};
      const raw = normalizeRoleValue(mapEntry.ruolo || pickRawRole(obj) || obj?.role || "");
      const nomeFromMap = cleanDisplayName(mapEntry.nome);
      const nome = nomeFromMap || pickNome(obj);
      const com  = mapEntry.comitato || pickComitato(obj);

      const prev = byId.get(id);
      const nowSpecial = raw !== "volontario";
      if (!prev){
        byId.set(id, { id, nome, comitato: com, rawRuolo: raw });
        return;
      }
      const prevSpecial = prev.rawRuolo !== "volontario";
      if (nowSpecial && !prevSpecial){
        byId.set(id, { id, nome, comitato: com, rawRuolo: raw });
        return;
      }
      // arricchisci dati
      byId.set(id, {
        id,
        nome: (prev.nome && prev.nome !== "—") ? prev.nome : nome,
        comitato: (prev.comitato && prev.comitato !== "—") ? prev.comitato : com,
        rawRuolo: prev.rawRuolo
      });
    });

    const allowed = new Set(["sol","sop","amministratore","tlc_provinciale"]);
    const order = { amministratore: 0, sop: 1, tlc_provinciale: 2, sol: 3 };

    return Array.from(byId.values())
      .filter(x => allowed.has(x.rawRuolo))
      .sort((a,b) => (order[a.rawRuolo] ?? 99) - (order[b.rawRuolo] ?? 99)
                  || String(a.comitato).localeCompare(String(b.comitato))
                  || String(a.nome).localeCompare(String(b.nome)));
  }

  const cardRuoli = document.getElementById("card-ruoli");
  const btnApriRuoli = document.getElementById("btn-apri-ruoli");
  const numRuoliEl = document.getElementById("num-ruoli-speciali");

  const ruoliPopup = document.getElementById("ruoli-popup");
  const ruoliClose = document.getElementById("ruoli-close");
  const ruoliBody = document.getElementById("ruoli-body");
  const ruoliSummary = document.getElementById("ruoli-summary");
  const ruoliEmptyHint = document.getElementById("ruoli-empty-hint");

  function openRuoli(){
    ruoliPopup.classList.add("active");
    ruoliPopup.setAttribute("aria-hidden","false");
  }
  function closeRuoli(){
    ruoliPopup.classList.remove("active");
    ruoliPopup.setAttribute("aria-hidden","true");
  }

  function applySelectColor(sel, ruolo){
    const r = normalizeRoleValue(ruolo);
    sel.classList.remove("role-amministratore","role-sop","role-tlc_provinciale","role-sol");
    sel.classList.add("role-" + r);
  }

  function updateRoleForId(id, newRole){
    const rolesMap = loadRuoliMap();
    const rid = (id || "").toUpperCase().trim();
    const r = normalizeRoleValue(newRole);

    if (r === "volontario"){
      delete rolesMap[rid];
    } else {
      const volontariAll = safeParse("volontari", []) || [];
      const v = volontariAll.find(x => (pickId(x) === rid)) || null;

      rolesMap[rid] = {
        ruolo: r,
        nome: cleanDisplayName(pickNome(v || { userId: rid })) || "—",
        comitato: (v ? pickComitato(v) : (rolesMap[rid]?.comitato || comitato || "—"))
      };
    }
    saveRuoliMap(rolesMap);

    // compatibilità: se è in volontari, aggiorna anche lì
    const volontariAll = safeParse("volontari", []) || [];
    const idx = volontariAll.findIndex(x => pickId(x) === rid);
    if (idx !== -1){
      if (r === "volontario"){
        delete volontariAll[idx].ruolo;
        delete volontariAll[idx].role;
      } else {
        volontariAll[idx].ruolo = r;
        volontariAll[idx].role = r;
      }
      localStorage.setItem("volontari", JSON.stringify(volontariAll));
    }
  }

  function renderRuoliPopup(){
    const list = collectRoleHolders();

    if (numRuoliEl) numRuoliEl.textContent = String(list.length);

    const counts = { amministratore:0, sop:0, tlc_provinciale:0, sol:0 };
    list.forEach(x => { if (counts[x.rawRuolo] != null) counts[x.rawRuolo]++; });

    if (ruoliSummary){
      ruoliSummary.textContent = `ADMIN: ${counts.amministratore} • SOP: ${counts.sop} • TLC PROV: ${counts.tlc_provinciale} • SOL: ${counts.sol}`;
    }

    if (!list.length){
      ruoliBody.innerHTML = `<tr><td colspan="4" style="color:#666;">Nessun ruolo speciale assegnato.</td></tr>`;
      if (ruoliEmptyHint) ruoliEmptyHint.style.display = "block";
      return;
    }
    if (ruoliEmptyHint) ruoliEmptyHint.style.display = "none";

    const roleOptions = [
      { value: "amministratore", label: "Admin" },
      { value: "sop", label: "SOP" },
      { value: "tlc_provinciale", label: "TLC Provinciale" },
      { value: "sol", label: "SOL" },
      { value: "volontario", label: "Volontario (nessun privilegio)" }
    ];

    ruoliBody.innerHTML = list.map(u => {
      const r = normalizeRoleValue(u.rawRuolo);
      const badgeCls = roleBadgeClass(r);
      const rowCls = `ruolo-row ${r}`;
      const nameRaw = cleanDisplayName(u.nome) || u.nome || "—";
      const name = (r === "amministratore" && cleanDisplayName(nameRaw) === "Admin CRI") ? "Admin CRI" : nameRaw;

      return `
        <tr class="${rowCls}" data-id="${escapeHtml(u.id)}">
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(u.comitato)}</td>
          <td>
            <span class="role-badge ${badgeCls}" style="margin-right:8px;">${escapeHtml(roleLabel(r))}</span>
            <select class="select-role"></select>
          </td>
          <td>
            <button type="button" class="btn-small" data-action="save">Salva</button>
          </td>
        </tr>
      `;
    }).join("");

    // inserisci options e colori
    ruoliBody.querySelectorAll("tr").forEach(tr => {
      const id = tr.getAttribute("data-id");
      const u = list.find(x => x.id === id) || null;
      const sel = tr.querySelector("select");
      if (!sel || !u) return;

      sel.innerHTML = roleOptions.map(o => {
        const selected = normalizeRoleValue(o.value) === normalizeRoleValue(u.rawRuolo) ? "selected" : "";
        return `<option value="${o.value}" ${selected}>${o.label}</option>`;
      }).join("");

      applySelectColor(sel, u.rawRuolo);
      sel.addEventListener("change", () => applySelectColor(sel, sel.value));
    });

    ruoliBody.querySelectorAll("button[data-action='save']").forEach(btn => {
      btn.addEventListener("click", () => {
        const tr = btn.closest("tr");
        if (!tr) return;
        const id = tr.getAttribute("data-id");
        const sel = tr.querySelector("select");
        const val = sel ? sel.value : "volontario";
        updateRoleForId(id, val);
        renderRuoliPopup();
      });
    });
  }

  // Attiva card + popup solo se amministratore
  if (role === "amministratore"){
    if (cardRuoli) cardRuoli.style.display = "flex";
    if (btnApriRuoli) btnApriRuoli.addEventListener("click", () => { renderRuoliPopup(); openRuoli(); });

    if (ruoliClose) ruoliClose.addEventListener("click", closeRuoli);
    if (ruoliPopup) ruoliPopup.addEventListener("click", (e) => { if (e.target === ruoliPopup) closeRuoli(); });

    // primo conteggio
    renderRuoliPopup();
  } else {
    if (cardRuoli) cardRuoli.style.display = "none";
  }
});
