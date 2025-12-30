// app.js – script unico per gestione base (logo, menu, volontari, login helpers, eventi)

document.addEventListener("DOMContentLoaded", () => {
  // ==== DATI UTENTE LOGGATO ==================================================
  const userId   = localStorage.getItem("userId");
  const role     = localStorage.getItem("role");      // "volontario", "sol", "sop", "amministratore"...
  const comitato = localStorage.getItem("comitato");
  const cfUtente = (localStorage.getItem("cf") || "").toUpperCase();

  if (!userId) {
    alert("Devi effettuare il login");
    window.location.href = "login.html";
    return;
  }

  // ==== LOGO + TITOLO ========================================================
  const logoImg   = document.getElementById("logo-cri");
  const pageTitle = document.getElementById("pageTitle");
  let logoSrc     = "logo.svg";

  if (role === "sop" || role === "amministratore") {
    logoSrc = "logo-sop.svg";
    if (pageTitle && pageTitle.textContent.includes("Gestione Volontari")) {
      pageTitle.textContent = "👥 Gestione Volontari - SOP Provinciale";
    }
  } else if (role === "sol") {
    const c = (comitato || "").toLowerCase();
    if (c === "pesaro") logoSrc = "logo-pesaro.svg";
    else if (c === "urbino") logoSrc = "logo-urbino.svg";
    else if (c === "fano") logoSrc = "logo-fano.svg";
    else if (c === "pergola") logoSrc = "logo-pergola.svg";
    else if (c === "marotta-mondolfo") logoSrc = "logo-marotta-mondolfo.svg";
    else if (c === "fossombrone") logoSrc = "logo-fossombrone.svg";
    else if (c === "cagli") logoSrc = "logo-cagli.svg";
    else if (c === "montelabbate") logoSrc = "logo-montelabbate.svg";
    else if (c === "fermignano") logoSrc = "logo-fermignano.svg";
    else if (c === "sant'angelo in vado" || c === "santangelo in vado" || c === "sant-angelo-in-vado") {
      logoSrc = "logo-santangeloinvado.svg";
    } else {
      logoSrc = "logo-sop.svg";
    }
    if (pageTitle && pageTitle.textContent.includes("Gestione Volontari")) {
      pageTitle.textContent = `👥 Gestione Volontari - SOL ${comitato || ""}`;
    }
  }
  if (logoImg) logoImg.src = logoSrc;

  // ==== LOGOUT ===============================================================
  function logout() {
    localStorage.clear();
    window.location.href = "login.html";
  }
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // ==== MENU LATERALE ========================================================
  const menu = document.getElementById("menu-sidebar");
  if (menu) {
    const menuItems = [
      { text: "🏠 Home",        href: "index.html" },
      { text: "✅ Approvazioni", href: "iscrizioni-in-attesa.html" },
      { text: "👥 Volontari",   href: "volontari.html" },
      { text: "🚗 Mezzi",       href: "mezzi.html" },
      { text: "📦 Materiali",   href: "materiali.html" },
      { text: "🚨 Emergenze",   href: "emergenze.html" },
      { text: "📅 Eventi",      href: "eventi.html" },
      { text: "📄 Documenti",   href: "documenti.html" }
    ];

    if (role === "sop" || role === "amministratore" || role === "sol") {
      menuItems.push({ text: "⚙️ Admin", href: "admin.html" });
    }

    menuItems.forEach(({ text, href }) => {
      const li = document.createElement("li");
      const a  = document.createElement("a");
      a.href = href;
      a.textContent = text;
      // attiva la voce in base al titolo pagina
      if (document.location.pathname.endsWith(href)) {
        a.classList.add("active");
      }
      li.appendChild(a);
      menu.appendChild(li);
    });
  }

  // ==== UTILITY GLOBALI ======================================================
  window.escapeHtml = function(text) {
    if (!text) return "";
    return text.replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[m]);
  };

  window.formatDate = function(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  window.getVolontari = function() {
    return JSON.parse(localStorage.getItem("volontari") || "[]");
  };

  window.setVolontari = function(vol) {
    localStorage.setItem("volontari", JSON.stringify(vol));
  };

  window.getEventi = function() {
    return JSON.parse(localStorage.getItem("eventi") || "[]");
  };

  window.setEventi = function(ev) {
    localStorage.setItem("eventi", JSON.stringify(ev));
  };

  window.getVolontarioLoggato = function() {
    if (!cfUtente) return null;
    const volontari = getVolontari();
    return volontari.find(v => (v.cf || "").toUpperCase() === cfUtente) || null;
  };

  window.hasRequiredQualifiche = function(evento) {
    const richieste = evento.qualificheRichieste || [];
    if (!richieste.length) return true;
    const vol = getVolontarioLoggato();
    if (!vol) return false;
    const mieQualifiche = vol.qualifiche || [];
    return richieste.some(req => mieQualifiche.includes(req));
  };

  // ==== BLOCCO SPECIFICO VOLONTARI (SOLO SE PRESENTE LA TABELLA) ============
  const volontariTable = document.getElementById("volontari-list");
  const volontariForm  = document.getElementById("volontari-form");

  if (volontariTable && volontariForm) {
    let volontari = getVolontari();
    let editIndex = null;

    const formContainer = document.getElementById("form-container");
    const searchInput   = document.getElementById("search");
    const btnApriForm   = document.getElementById("btn-apri-form");
    const btnChiudiForm = document.getElementById("btn-chiudi-form");
    const submitBtn     = document.getElementById("submit-btn");
    const infoPopup     = document.getElementById("info-popup");
    const infoContent   = document.getElementById("info-content");
    const infoClose     = document.getElementById("info-close");

    function toggleFormVolontari(show) {
      if (show) {
        formContainer.classList.add("active");
        formContainer.setAttribute("aria-hidden", "false");
        volontariForm.nome.focus();
        hideInfoPopupVolontario();
      } else {
        formContainer.classList.remove("active");
        formContainer.setAttribute("aria-hidden", "true");
        volontariForm.reset();
        volontariForm.comitato.removeAttribute("readonly");
        editIndex = null;
        submitBtn.textContent = "Aggiungi Volontario";
      }
    }

    if (btnApriForm) {
      btnApriForm.addEventListener("click", () => {
        if (role === "sol") {
          volontariForm.comitato.value = comitato || "";
          volontariForm.comitato.setAttribute("readonly", true);
        }
        toggleFormVolontari(true);
      });
    }

    if (btnChiudiForm) {
      btnChiudiForm.addEventListener("click", () => toggleFormVolontari(false));
    }

    function showInfoPopupVolontario(volontario) {
      const dataRaw = volontario.dataNascita;
      let dataFormatted = dataRaw;
      if (dataRaw) {
        const parts = dataRaw.split("-");
        if (parts.length === 3) {
          dataFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      const dettagli = `
        <span class="info-label">Nome:</span> ${volontario.nome || ""}<br>
        <span class="info-label">Cognome:</span> ${volontario.cognome || ""}<br>
        <span class="info-label">Codice Fiscale:</span> ${volontario.cf || ""}<br>
        <span class="info-label">Telefono:</span> ${volontario.telefono || ""}<br>
        <span class="info-label">Contatto Emergenza:</span> ${volontario.contattoEmergenza || ""}<br>
        <span class="info-label">Luogo di nascita:</span> ${volontario.luogoNascita || ""}<br>
        <span class="info-label">Data di nascita:</span> ${dataFormatted || ""}<br>
        <span class="info-label">Stato:</span> ${volontario.stato || ""}<br>
        <span class="info-label">Indirizzo:</span> ${volontario.indirizzo || ""}<br>
        <span class="info-label">Comune:</span> ${volontario.comune || ""}<br>
        <span class="info-label">Provincia:</span> ${volontario.provincia || ""}<br>
        <span class="info-label">CAP:</span> ${volontario.cap || ""}<br>
        <span class="info-label">Comitato:</span> ${volontario.comitato || ""}<br>
        <span class="info-label">Intolleranze:</span> ${volontario.intolleranze || "Nessuna"}<br>
        <span class="info-label">Allergie:</span> ${volontario.allergie || "Nessuna"}<br>
        <span class="info-label">Codice MGO:</span> ${volontario.codiceMGO || "Non inserito"}<br>
        <span class="info-label">Qualifiche:</span> ${volontario.qualifiche ? volontario.qualifiche.join(", ") : "Nessuna"}<br>
        <span class="info-label">Patenti:</span> ${(volontario.patenti || []).join(", ") || "Nessuna"}<br>
        <span class="info-label">Consenso GDPR:</span> ${volontario.consensoGdpr ? "✅ SI" : "❌ NO"}
      `;
      infoContent.innerHTML = dettagli;
      infoPopup.classList.add("active");
      infoPopup.focus();
      toggleFormVolontari(false);
    }

    function hideInfoPopupVolontario() {
      infoPopup.classList.remove("active");
    }

    infoClose.addEventListener("click", hideInfoPopupVolontario);
    infoPopup.addEventListener("click", e => {
      if (e.target === infoPopup) hideInfoPopupVolontario();
    });
    infoPopup.addEventListener("keydown", e => {
      if (e.key === "Escape") hideInfoPopupVolontario();
    });

    function getVisibleVolontari() {
      if (role === "sop" || role === "amministratore") return volontari;
      if (role === "sol") {
        const c = (comitato || "").toLowerCase();
        if (!c) return volontari;
        return volontari.filter(v => (v.comitato || "").toLowerCase() === c);
      }
      return [];
    }

    function renderVolontari() {
      const filter = (searchInput ? searchInput.value : "").trim().toLowerCase();
      volontariTable.innerHTML = "";

      const visibili = getVisibleVolontari();

      visibili
        .filter(v =>
          (v.nome || "").toLowerCase().includes(filter) ||
          (v.cognome || "").toLowerCase().includes(filter) ||
          (v.cf || "").toLowerCase().includes(filter)
        )
        .forEach(v => {
          const globalIndex = volontari.findIndex(vol => vol.cf === v.cf);
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${escapeHtml(v.nome)}</td>
            <td>${escapeHtml(v.cognome)}</td>
            <td>${escapeHtml(v.cf)}</td>
            <td>${escapeHtml(v.telefono)}</td>
            <td>${escapeHtml(v.contattoEmergenza)}</td>
            <td>
              <button class="action-btn edit-btn"
                aria-label="Modifica ${escapeHtml(v.nome)} ${escapeHtml(v.cognome)}"
                onclick="editVolontario(${globalIndex})">Modifica</button>
              <button class="action-btn delete-btn"
                aria-label="Elimina ${escapeHtml(v.nome)} ${escapeHtml(v.cognome)}"
                onclick="deleteVolontario(${globalIndex})">Elimina</button>
              <button class="action-btn info-btn"
                aria-label="Info ${escapeHtml(v.nome)} ${escapeHtml(v.cognome)}"
                onclick="showInfoPopupByIndex(${globalIndex})">Info</button>
            </td>
          `;
          volontariTable.appendChild(row);
        });
    }

    volontariForm.addEventListener("submit", e => {
      e.preventDefault();

      if (!volontariForm.checkValidity()) {
        volontariForm.reportValidity();
        return;
      }

      const telefono          = volontariForm.telefono.value.trim();
      const contattoEmergenza = volontariForm.contattoEmergenza.value.trim();
      if (telefono && contattoEmergenza && telefono === contattoEmergenza) {
        alert("❌ Il numero di telefono e il contatto di emergenza devono essere DIVERSI!");
        volontariForm.telefono.focus();
        return;
      }

      const nuovoVolontario = {
        nome: volontariForm.nome.value.trim(),
        cognome: volontariForm.cognome.value.trim(),
        cf: volontariForm.cf.value.trim().toUpperCase(),
        telefono,
        contattoEmergenza,
        luogoNascita: volontariForm.luogoNascita.value.trim(),
        dataNascita: volontariForm.dataNascita.value,
        stato: volontariForm.stato.value.trim(),
        indirizzo: volontariForm.indirizzo.value.trim(),
        comune: volontariForm.comune.value.trim(),
        provincia: volontariForm.provincia.value.trim(),
        cap: volontariForm.cap.value.trim(),
        comitato: volontariForm.comitato.value.trim(),
        intolleranze: volontariForm.intolleranze.value.trim(),
        allergie: volontariForm.allergie.value.trim(),
        codiceMGO: volontariForm.codiceMGO.value.trim(),
        qualifiche: Array.from(volontariForm.querySelectorAll(".qualifica-checkbox:checked")).map(cb => cb.value),
        patenti: Array.from(volontariForm.querySelectorAll(".patenti-checkbox:checked")).map(cb => cb.value),
        consensoGdpr: volontariForm.consensoGdpr.checked,
        password: volontariForm.cf.value.trim().toUpperCase().substring(0, 8)
      };

      const duplicateIndex = volontari.findIndex((v, idx) => v.cf === nuovoVolontario.cf && idx !== editIndex);
      if (duplicateIndex !== -1) {
        alert("❌ Errore: codice fiscale già presente per un altro volontario!");
        return;
      }

      if (editIndex === null) {
        volontari.push(nuovoVolontario);
      } else {
        nuovoVolontario.password = volontari[editIndex].password;
        volontari[editIndex] = nuovoVolontario;
        editIndex = null;
        submitBtn.textContent = "Aggiungi Volontario";
      }

      setVolontari(volontari);
      toggleFormVolontari(false);
      renderVolontari();
    });

    window.editVolontario = function(index) {
      const v = volontari[index];
      if (!v) return;

      editIndex = index;
      submitBtn.textContent = "Salva Modifiche";

      volontariForm.nome.value           = v.nome || "";
      volontariForm.cognome.value        = v.cognome || "";
      volontariForm.cf.value             = v.cf || "";
      volontariForm.telefono.value       = v.telefono || "";
      volontariForm.contattoEmergenza.value = v.contattoEmergenza || "";
      volontariForm.luogoNascita.value   = v.luogoNascita || "";
      volontariForm.dataNascita.value    = v.dataNascita || "";
      volontariForm.stato.value          = v.stato || "";
      volontariForm.indirizzo.value      = v.indirizzo || "";
      volontariForm.comune.value         = v.comune || "";
      volontariForm.provincia.value      = v.provincia || "";
      volontariForm.cap.value            = v.cap || "";
      volontariForm.comitato.value       = v.comitato || "";
      volontariForm.intolleranze.value   = v.intolleranze || "";
      volontariForm.allergie.value       = v.allergie || "";
      volontariForm.codiceMGO.value      = v.codiceMGO || "";
      volontariForm.consensoGdpr.checked = !!v.consensoGdpr;

      volontariForm.querySelectorAll(".qualifica-checkbox").forEach(cb => {
        cb.checked = v.qualifiche?.includes(cb.value) || false;
      });
      volontariForm.querySelectorAll(".patenti-checkbox").forEach(cb => {
        cb.checked = v.patenti?.includes(cb.value) || false;
      });

      toggleFormVolontari(true);
    };

    window.deleteVolontario = function(index) {
      const v = volontari[index];
      if (!v) return;

      if (confirm(`🗑️ Sei sicuro di voler eliminare:\n\n${v.nome} ${v.cognome}\nCF: ${v.cf}\n\n⚠️ Questa azione è irreversibile!`)) {
        volontari.splice(index, 1);
        setVolontari(volontari);
        renderVolontari();
        if (editIndex === index) {
          toggleFormVolontari(false);
          editIndex = null;
          submitBtn.textContent = "Aggiungi Volontario";
        }
      }
    };

    window.showInfoPopupByIndex = function(index) {
      const v = volontari[index];
      if (!v) return;
      showInfoPopupVolontario(v);
    };

    if (searchInput) searchInput.addEventListener("input", renderVolontari);
    renderVolontari();
  }

  // Gli altri file (eventi.html, approvazioni.html, mezzi.html) usano le utility sopra
  // e le proprie parti di script specifiche.
});
