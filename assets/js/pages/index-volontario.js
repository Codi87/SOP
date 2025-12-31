document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId"); // CF del volontario
  const role = localStorage.getItem("role");
  const nomeCompleto = localStorage.getItem("nomeCompleto");

  if (!userId || role !== "volontario") {
    alert("Accesso negato");
    window.location.href = "login.html";
    return;
  }

  // Recupera il volontario per ottenere il comitato
  const volontari = JSON.parse(localStorage.getItem('volontari')) || [];
  const volontario = volontari.find(v => v.cf === userId);

  if (!volontario) {
    alert("Dati volontario non trovati");
    window.location.href = "login.html";
    return;
  }

  // ✅ LOGO DINAMICO IN BASE AL COMITATO
  const logoImg = document.getElementById("logo-volontario");
  const comitatoVolontario = (volontario.comitato || "").toLowerCase();

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

  if (logoMap[comitatoVolontario]) {
    logoImg.src = logoMap[comitatoVolontario];
  } else {
    logoImg.src = 'logo-sop.svg'; // fallback provinciale
  }

  // ✅ BENVENUTO PERSONALIZZATO
  document.getElementById("benvenuto").textContent = `Benvenuto, ${nomeCompleto || 'Volontario'}`;

  // ✅ POPOLA INFO PERSONALI
  document.getElementById("info-nome").textContent = `${volontario.nome} ${volontario.cognome}`;
  document.getElementById("info-cf").textContent = volontario.cf || "-";
  document.getElementById("info-comitato").textContent = volontario.comitato || "-";
  document.getElementById("info-telefono").textContent = volontario.telefono || "-";
  document.getElementById("info-email").textContent = volontario.email || "Non inserita";

  // ✅ POPOLA QUALIFICHE
  const qualifiche = volontario.qualifiche || [];
  if (qualifiche.length > 0) {
    document.getElementById("qualifiche-text").innerHTML =
      qualifiche.map(q => `✔️ ${q}`).join('<br>');
  } else {
    document.getElementById("qualifiche-text").innerHTML =
      '<em style="color: #999;">Nessuna qualifica registrata</em>';
  }

  // ✅ POPOLA PATENTI
  const patenti = volontario.patenti || [];
  if (patenti.length > 0) {
    document.getElementById("patenti-text").innerHTML =
      patenti.map(p => `✔️ ${p}`).join('<br>');
  } else {
    document.getElementById("patenti-text").innerHTML =
      '<em style="color: #999;">Nessuna patente registrata</em>';
  }

  // ✅ MOSTRA EVENTI DEL PROPRIO COMITATO
  const eventiElenco = document.getElementById("eventi-comitato");
  const eventi = JSON.parse(localStorage.getItem("eventi") || "[]");
  const comitatoLower = (volontario.comitato || "").toLowerCase();

  function eventoVisibilePerVolontario(ev) {
    const approvazioni = ev.approvazioni || {};
    const globalApproved = approvazioni["ALL"] === "approved";
    const statoComitato = approvazioni[comitatoLower] || "pending";

    // Solo eventi futuri (se dataInizio esiste)
    if (ev.dataInizio) {
      const oggi = new Date();
      oggi.setHours(0,0,0,0);
      const d = new Date(ev.dataInizio);
      d.setHours(0,0,0,0);
      if (d < oggi) return false;
    }

    if (globalApproved) return true;
    if (statoComitato === "approved") return true;

    return false;
  }

  const eventiVisibili = eventi
    .filter(ev =>
      (ev.comitatoCreatore || "").toLowerCase() === comitatoLower ||
      (ev.destSol || []).map(x => (x || "").toLowerCase()).includes(comitatoLower)
    )
    .filter(eventoVisibilePerVolontario)
    .sort((a, b) => (a.dataInizio || '').localeCompare(b.dataInizio || ''));

  if (!eventiVisibili.length) {
    eventiElenco.innerHTML =
      '<li class="empty-state">Nessun evento visibile al momento</li>';
  } else {
    eventiElenco.innerHTML = eventiVisibili.slice(0, 5).map(ev => {
      const data = ev.dataInizio || '';
      const ora = ev.oraInizio || '';
      return `
        <li>
          <span class="info-label">Titolo:</span> ${ev.titolo || ''}<br>
          <span class="info-label">Quando:</span> ${data} ${ora}<br>
          <span class="info-label">Luogo:</span> ${ev.luogo || ''}
        </li>
      `;
    }).join('');
  }

  // ✅ Se il volontario ha qualifica TLC 1 o TLC 2 (o legacy OPERATORE TLC), mostra link TLC
  const menu = document.querySelector(".menu");
  const isOperatoreTlc = qualifiche.includes("TLC 1") || qualifiche.includes("TLC 2") || qualifiche.includes("OPERATORE TLC");
  if (isOperatoreTlc) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "tlc.html";
    a.textContent = "📡 TLC";
    li.appendChild(a);
    menu.appendChild(li);
  }

  // Logout
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});
