document.addEventListener("DOMContentLoaded", () => {
  if (window.App && App.qualifiche && App.qualifiche.attachTooltips){
    App.qualifiche.attachTooltips({ labelsSelector: ".qualifiche-container label", inputSelector: "input.qualifica-checkbox" });
  }

  const params = new URLSearchParams(window.location.search);
  const rawComitato = params.get('comitato') || '';
  const comitatoUrl = rawComitato.toLowerCase().trim();
  const role = localStorage.getItem("role");
  const comitatoStorage = localStorage.getItem("comitato");
  
  // Mappa comitati URL → nome + logo
  const comitatiMap = {
    'sop': { nome: 'SOP Pesaro-Urbino', logo: 'logo-sop.svg', isSOP: true },
    'tlc': { nome: 'TLC Provinciale', logo: 'logo-tlc.svg', isSOP: true, isTLC: true },
    'pesaro': { nome: 'Pesaro', logo: 'logo-pesaro.svg', isSOP: false },
    'urbino': { nome: 'Urbino', logo: 'logo-urbino.svg', isSOP: false },
    'fano': { nome: 'Fano', logo: 'logo-fano.svg', isSOP: false },
    'pergola': { nome: 'Pergola', logo: 'logo-pergola.svg', isSOP: false },
    'marotta-mondolfo': { nome: 'Marotta-Mondolfo', logo: 'logo-marotta-mondolfo.svg', isSOP: false },
    'marotta_mondolfo': { nome: 'Marotta-Mondolfo', logo: 'logo-marotta-mondolfo.svg', isSOP: false },
    'fossombrone': { nome: 'Fossombrone', logo: 'logo-fossombrone.svg', isSOP: false },
    'cagli': { nome: 'Cagli', logo: 'logo-cagli.svg', isSOP: false },
    'montelabbate': { nome: 'Montelabbate', logo: 'logo-montelabbate.svg', isSOP: false },
    'fermignano': { nome: 'Fermignano', logo: 'logo-fermignano.svg', isSOP: false },
    'santangeloinvado': { nome: "Sant'Angelo in Vado", logo: 'logo-santangeloinvado.svg', isSOP: false },
    "sant'angelo in vado": { nome: "Sant'Angelo in Vado", logo: 'logo-santangeloinvado.svg', isSOP: false },
    'sant-angelo-in-vado': { nome: "Sant'Angelo in Vado", logo: 'logo-santangeloinvado.svg', isSOP: false }
  };
  
  let comitatoSelezionato = null;
  let logoSrc = "logo.svg";

  // helper per nome leggibile se non mappato
  const prettyNameFromSlug = (slug) => {
    return String(slug || "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\w/g, (c) => c.toUpperCase());
  };

  // Priorità 1: URL
  if (comitatoUrl) {
    if (comitatiMap[comitatoUrl]) {
      comitatoSelezionato = comitatiMap[comitatoUrl];
      logoSrc = comitatoSelezionato.logo || `logo-${comitatoUrl}.svg`;
    } else {
      // non mappato: prova comunque logo-<slug>.svg e nome "pretty"
      comitatoSelezionato = { nome: prettyNameFromSlug(comitatoUrl), logo: `logo-${comitatoUrl}.svg`, isSOP: false };
      logoSrc = comitatoSelezionato.logo;
    }
  }
  // Priorità 2: localStorage (SOP o SOL loggati)
  else if (role === "sop" || role === "amministratore") {
    comitatoSelezionato = comitatiMap["sop"];
    logoSrc = comitatoSelezionato.logo;
  }
  else if (role === "tlc_provinciale") {
    comitatoSelezionato = comitatiMap["tlc"];
    logoSrc = comitatoSelezionato.logo;
  }
  else if (role === "sol" && comitatoStorage) {
    const c = comitatoStorage.toLowerCase().trim();
    if (comitatiMap[c]) {
      comitatoSelezionato = comitatiMap[c];
      logoSrc = comitatoSelezionato.logo || `logo-${c}.svg`;
    } else {
      comitatoSelezionato = { nome: prettyNameFromSlug(c), logo: `logo-${c}.svg`, isSOP: false };
      logoSrc = comitatoSelezionato.logo;
    }
  }

  
// Applica logo e header
const logoImg = document.getElementById("logo-cri-pubblico");
const headerComitato = document.getElementById("header-comitato");
const comitatoInput = document.getElementById("comitato");

function setLogo(src){
  if (!logoImg) return;
  // ri-mostra sempre l'immagine (nel caso fosse stata nascosta da onerror precedente)
  logoImg.style.display = "block";
  if (logoImg.nextElementSibling) logoImg.nextElementSibling.style.display = "none";
  logoImg.onerror = () => { logoImg.src = "logo.svg"; logoImg.style.display = "block"; if (logoImg.nextElementSibling) logoImg.nextElementSibling.style.display = "none"; };
  logoImg.src = src;
}

// ✅ Regole richieste:
// - comitato=<SOL>  -> logo-<sol>.svg, comitato BLOCCATO e valorizzato con <sol>
// - comitato=sop    -> logo-sop.svg, comitato SCRIVIBILE e OBBLIGATORIO (vuoto)
// - comitato=tlc    -> logo-tlc.svg, comitato SCRIVIBILE e OBBLIGATORIO (vuoto)
// - fallback: logo CRI
if (comitatoUrl) {
  if (comitatoUrl === "sop") {
    setLogo("logo-sop.svg");
    headerComitato.textContent = "📋 Registrazione Volontario";
    comitatoInput.value = "";
    comitatoInput.readOnly = false;
    comitatoInput.required = true;
    comitatoInput.placeholder = "Comitato di appartenenza *";
  } else if (comitatoUrl === "tlc") {
    setLogo("logo-tlc.svg");
    headerComitato.textContent = "📋 Registrazione Volontario";
    comitatoInput.value = "";
    comitatoInput.readOnly = false;
    comitatoInput.required = true;
    comitatoInput.placeholder = "Comitato di appartenenza *";
  } else {
    // SOL (pesaro, urbino, ecc.)
    setLogo(`logo-${comitatoUrl}.svg`);
    headerComitato.textContent = "📋 Registrazione Volontario";
    comitatoInput.value = comitatoUrl;
    comitatoInput.readOnly = true;
    comitatoInput.required = true;
  }
} else if (role === "tlc_provinciale") {
  // Se aperto senza query, ma da TLC provinciale: logo TLC e comitato scrivibile/obbligatorio
  setLogo("logo-tlc.svg");
  headerComitato.textContent = "📋 Registrazione Volontario";
  comitatoInput.value = "";
  comitatoInput.readOnly = false;
  comitatoInput.required = true;
  comitatoInput.placeholder = "Comitato di appartenenza *";
} else if (role === "sop" || role === "amministratore") {
  // SOP senza query: logo SOP e comitato scrivibile/obbligatorio
  setLogo("logo-sop.svg");
  headerComitato.textContent = "📋 Registrazione Volontario";
  comitatoInput.value = "";
  comitatoInput.readOnly = false;
  comitatoInput.required = true;
  comitatoInput.placeholder = "Comitato di appartenenza *";
} else if (role === "sol" && comitatoStorage) {
  // SOL senza query: logo sol e comitato bloccato
  const slug = comitatoStorage.toLowerCase().trim().replace(/\s+/g,"-");
  setLogo(`logo-${slug}.svg`);
  headerComitato.textContent = "📋 Registrazione Volontario";
  comitatoInput.value = slug;
  comitatoInput.readOnly = true;
  comitatoInput.required = true;
} else {
  headerComitato.textContent = "📋 Registrazione Volontario";
  setLogo("logo.svg");
}

// Validazione CF in tempo reale
  const cfInput = document.getElementById('cf');
  cfInput.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });

  // Submit form
  document.getElementById('form-pubblico').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submit-btn');
    const message = document.getElementById('message');
    
    btn.disabled = true;
    btn.classList.remove('btn-success');
    btn.textContent = '⏳ Salvataggio in corso...';
    message.innerHTML = '';
    
    // ✅ VALIDAZIONE: telefono e contatto emergenza devono essere diversi
    const telefono = document.getElementById('telefono').value.trim();
    const contattoEmergenza = document.getElementById('contattoEmergenza').value.trim();
    
    if (telefono === contattoEmergenza) {
      message.innerHTML = `
        <div class="error">
          ❌ <strong>Errore di validazione</strong><br>
          Il telefono e il contatto di emergenza devono essere DIVERSI!
        </div>
      `;
      btn.disabled = false;
      btn.textContent = '📤 Invia Candidatura';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // ✅ Validazione CF formato
    const cf = document.getElementById('cf').value.trim().toUpperCase();
    const cfPattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
    if (!cfPattern.test(cf)) {
      message.innerHTML = `
        <div class="error">
          ❌ <strong>Codice Fiscale non valido</strong><br>
          Inserisci un CF corretto di 16 caratteri.
        </div>
      `;
      btn.disabled = false;
      btn.textContent = '📤 Invia Candidatura';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // ✅ Validazione email
    const email = document.getElementById('email').value.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      message.innerHTML = `
        <div class="error">
          ❌ <strong>Email non valida</strong><br>
          Inserisci un indirizzo email corretto.
        </div>
      `;
      btn.disabled = false;
      btn.textContent = '📤 Invia Candidatura';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    let volontariPubblici = JSON.parse(localStorage.getItem('volontari-pubblici')) || [];
    
    const volontario = {
      nome: document.getElementById('nome').value.trim(),
      cognome: document.getElementById('cognome').value.trim(),
      cf: cf,
      email: email,
      telefono: telefono,
      contattoEmergenza: contattoEmergenza,
      dataNascita: document.getElementById('dataNascita').value,
      luogoNascita: document.getElementById('luogoNascita').value.trim(),
      stato: document.getElementById('stato').value.trim(),
      indirizzo: document.getElementById('indirizzo').value.trim(),
      comune: document.getElementById('comune').value.trim(),
      provincia: document.getElementById('provincia').value.trim().toUpperCase(),
      cap: document.getElementById('cap').value.trim(),
      comitato: document.getElementById('comitato').value.trim(),
      intolleranze: document.getElementById('intolleranze').value.trim(),
      allergie: document.getElementById('allergie').value.trim(),
      codiceMGO: document.getElementById('codiceMGO').value.trim(),
      qualifiche: Array.from(document.querySelectorAll('.qualifica-checkbox:checked')).map(cb => cb.value),
      patenti: Array.from(document.querySelectorAll('.patenti-checkbox:checked')).map(cb => cb.value),
      consensoGdpr: document.getElementById('consensoGdpr').checked,
      pubblico: true,
      statoApprovazione: 'in_attesa',
      data_inserimento: new Date().toISOString()
    };
    
    // ✅ Verifica duplicato CF
    const duplicato = volontariPubblici.find(v => v.cf === volontario.cf);
    if (duplicato) {
      const dataFormattata = new Date(duplicato.data_inserimento).toLocaleString('it-IT');
      message.innerHTML = `
        <div class="error">
          ❌ <strong>Codice Fiscale già registrato</strong><br>
          ${duplicato.nome} ${duplicato.cognome} - Registrato il ${dataFormattata}<br>
          <small>Se pensi che si tratti di un errore, contatta il comitato.</small>
        </div>
      `;
      btn.disabled = false;
      btn.textContent = '📤 Invia Candidatura';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // ✅ Verifica email duplicata
    const emailDuplicata = volontariPubblici.find(v => v.email && v.email.toLowerCase() === email);
    if (emailDuplicata) {
      message.innerHTML = `
        <div class="error">
          ❌ <strong>Email già registrata</strong><br>
          Questa email è già stata utilizzata per un'altra candidatura.
        </div>
      `;
      btn.disabled = false;
      btn.textContent = '📤 Invia Candidatura';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // ✅ Verifica consenso GDPR
    if (!volontario.consensoGdpr) {
      message.innerHTML = `
        <div class="error">
          ❌ <strong>Consenso GDPR obbligatorio</strong><br>
          Devi accettare il consenso GDPR per continuare!
        </div>
      `;
      btn.disabled = false;
      btn.textContent = '📤 Invia Candidatura';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    volontariPubblici.push(volontario);
    localStorage.setItem('volontari-pubblici', JSON.stringify(volontariPubblici));
    
    message.innerHTML = `
      <div class="success">
        ✅ <strong>Candidatura inviata con successo!</strong><br>
        <strong>${volontario.nome} ${volontario.cognome}</strong><br>
        <strong>CF: ${volontario.cf}</strong><br>
        <strong>Email: ${volontario.email}</strong><br>
        <strong>Comitato: ${volontario.comitato}</strong><br>
        <small>La tua candidatura è in attesa di approvazione da parte dei responsabili.<br>
        Riceverai comunicazioni via email una volta approvata. Grazie per la tua disponibilità! ❤️</small>
      </div>
    `;
    
    document.getElementById('form-pubblico').reset();
    document.getElementById('stato').value = 'Italia';
    if (comitatoSelezionato) {
      comitatoInput.value = comitatoSelezionato.nome;
      comitatoInput.readOnly = true;
    }
    
    btn.classList.add('btn-success');
    btn.textContent = '✅ Candidatura inviata con successo';
    
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('btn-success');
      btn.textContent = '📤 Invia Candidatura';
    }, 5000);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
