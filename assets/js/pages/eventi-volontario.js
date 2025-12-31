document.addEventListener("DOMContentLoaded", () => {
      const userId = localStorage.getItem("userId"); // CF del volontario
      const role = (localStorage.getItem("role") || "").toLowerCase();

      if (!userId || role !== "volontario") {
        alert("Accesso negato");
        window.location.href = "login.html";
        return;
      }

      const volontari = JSON.parse(localStorage.getItem("volontari")) || [];
      const volontario = volontari.find(v => (v.cf || "").toUpperCase() === userId.toUpperCase());

      if (!volontario) {
        alert("Dati volontario non trovati");
        window.location.href = "login.html";
        return;
      }

      // Helpers
      function normalize(s){ return (s || "").toLowerCase().trim(); }
      function escapeHtml(text){
        if (!text) return "";
        return (text + "").replace(/[&<>"']/g, m => ({
          "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
        }[m]));
      }

      function startOfToday(){
        const t = new Date();
        t.setHours(0,0,0,0);
        return t;
      }

      function getEventoEndDate(ev){
        const d = ev.dataFine || ev.dataInizio;
        if (!d) return null;
        const dt = new Date(d);
        dt.setHours(0,0,0,0);
        return dt;
      }

      // ✅ evento chiuso se fine/inizio < oggi
      function isEventoChiuso(ev){
        const end = getEventoEndDate(ev);
        if (!end) return false;
        return end < startOfToday();
      }

      // Logo dinamico
      const logoImg = document.getElementById("logo-volontario");
      const comitatoLower = normalize(volontario.comitato);

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
        "sant'angelo in vado": 'logo-santangelinvado.svg',
        'santangelo in vado': 'logo-santangelinvado.svg',
        'sant-angelo-in-vado': 'logo-santangelinvado.svg'
      };
      logoImg.src = logoMap[comitatoLower] || 'logo-sop.svg';

      // TLC menu
      const menu = document.querySelector(".menu");
      const qualificheVol = volontario.qualifiche || [];
      const patentiVol = volontario.patenti || [];

      if (qualificheVol.includes("TLC 1") || qualificheVol.includes("TLC 2") || qualificheVol.includes("OPERATORE TLC")) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "tlc.html";
        a.textContent = "📡 TLC";
        li.appendChild(a);
        menu.appendChild(li);
      }

      const eventiElenco = document.getElementById("lista-eventi");

      // Popup info
      const infoPopup = document.getElementById("info-popup");
      const infoClose = document.getElementById("info-close");
      const infoContent = document.getElementById("info-content");

      function openInfo(ev) {
        normalizeRequisitiEvento(ev);

        const closed = isEventoChiuso(ev);

        const destinatari = [];
        if (ev.destSol && ev.destSol.length) destinatari.push("SOL: " + ev.destSol.join(", "));
        if (ev.destSop) destinatari.push("SOP");
        const destinatariStr = destinatari.length ? destinatari.join(" | ") : "Solo comitato creatore";

        const approvazioni = ev.approvazioni || {};
        const statoApp = approvazioni["ALL"] === "approved"
          ? "Approvato SOP (visibile a tutti)"
          : (approvazioni[comitatoLower] === "approved" ? "Approvato per il tuo comitato" : "In approvazione");

        const reqQ = ev.qualificheRichieste || [];
        const reqP = ev.patentiRichieste || [];

        const richiesteQ = reqQ.length ? reqQ.join(", ") : "Nessuna";
        const richiesteP = reqP.length ? reqP.join(", ") : "Nessuna";

        infoContent.innerHTML = `
          <div><span class="info-k">Titolo:</span><span class="info-v">${escapeHtml(ev.titolo || "")}</span></div>
          <div><span class="info-k">Tipo evento:</span><span class="info-v">${escapeHtml(ev.tipoEvento || "")}</span></div>
          <div><span class="info-k">Quando:</span><span class="info-v">${escapeHtml(ev.dataInizio || "")} ${escapeHtml(ev.oraInizio || "")}</span></div>
          <div><span class="info-k">Fine:</span><span class="info-v">${escapeHtml(ev.dataFine || "")} ${escapeHtml(ev.oraFine || "")}</span></div>
          <div><span class="info-k">Luogo:</span><span class="info-v">${escapeHtml(ev.luogo || "")}</span></div>
          <div><span class="info-k">Creatore:</span><span class="info-v">${escapeHtml(ev.comitatoCreatore || "")}</span></div>
          <div><span class="info-k">Destinatari:</span><span class="info-v">${escapeHtml(destinatariStr)}</span></div>
          <div><span class="info-k">Stato approvazioni:</span><span class="info-v">${escapeHtml(statoApp)}</span></div>
          <div><span class="info-k">Stato evento:</span><span class="info-v">${closed ? '<span class="badge badge-closed">CHIUSO</span>' : '<span class="badge badge-approved">APERTO</span>'}</span></div>
          <div><span class="info-k">Qualifiche richieste:</span><span class="info-v">${escapeHtml(richiesteQ)}</span></div>
          <div><span class="info-k">Patenti richieste:</span><span class="info-v">${escapeHtml(richiesteP)}</span></div>
          <div><span class="info-k">Descrizione:</span><span class="info-v">${escapeHtml(ev.descrizione || ev.note || "")}</span></div>
        `;
        infoPopup.classList.add("active");
      }
      function closeInfo(){ infoPopup.classList.remove("active"); }
      infoClose.addEventListener("click", closeInfo);

      // ✅ supporto vecchi eventi: patenti dentro qualificheRichieste -> sposto
      const PATENTI_SET = new Set([
        "PATENTE 1","PATENTE 2","PATENTE 2B","PATENTE 3","PATENTE 4","PATENTE 5","PATENTE 5B",
        "PATENTE 6","PATENTE 7","PATENTE 7B","PATENTE 8","PATENTE 9","NESSUNA"
      ]);

      function normalizeRequisitiEvento(ev){
        ev.qualificheRichieste = Array.isArray(ev.qualificheRichieste) ? ev.qualificheRichieste : [];
        ev.patentiRichieste = Array.isArray(ev.patentiRichieste) ? ev.patentiRichieste : [];

        // vecchio: patenti in qualificheRichieste
        const nuoveQual = [];
        ev.qualificheRichieste.forEach(x => {
          const v = (x || "").trim();
          if (!v) return;
          if (PATENTI_SET.has(v)) {
            if (!ev.patentiRichieste.includes(v)) ev.patentiRichieste.push(v);
          } else nuoveQual.push(v);
        });
        ev.qualificheRichieste = nuoveQual;

        // regola NESSUNA
        if (ev.patentiRichieste.includes("NESSUNA") && ev.patentiRichieste.length > 1) {
          ev.patentiRichieste = ev.patentiRichieste.filter(x => x !== "NESSUNA");
        }
      }

      function intersects(a, b){
        const A = new Set((a || []).map(x => (x || "").trim()).filter(Boolean));
        for (const x of (b || [])) {
          const v = (x || "").trim();
          if (v && A.has(v)) return true;
        }
        return false;
      }

      // ✅ OR nelle categorie (basta 1) + categorie vuote => OK
      function volontarioSoddisfaRequisiti(ev){
        normalizeRequisitiEvento(ev);

        const reqQ = ev.qualificheRichieste || [];
        const reqP = ev.patentiRichieste || [];

        const okQ = reqQ.length === 0 ? true : intersects(qualificheVol, reqQ);

        const reqPclean = reqP.filter(x => x && x !== "NESSUNA");
        const okP = reqPclean.length === 0 ? true : intersects(patentiVol, reqPclean);

        return okQ && okP;
      }

      function missingRequisiti(ev){
        normalizeRequisitiEvento(ev);

        const reqQ = ev.qualificheRichieste || [];
        const reqP = (ev.patentiRichieste || []).filter(x => x && x !== "NESSUNA");

        const missQ = reqQ.length ? reqQ.filter(q => !qualificheVol.includes(q)) : [];
        const missP = reqP.length ? reqP.filter(p => !patentiVol.includes(p)) : [];

        // con OR: “mancano tutti” solo se non hai alcun match
        const okQ = reqQ.length === 0 ? true : intersects(qualificheVol, reqQ);
        const okP = reqP.length === 0 ? true : intersects(patentiVol, reqP);

        return {
          okQ, okP,
          missQ, missP
        };
      }

      // Visibilità evento per volontario: approvato + NON chiuso
      function eventoVisibilePerVolontario(ev) {
        if (isEventoChiuso(ev)) return false;

        const approvazioni = ev.approvazioni || {};
        const globalApproved = approvazioni["ALL"] === "approved";
        const statoComitato = approvazioni[comitatoLower] || "pending";
        return globalApproved || statoComitato === "approved";
      }

      // Iscrivibile: evento della mia SOL o SOP destinata/approvata globalmente
      function eventoIscrivibilePerVolontario(ev) {
        const creatore = normalize(ev.comitatoCreatore);
        const isDaMiaSOL = creatore === comitatoLower;

        const isDaSOP = (creatore === "sop" || creatore === "provinciale" || creatore === "provincia");
        const dest = (ev.destSol || []).map(x => normalize(x));
        const destinatoAllaMiaSOL = dest.includes(comitatoLower);

        const approvazioni = ev.approvazioni || {};
        const globalApproved = approvazioni["ALL"] === "approved";

        return isDaMiaSOL || (isDaSOP && (destinatoAllaMiaSOL || globalApproved));
      }

      // Normalizzazione iscrizioni
      function normalizeIscrizioni(ev) {
        ev.iscrizioni = ev.iscrizioni || [];

        if (ev.iscrizioni.length && typeof ev.iscrizioni[0] === "string") {
          ev.iscrizioni = ev.iscrizioni.map(cf => ({
            cf: (cf || "").toUpperCase(),
            comitato: comitatoLower,
            stato: "approved",
            dataRichiesta: null,
            dataDecisione: null,
            decisoDa: null
          }));
        } else {
          ev.iscrizioni = ev.iscrizioni.map(x => ({
            cf: ((x.cf || "") + "").toUpperCase(),
            comitato: normalize(x.comitato || comitatoLower),
            stato: (x.stato || "pending"),
            dataRichiesta: x.dataRichiesta || null,
            dataDecisione: x.dataDecisione || null,
            decisoDa: x.decisoDa || null
          }));
        }
      }

      function getMiaIscrizione(ev) {
        normalizeIscrizioni(ev);
        return (ev.iscrizioni || []).find(x => x.cf === userId.toUpperCase() && x.comitato === comitatoLower) || null;
      }

      function statoLabel(stato) {
        if (stato === "approved") return "✅ Iscritto (approvato)";
        if (stato === "pending") return "🕒 In attesa approvazione SOL";
        if (stato === "rejected") return "❌ Rifiutato";
        return "📝 Richiedi iscrizione";
      }

      function badgeHtml(stato){
        if (stato === "approved") return '<span class="badge badge-approved">Approvato</span>';
        if (stato === "pending") return '<span class="badge badge-pending">In attesa</span>';
        if (stato === "rejected") return '<span class="badge badge-rejected">Rifiutato</span>';
        return '';
      }

      // Carica eventi
      const eventi = JSON.parse(localStorage.getItem("eventi") || "[]");

      // visibili “strutturali”: creatore mio comitato o destinatario o global
      const eventiVisibili = eventi
        .filter(ev =>
          normalize(ev.comitatoCreatore) === comitatoLower ||
          (ev.destSol || []).map(x => normalize(x)).includes(comitatoLower) ||
          ((ev.approvazioni || {})["ALL"] === "approved")
        )
        .filter(eventoVisibilePerVolontario) // ✅ include chiusura
        .sort((a, b) => (a.dataInizio || "").localeCompare(b.dataInizio || ""));

      if (!eventiVisibili.length) {
        eventiElenco.innerHTML = '<li class="empty-state">Nessun evento visibile al momento</li>';
      } else {
        eventiElenco.innerHTML = eventiVisibili.map((ev, idx) => {
          normalizeRequisitiEvento(ev);

          const data = ev.dataInizio || "";
          const ora = ev.oraInizio || "";
          const luogo = ev.luogo || "";
          const titolo = ev.titolo || "";

          const eventId = ev.id || `${normalize(titolo)}|${data}|${ora}|${normalize(luogo)}|${idx}`;
          const mia = getMiaIscrizione(ev);
          const mioStato = mia ? mia.stato : null;

          const iscrivibileSOLoSOP = eventoIscrivibilePerVolontario(ev);
          const closed = isEventoChiuso(ev);

          const reqCheck = missingRequisiti(ev);
          const okReq = volontarioSoddisfaRequisiti(ev);

          const disabled =
            closed ||
            !iscrivibileSOLoSOP ||
            !okReq ||
            mioStato === "pending" ||
            mioStato === "approved";

          // righe requisiti
          const reqQ = (ev.qualificheRichieste || []);
          const reqP = (ev.patentiRichieste || []);
          const reqQText = reqQ.length ? reqQ.join(", ") : "Nessuna";
          const reqPText = reqP.length ? reqP.join(", ") : "Nessuna";

          const reqLine = `
            <span class="small-muted"><b>Qualifiche richieste:</b> ${escapeHtml(reqQText)}</span>
            <span class="small-muted"><b>Patenti richieste:</b> ${escapeHtml(reqPText)}</span>
          `;

          // hint mancanze (solo se non ok)
          let hint = "";
          if (!okReq) {
            const parts = [];
            if (!reqCheck.okQ && reqQ.length) parts.push("Qualifiche (serve almeno 1): " + reqQ.join(", "));
            const reqPclean = (reqP || []).filter(x => x && x !== "NESSUNA");
            if (!reqCheck.okP && reqPclean.length) parts.push("Patenti (serve almeno 1): " + reqPclean.join(", "));
            hint = parts.length ? `<span class="small-muted">Requisiti non soddisfatti. ${escapeHtml(parts.join(" | "))}</span>` : "";
          }

          const hintClosed = closed
            ? `<span class="small-muted"><b>Evento chiuso:</b> la data è passata, non è più possibile iscriversi.</span>`
            : "";

          return `
            <li>
              <span class="info-label">Titolo:</span> ${escapeHtml(titolo)}<br>
              <span class="info-label">Quando:</span> ${escapeHtml(data)} ${escapeHtml(ora)}<br>
              <span class="info-label">Luogo:</span> ${escapeHtml(luogo)}<br>

              ${badgeHtml(mioStato)}
              ${hintClosed}
              ${reqLine}

              <div class="actions-row">
                <button class="btn-info" data-info-id="${escapeHtml(eventId)}">ℹ️ Info</button>
                <button class="btn-iscrivi" data-event-id="${escapeHtml(eventId)}" ${disabled ? "disabled" : ""}>
                  ${escapeHtml(statoLabel(mioStato))}
                </button>
              </div>

              ${hint}
              ${mioStato === "rejected" ? '<span class="small-muted">Richiesta rifiutata: puoi contattare la SOL per dettagli.</span>' : ""}
            </li>
          `;
        }).join("");

        // Click INFO
        document.querySelectorAll(".btn-info").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-info-id");

            const eventiAgg = JSON.parse(localStorage.getItem("eventi") || "[]");
            let ev = eventiAgg.find(e => e.id && (e.id + "") === id);

            if (!ev) {
              ev = eventiAgg.find((e, idx) => {
                const fallbackId = `${normalize(e.titolo)}|${(e.dataInizio||"")}|${(e.oraInizio||"")}|${normalize(e.luogo)}|${idx}`;
                return fallbackId === id;
              });
            }
            if (!ev) { alert("Evento non trovato"); return; }
            openInfo(ev);
          });
        });

        // Click ISCRIVI
        document.querySelectorAll(".btn-iscrivi").forEach(btn => {
          btn.addEventListener("click", () => {
            const eventId = btn.getAttribute("data-event-id");
            const eventiAgg = JSON.parse(localStorage.getItem("eventi") || "[]");

            let evIndex = eventiAgg.findIndex(e => e.id && (e.id + "") === eventId);
            if (evIndex === -1) {
              evIndex = eventiAgg.findIndex((e, idx) => {
                const fallbackId = `${normalize(e.titolo)}|${(e.dataInizio||"")}|${(e.oraInizio||"")}|${normalize(e.luogo)}|${idx}`;
                return fallbackId === eventId;
              });
            }
            if (evIndex === -1) { alert("Evento non trovato"); return; }

            const ev = eventiAgg[evIndex];
            normalizeRequisitiEvento(ev);

            // ricontrolli: chiuso / visibile / iscrivibile
            if (isEventoChiuso(ev)) {
              alert("⛔ Evento chiuso: la data dell'evento è passata, non è più possibile iscriversi.");
              return;
            }
            if (!eventoVisibilePerVolontario(ev)) {
              alert("Evento non più disponibile o non approvato.");
              return;
            }
            if (!eventoIscrivibilePerVolontario(ev)) {
              alert("Puoi iscriverti solo ad eventi della tua SOL o SOP destinati alla tua SOL.");
              return;
            }

            // requisiti OR
            if (!volontarioSoddisfaRequisiti(ev)) {
              alert("⛔ Non possiedi i requisiti richiesti (basta 1 qualifica/patente richiesta).");
              return;
            }

            normalizeIscrizioni(ev);
            const mia = getMiaIscrizione(ev);
            if (mia) {
              alert("Hai già una richiesta / iscrizione per questo evento.");
              return;
            }

            // capienza: approved + pending (occupati)
            const max = ev.maxPartecipanti || 0;
            const occupati = (ev.iscrizioni || []).filter(x => x.stato === "approved" || x.stato === "pending").length;
            if (max > 0 && occupati >= max) {
              alert("Numero massimo di partecipanti raggiunto (incluse richieste in attesa).");
              return;
            }

            ev.iscrizioni.push({
              cf: userId.toUpperCase(),
              comitato: comitatoLower,
              stato: "pending",
              dataRichiesta: new Date().toISOString(),
              dataDecisione: null,
              decisoDa: null
            });

            eventiAgg[evIndex] = ev;
            localStorage.setItem("eventi", JSON.stringify(eventiAgg));
            alert("✅ Richiesta inviata! Ora è in attesa di approvazione della tua SOL.");
            location.reload();
          });
        });
      }

      // Logout
      document.getElementById("logout").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
      });
    });
