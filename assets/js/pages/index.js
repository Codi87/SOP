if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("✅ Service Worker registrato"))
    .catch(err => console.error("❌ Errore Service Worker:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const comitato = localStorage.getItem("comitato") || "";
  const nomeCompleto = localStorage.getItem("nomeCompleto") || "";

  if (!userId) {
    alert("Devi effettuare il login");
    window.location.href = "login.html";
    return;
  }

  // --- helpers robusti ---
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

  // supporta JSON come:
  // - []
  // - { list: [] } / { lista: [] } / { data: [] } / { items: [] }
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "object") {
      if (Array.isArray(val.list)) return val.list;
      if (Array.isArray(val.lista)) return val.lista;
      if (Array.isArray(val.items)) return val.items;
      if (Array.isArray(val.data)) return val.data;
      if (Array.isArray(val.results)) return val.results;
    }
    return [];
  };

  // prova più chiavi finché ne trova una "non vuota"
  const readFirstNonEmpty = (keys) => {
    for (const k of keys) {
      const v = safeParse(k, null);
      const arr = toArray(v);
      if (arr.length) return arr;
    }
    return [];
  };

  const getItemComitato = (obj) => {
    if (!obj || typeof obj !== "object") return "";
    return (
      obj.comitato ||
      obj.comitatoCreatore ||
      obj.comitatoEvento ||
      obj.comitato_emergenza ||
      obj.comitatoRichiedente ||
      obj.comitatoDestinatario ||
      obj.comitatoVolontario ||
      obj.comitato_volontario ||
      obj.comitatoOrigine ||
      obj.comitato_origine ||
      ""
    );
  };

  // per SOL: mostra solo il proprio comitato, MA non scartare record senza comitato (evita "sparizioni")
  const filtraPerComitato = (arr) => {
    const a = arr || [];
    if (role !== "sol") return a;
    const my = normalize(comitato);
    return a.filter(x => {
      const c = normalize(getItemComitato(x));
      return !c || c === my; // ✅ se manca comitato lo tengo
    });
  };

  const formatDataIt = (yyyyMMdd) => {
    if (!yyyyMMdd) return "";
    const s = String(yyyyMMdd);
    const [y, m, d] = s.split("-");
    if (!y || !m || !d) return s;
    return `${d}/${m}/${y}`;
  };

  // --- LOGO ---
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

  // --- TITOLO ---
  const titoloHome = document.getElementById("titolo-home");
  if (role === "sop" || role === "amministratore") {
    titoloHome.textContent = "👑 Dashboard SOP Provinciale";
  } else if (role === "sol") {
    titoloHome.textContent = `🎯 Dashboard SOL ${comitato}`;
  } else if (role === "tlc_provinciale") {
    titoloHome.textContent = "📡 Dashboard TLC Provinciale";
  } else {
    titoloHome.textContent = nomeCompleto ? `Benvenuto ${nomeCompleto}` : "Benvenuto";
  }

  // --- MENU ---
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
    if (href === "index.html") a.classList.add("active");
    li.appendChild(a);
    menu.appendChild(li);
  });

  // --- COPIA LINK (solo SOP / SOL) ---
  const btnCopiaLink = document.getElementById("btn-copia-link");
  if (role === "sop" || role === "sol" || role === "tlc_provinciale") {
    btnCopiaLink.style.display = "inline-block";

        const comitatoLink = (role === "sop") ? "sop" : (role === "tlc_provinciale" ? "tlc" : ((comitato || "pesaro").toLowerCase()));
    const base = new URL(".", window.location.href).toString();
    const linkCompilazione = `${base}aggiungi-volontario-pubblico.html?comitato=${encodeURIComponent(comitatoLink)}`;

    btnCopiaLink.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(linkCompilazione);
        btnCopiaLink.textContent = "✅ Copiato!";
        btnCopiaLink.classList.add("copiato");
        setTimeout(() => {
          btnCopiaLink.textContent = "🔗 Copia link compilazione";
          btnCopiaLink.classList.remove("copiato");
        }, 2000);
      } catch {
        alert("Impossibile copiare negli appunti.\nLink:\n" + linkCompilazione);
      }
    });
  }

  // --- APPROVAZIONI: candidature + richieste aggiornamento qualifiche/patenti ---
  const isPendingCandidate = (v) => {
    const stato = normalize(v?.stato || v?.statoApprovazione || v?.status || "");
    if (stato === "approvato" || stato === "approved") return false;
    if (stato === "eliminato" || stato === "deleted" || stato === "rifiutato" || stato === "rejected") return false;
    return true; // se è in volontari-pubblici lo considero in attesa
  };

  const isPendingUpdateRequest = (r) => {
    // richieste aggiornamento (qualifiche/patenti) -> default pending se non specificato
    const stato = normalize(r?.stato || r?.status || "pending");
    return stato === "pending" || stato === "in_attesa" || stato === "in attesa";
  };

  function getPendingUpdateRequests() {
    // chiavi "robuste" (se un domani cambi nome)
    const raw = readFirstNonEmpty([
      "richieste-aggiornamenti-volontari",
      "richiesteAggiornamentiVolontari",
      "richieste_aggiornamenti_volontari",
      "richieste-aggiornamenti",
      "richiesteAggiornamenti"
    ]);

    // attese + filtri
    let req = toArray(raw).filter(x => x && typeof x === "object");
    req = filtraPerComitato(req);
    req = req.filter(isPendingUpdateRequest);

    return req;
  }

  // --- rendering ---
  function refreshDashboard() {
    // 1) candidature in attesa
    const volontariPubblici = toArray(safeParse("volontari-pubblici", []));
    const pendingCandidates = filtraPerComitato(volontariPubblici).filter(isPendingCandidate);

    // 2) richieste aggiornamento qualifiche/patenti in attesa
    const pendingUpdates = getPendingUpdateRequests();

    // totale
    const totalPending = pendingCandidates.length + pendingUpdates.length;

    const numEl = document.getElementById("num-approvazioni");
    const breakdownEl = document.getElementById("approvazioni-breakdown");

    numEl.textContent = totalPending;

    // breakdown (mostralo solo se ha senso)
    if (pendingUpdates.length > 0) {
      breakdownEl.textContent = `(${pendingCandidates.length} candidature, ${pendingUpdates.length} aggiornamenti qualifiche/patenti)`;
    } else {
      breakdownEl.textContent = pendingCandidates.length > 0 ? `(${pendingCandidates.length} candidature)` : "";
    }

    // VOLONTARI / MEZZI / MATERIALI
    const volontari = toArray(safeParse("volontari", []));
    document.getElementById("num-volontari").textContent = filtraPerComitato(volontari).length;

    const mezzi = toArray(safeParse("mezzi", []));
    document.getElementById("num-mezzi").textContent = filtraPerComitato(mezzi).length;

    const materiali = toArray(safeParse("materiali", []));
    document.getElementById("num-materiali").textContent = filtraPerComitato(materiali).length;

    // EMERGENZE (supporto più chiavi)
    const emergenzeRaw = readFirstNonEmpty([
      "emergenze",
      "emergenze_attive",
      "emergenzeAttive",
      "emergenze-in-corso",
      "lista-emergenze",
      "emergenzeList"
    ]);
    const emergenze = filtraPerComitato(emergenzeRaw);

    const emergenzeDiv = document.getElementById("emergenze-in-corso");
    emergenzeDiv.innerHTML = emergenze.length
      ? emergenze.slice(0, 3).map(e => {
          const tipo = e.tipo || e.titolo || "Emergenza";
          const luogo = e.luogo || e.localita || e.comune || "";
          const data = e.data || e.dataInizio || e.dataEmergenza || "";
          const ora = e.ora || e.oraInizio || "";
          const when = [data, ora].filter(Boolean).join(" ");
          return `
            <div class="list-item">
              <strong>${tipo}</strong><br>
              <small>${luogo}${when ? " - " + when : ""}</small>
            </div>
          `;
        }).join("")
      : '<p class="empty-state">Nessuna emergenza attiva</p>';

    // EVENTI (supporto più chiavi)
    const eventiRaw = readFirstNonEmpty([
      "eventi",
      "eventi_prossimi",
      "eventiProssimi",
      "lista-eventi",
      "eventiList",
      "eventiLista"
    ]);
    const eventi = filtraPerComitato(eventiRaw).slice().sort((a, b) => {
      const aDate = (a.dataInizio || a.data || a.dataEvento || "") + "T" + (a.oraInizio || a.ora || "00:00");
      const bDate = (b.dataInizio || b.data || b.dataEvento || "") + "T" + (b.oraInizio || b.ora || "00:00");
      return aDate.localeCompare(bDate);
    });

    const eventiDiv = document.getElementById("eventi-brevi");
    eventiDiv.innerHTML = eventi.length
      ? eventi.slice(0, 3).map(e => {
          const titolo = e.titolo || e.nome || "Evento";
          const luogo = e.luogo || e.localita || e.comune || "";
          const data = e.dataInizio || e.data || e.dataEvento || "";
          const ora = e.oraInizio || e.ora || "";
          const dataIt = String(data).includes("-") ? formatDataIt(data) : data;
          return `
            <div class="list-item">
              <strong>${titolo}</strong><br>
              <small>${dataIt} ${ora || ""}${luogo ? " - " + luogo : ""}</small>
            </div>
          `;
        }).join("")
      : '<p class="empty-state">Nessun evento programmato</p>';
  }

  refreshDashboard();

  // refresh quando torni alla home / cambi tab
  window.addEventListener("pageshow", refreshDashboard);
  window.addEventListener("focus", refreshDashboard);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshDashboard(); });

  // refresh quando un'altra pagina aggiorna localStorage
  window.addEventListener("storage", (e) => {
    if (!e) return;
    if (
      e.key === "volontari-pubblici" ||
      e.key === "volontari" ||
      e.key === "mezzi" ||
      e.key === "materiali" ||
      e.key === "emergenze" ||
      e.key === "eventi" ||
      e.key === "cri_last_update" ||
      e.key === "richieste-aggiornamenti-volontari" ||
      e.key === "richiesteAggiornamentiVolontari" ||
      e.key === "richieste_aggiornamenti_volontari"
    ) {
      refreshDashboard();
    }
  });

  // BroadcastChannel
  if ("BroadcastChannel" in window) {
    const bc = new BroadcastChannel("cri_updates");
    bc.addEventListener("message", (ev) => {
      if (ev?.data?.type === "refresh_dashboard") refreshDashboard();
    });
    window.addEventListener("beforeunload", () => { try { bc.close(); } catch {} });
  }

  // LOGOUT
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});
