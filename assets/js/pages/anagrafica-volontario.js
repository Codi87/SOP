document.addEventListener("DOMContentLoaded", () => {
  const userId = (localStorage.getItem("userId") || "").toUpperCase();
  const role = (localStorage.getItem("role") || "").toLowerCase();

  if (!userId || role !== "volontario") {
    alert("Accesso negato");
    window.location.href = "login.html";
    return;
  }

  const volontari = JSON.parse(localStorage.getItem('volontari') || "[]");
  const volontario = volontari.find(v => ((v.cf || "") + "").toUpperCase() === userId);

  if (!volontario) {
    alert("Dati volontario non trovati");
    window.location.href = "login.html";
    return;
  }

  function normalize(s){ return (s || "").toLowerCase().trim(); }
  function uniq(arr){ return Array.from(new Set((arr || []).filter(Boolean))); }


  if (window.App && App.qualifiche && App.qualifiche.attachTooltips){
    App.qualifiche.attachTooltips({ labelsSelector: ".qualifiche-container label", inputSelector: "input.qualifica-checkbox" });
  }
  function showMsg(html){
    document.getElementById("message").innerHTML = html;
    window.scrollTo(0, 0);
    setTimeout(() => { document.getElementById("message").innerHTML = ""; }, 4500);
  }

  // ✅ LOGO DINAMICO
  const logoImg = document.getElementById("logo-volontario");
  const comitatoVolontario = normalize(volontario.comitato || "");
  const logoMap = {
    'pesaro': 'logo-pesaro.svg',
    'urbino': 'logo-urbino.svg',
    'fano': 'logo-fano.svg',
    'pergola': 'logo-pergola.svg',
    'marotta-mondolfo': 'logo-marotta-mondolfo.svg',
    'fossombrone': 'logo-fossombrone.svg',
    'cagli': 'logo-cagli.svg',
    'montelabbate': 'logo-montelabbate.svg',
    'fermignano': 'logo-fermignano.svg',
    "sant'angelo in vado": 'logo-santangeloinvado.svg',
    'santangelo in vado': 'logo-santangeloinvado.svg',
    'sant-angelo-in-vado': 'logo-santangeloinvado.svg'
  };
  logoImg.src = logoMap[comitatoVolontario] || 'logo-sop.svg';

  // ✅ VOCE TLC SE QUALIFICATO (solo se già validata o pending? qui solo validata)
  const menu = document.querySelector(".menu");
  const qualificheValid = uniq((volontario.qualifiche || []).map(q => (window.App && App.qualifiche ? App.qualifiche.normalize(q) : q)));
  if (qualificheValid.some(q => (q === "TLC 1" || q === "TLC 2"))) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "tlc.html";
    a.textContent = "📡 TLC";
    li.appendChild(a);
    menu.appendChild(li);
  }

  // blocco campi per volontario
  const lockedIds = ["nome","cognome","luogoNascita","dataNascita","email","codiceMGO","comitato","cf"];
  lockedIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("readonly", "readonly");
  });

  // Popola campi
  document.getElementById("nome").value = volontario.nome || "";
  document.getElementById("cognome").value = volontario.cognome || "";
  document.getElementById("cf").value = volontario.cf || "";
  document.getElementById("telefono").value = volontario.telefono || "";
  document.getElementById("contattoEmergenza").value = volontario.contattoEmergenza || "";
  document.getElementById("luogoNascita").value = volontario.luogoNascita || "";
  document.getElementById("dataNascita").value = volontario.dataNascita || "";
  document.getElementById("stato").value = volontario.stato || "";
  document.getElementById("indirizzo").value = volontario.indirizzo || "";
  document.getElementById("comune").value = volontario.comune || "";
  document.getElementById("provincia").value = volontario.provincia || "";
  document.getElementById("cap").value = volontario.cap || "";
  document.getElementById("comitato").value = volontario.comitato || "";
  document.getElementById("intolleranze").value = volontario.intolleranze || "";
  document.getElementById("allergie").value = volontario.allergie || "";
  document.getElementById("codiceMGO").value = volontario.codiceMGO || "";
  document.getElementById("email").value = volontario.email || "";

  // snapshot "validati" al caricamento
  const originalQualifiche = new Set(uniq((volontario.qualifiche || []).map(q => (window.App && App.qualifiche ? App.qualifiche.normalize(q) : q))));
  const originalPatenti = new Set(uniq(volontario.patenti || []));

  // pending (in approvazione)
  const pendingQual = new Set(uniq(volontario.pendingQualificheAdd || []));
  const pendingPat  = new Set(uniq(volontario.pendingPatentiAdd || []));

  // mostra box pending
  const pendingParts = [];
  if (pendingQual.size) pendingParts.push(`📋 <b>Qualifiche in approvazione:</b> ${Array.from(pendingQual).join(", ")}`);
  if (pendingPat.size) pendingParts.push(`🚗 <b>Patenti in approvazione:</b> ${Array.from(pendingPat).join(", ")}`);

  if (pendingParts.length) {
    document.getElementById("pendingMessage").innerHTML =
      `<div class="pending-box">⏳ Richiesta in attesa di verifica SOL.<br>${pendingParts.join("<br>")}</div>`;
  } else {
    document.getElementById("pendingMessage").innerHTML = "";
  }

  // ✅ QUALIFICHE: check + blocco (non si possono togliere quelle già validate)
  document.querySelectorAll('.qualifica-checkbox').forEach(cb => {
    const val = cb.value;

    if (originalQualifiche.has(val)) {
      cb.checked = true;
      cb.disabled = true;
      cb.title = "Qualifica già validata dalla SOL";
      return;
    }
    if (pendingQual.has(val)) {
      cb.checked = true;
      cb.disabled = true;
      cb.title = "Qualifica in approvazione SOL";
      return;
    }
  });

  // ✅ PATENTI: check + blocco (non si possono togliere quelle già validate, tranne NESSUNA)
  document.querySelectorAll('.patenti-checkbox').forEach(cb => {
    const val = cb.value;

    if (originalPatenti.has(val)) {
      cb.checked = true;
      if (val !== "NESSUNA") {
        cb.disabled = true;
        cb.title = "Patente già validata dalla SOL";
      } else {
        cb.disabled = false; // NESSUNA la lasciamo modificabile
        cb.title = "Puoi rimuovere NESSUNA e richiedere una patente (andrà in approvazione)";
      }
      return;
    }
    if (pendingPat.has(val)) {
      cb.checked = true;
      cb.disabled = true;
      cb.title = "Patente in approvazione SOL";
      return;
    }
  });

  // logica NESSUNA esclusiva
  const patCheckboxes = Array.from(document.querySelectorAll(".patenti-checkbox"));
  function getPatCb(val){ return patCheckboxes.find(x => x.value === val); }
  const cbNessuna = getPatCb("NESSUNA");

  function syncPatentiUI(){
    const selected = patCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    const hasNessuna = selected.includes("NESSUNA");

    if (hasNessuna) {
      // se NESSUNA selezionata, disabilita tutte le altre (ma non quelle già validate/pending che sono già disabled)
      patCheckboxes.forEach(cb => {
        if (cb.value !== "NESSUNA" && !cb.disabled) cb.checked = false;
      });
    } else {
      // niente
    }
  }

  patCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      // se selezioni una patente vera -> togli NESSUNA (se non è locked/pending)
      if (cb.value !== "NESSUNA" && cb.checked && cbNessuna && !cbNessuna.disabled) {
        cbNessuna.checked = false;
      }
      // se selezioni NESSUNA -> togli le altre non bloccate
      if (cb.value === "NESSUNA" && cb.checked) {
        patCheckboxes.forEach(o => {
          if (o.value !== "NESSUNA" && !o.disabled) o.checked = false;
        });
      }
      syncPatentiUI();
    });
  });
  syncPatentiUI();

  // richieste globali
  function getRichiesteAgg(){
    return JSON.parse(localStorage.getItem("richieste-aggiornamenti-volontari") || "[]");
  }
  function setRichiesteAgg(arr){
    localStorage.setItem("richieste-aggiornamenti-volontari", JSON.stringify(arr));
  }

  function diffAdded(selected, originalSet, pendingSet){
    return selected.filter(x => !originalSet.has(x) && !pendingSet.has(x));
  }

  // SALVA MODIFICHE ANAGRAFICA
  document.getElementById("form-anagrafica").addEventListener("submit", (e) => {
    e.preventDefault();

    const telefono = document.getElementById("telefono").value.trim();
    const contattoEmergenza = document.getElementById("contattoEmergenza").value.trim();

    if (telefono && contattoEmergenza && telefono === contattoEmergenza) {
      showMsg(`<div class="error">❌ Il telefono e il contatto di emergenza devono essere DIVERSI!</div>`);
      return;
    }

    // ✅ aggiorna SOLO campi consentiti al volontario
    volontario.telefono = telefono;
    volontario.contattoEmergenza = contattoEmergenza;
    volontario.stato = document.getElementById("stato").value.trim();
    volontario.indirizzo = document.getElementById("indirizzo").value.trim();
    volontario.comune = document.getElementById("comune").value.trim();
    volontario.provincia = document.getElementById("provincia").value.trim();
    volontario.cap = document.getElementById("cap").value.trim();
    volontario.intolleranze = document.getElementById("intolleranze").value.trim();
    volontario.allergie = document.getElementById("allergie").value.trim();

    // ✅ Qualifiche/Patenti: SOLO richieste aggiunta -> vanno in approvazione
    const selectedQual = Array.from(document.querySelectorAll('.qualifica-checkbox:checked')).map(cb => cb.value);
    let selectedPat = Array.from(document.querySelectorAll('.patenti-checkbox:checked')).map(cb => cb.value);

    // se nessuna patente selezionata -> forza NESSUNA
    if (!selectedPat.length) selectedPat = ["NESSUNA"];
    // se NESSUNA + altre -> togli NESSUNA
    if (selectedPat.includes("NESSUNA") && selectedPat.length > 1) {
      selectedPat = selectedPat.filter(x => x !== "NESSUNA");
    }

    const addedQual = diffAdded(selectedQual, originalQualifiche, pendingQual);
    const addedPat  = diffAdded(selectedPat, originalPatenti, pendingPat);

    // ✅ NON applico subito le nuove: mantengo quelle validate
    volontario.qualifiche = uniq(volontario.qualifiche || []);
    volontario.patenti = uniq(volontario.patenti || []);

    // pending merge
    const newPendingQual = uniq([...(volontario.pendingQualificheAdd || []), ...addedQual]);
    const newPendingPat  = uniq([...(volontario.pendingPatentiAdd || []), ...addedPat]);

    const hasNewRequests = addedQual.length > 0 || addedPat.length > 0;

    if (hasNewRequests) {
      volontario.pendingQualificheAdd = newPendingQual;
      volontario.pendingPatentiAdd = newPendingPat;

      // salva/merge richiesta globale "pending" per CF
      const richieste = getRichiesteAgg();
      const existingIdx = richieste.findIndex(r =>
        ((r.cf || "") + "").toUpperCase() === userId &&
        (r.stato || "") === "pending"
      );

      if (existingIdx !== -1) {
        const r = richieste[existingIdx];
        r.aggiunteQualifiche = uniq([...(r.aggiunteQualifiche || []), ...addedQual]);
        r.aggiuntePatenti = uniq([...(r.aggiuntePatenti || []), ...addedPat]);
        r.dataUltimoAggiornamento = new Date().toISOString();
        richieste[existingIdx] = r;
      } else {
        richieste.push({
          id: Date.now(),
          cf: userId,
          comitato: volontario.comitato || "",
          stato: "pending",
          aggiunteQualifiche: addedQual,
          aggiuntePatenti: addedPat,
          dataRichiesta: new Date().toISOString(),
          dataUltimoAggiornamento: new Date().toISOString(),
          tipo: "requisiti"
        });
      }
      setRichiesteAgg(richieste);
    }

    // salva volontario
    const idx = volontari.findIndex(v => ((v.cf || "") + "").toUpperCase() === userId);
    if (idx !== -1) {
      volontari[idx] = volontario;
      localStorage.setItem('volontari', JSON.stringify(volontari));
      localStorage.setItem("nomeCompleto", `${volontario.nome} ${volontario.cognome}`);

      if (hasNewRequests) {
        const parts = [];
        if (addedQual.length) parts.push("📋 Qualifiche aggiunte: " + addedQual.join(", "));
        if (addedPat.length) parts.push("🚗 Patenti aggiunte: " + addedPat.join(", "));
        showMsg(`
          <div class="success">
            ✅ Dati aggiornati!<br>
            ⏳ Richiesta inviata alla SOL per approvazione:<br>
            ${parts.map(x => "• " + x).join("<br>")}
          </div>
        `);
        // ricarico per mostrare come "pending" disabilitato
        setTimeout(() => location.reload(), 1200);
      } else {
        showMsg(`<div class="success">✅ Dati aggiornati con successo!</div>`);
      }
    }
  });

  // CAMBIO PASSWORD
  document.getElementById("form-password").addEventListener("submit", (e) => {
    e.preventDefault();

    const passwordAttuale = document.getElementById("password-attuale").value;
    const passwordNuova = document.getElementById("password-nuova").value;
    const passwordConferma = document.getElementById("password-conferma").value;

    if ((volontario.password || "") !== passwordAttuale) {
      showMsg(`<div class="error">❌ Password attuale errata!</div>`);
      return;
    }

    if (passwordNuova !== passwordConferma) {
      showMsg(`<div class="error">❌ Le nuove password non corrispondono!</div>`);
      return;
    }

    if ((passwordNuova || "").length < 6) {
      showMsg(`<div class="error">❌ La password deve essere di almeno 6 caratteri!</div>`);
      return;
    }

    volontario.password = passwordNuova;

    const idx = volontari.findIndex(v => ((v.cf || "") + "").toUpperCase() === userId);
    if (idx !== -1) {
      volontari[idx] = volontario;
      localStorage.setItem('volontari', JSON.stringify(volontari));
      document.getElementById("form-password").reset();
      showMsg(`<div class="success">✅ Password cambiata con successo!</div>`);
    }
  });

  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});
