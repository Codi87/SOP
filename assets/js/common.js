/* common.js — utility e comportamenti condivisi */

(function(){
  // namespace minimo
  window.App = window.App || {};

  App.escapeHtml = function(str){
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  App.getRole = function(){ return localStorage.getItem("role") || ""; };
  App.getUserId = function(){ return localStorage.getItem("userId") || ""; };

  App.logout = function(){
    try{
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
    }catch(e){}
    window.location.href = "login.html";
  };

  App.bindLogoutButton = function(){
    const btn = document.getElementById("logout-btn");
    if(btn){
      btn.addEventListener("click", App.logout);
    }
  };

  App.highlightActiveMenu = function(){
    const path = (location.pathname.split("/").pop() || "").toLowerCase();
    document.querySelectorAll(".menu a").forEach(a=>{
      const href = (a.getAttribute("href") || "").toLowerCase();
      if(href && href === path) a.classList.add("active");
    });
  };

  

  /* ===========================
     QUALIFICHE (lista unica + tooltip)
  ============================ */
  App.qualifiche = App.qualifiche || {};

  App.qualifiche.LIST = [
  "OPEM",
  "CSA",
  "OPSA",
  "TLC 1",
  "TLC 2",
  "UC-OC",
  "ASP-C",
  "CAE",
  "CSP-A",
  "CSP-D",
  "SMTS",
  "AUTISTA SOCCORRITORE",
  "SOCCORRITORE",
  "TS",
  "OSG",
  "LOGISTA",
  "OPERATORE UAS (A1/A3-A2-STS)",
  "HACCP",
  "OPSOCEM",
  "MEDIATORE LINGUISTICO"
];

  App.qualifiche.DESC = {
  "OPEM": "Operatore CRI Attività in Emergenza",
  "CSA": "Corso Sicurezza Acquatica",
  "OPSA": "Operatore Polivalente di Salvataggio in Acqua",
  "TLC 1": "Operatore Telecomunicazioni",
  "TLC 2": "Specialista Telecomunicazioni",
  "UC-OC": "Operatore Cinofilo CRI",
  "ASP-C": "Specializzazione per Operatore di Supporto Ristorazione in Emergenza",
  "CAE": "Coordinatore Delle Attività di Emergenza",
  "CSP-A": "Operatore di Sala Operativa",
  "CSP-D": "Operatore Specializzato CRI in Logistica in Emergenza",
  "SMTS": "Operatore Soccorso con Mezzi e Tecniche Speciali",
  "AUTISTA SOCCORRITORE": "Autista Soccorritore Necessario TSSA",
  "SOCCORRITORE": "Soccorritore Necessario TSSA",
  "TS": "Corso Trasporti Sanitari",
  "OSG": "Operatore Sociale Generico",
  "LOGISTA": "Logista Generico Senza Corso",
  "OPERATORE UAS (A1/A3-A2-STS)": "Operatore UAS Certificato Con Attestati",
  "OPSOCEM": "Operatore Sociale CRI in Emergenza"
};

  App.qualifiche.ALIAS = {
  "AUTISTA SOCCORRITORE TSSA": "AUTISTA SOCCORRITORE",
  "SOCCORRITORE TSSA": "SOCCORRITORE",
  "OPEM GENERICO": "OPEM",
  "OPEM LOGISTA": "LOGISTA",
  "OPERATORE TLC": "TLC 1",
  "OPERATORE SOCIALE GENERICO": "OSG",
  "CAE COORDINATORE ATTIVITA IN EMERGENZA": "CAE",
  "OPERATORE SOCIALE IN EMERGENZA": "OPSOCEM"
};

  App.qualifiche.normalize = function(val){
    const v = String(val ?? "").trim();
    if(!v) return "";
    return App.qualifiche.ALIAS[v] || v;
  };

  App.qualifiche._ensureTooltipEl = function(){
    let el = document.getElementById("qualifica-tooltip");
    if(!el){
      el = document.createElement("div");
      el.id = "qualifica-tooltip";
      el.setAttribute("role","tooltip");
      el.setAttribute("aria-hidden","true");
      document.body.appendChild(el);
    }
    return el;
  };

  App.qualifiche.attachTooltips = function(opts){
    const labelsSelector = (opts && opts.labelsSelector) ? opts.labelsSelector : ".qualifiche-container label";
    const inputSelector  = (opts && opts.inputSelector)  ? opts.inputSelector  : "input.qualifica-checkbox";
    const tooltip = App.qualifiche._ensureTooltipEl();

    function show(text, x, y){
      tooltip.textContent = text;
      tooltip.style.display = "block";
      tooltip.setAttribute("aria-hidden","false");
      const rect = tooltip.getBoundingClientRect();
      // posizione vicino al cursore, clamp nei bordi
      let nx = x + 14;
      let ny = y + 14;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if(nx + rect.width > vw - 8) nx = Math.max(8, vw - rect.width - 8);
      if(ny + rect.height > vh - 8) ny = Math.max(8, vh - rect.height - 8);
      tooltip.style.left = nx + "px";
      tooltip.style.top  = ny + "px";
    }
    function hide(){
      tooltip.style.display = "none";
      tooltip.setAttribute("aria-hidden","true");
    }

    document.querySelectorAll(labelsSelector).forEach(label => {
      const input = label.querySelector(inputSelector);
      if(!input) return;

      const keyRaw = input.value || "";
      const key = App.qualifiche.normalize(keyRaw);
      const desc = App.qualifiche.DESC[key] || "";
      if(!desc) return; // niente popup se non c'è descrizione

      // per accessibilità (fallback)
      if(!label.getAttribute("title")) label.setAttribute("title", desc);

      const onMove = (e)=> show(desc, e.clientX, e.clientY);
      const onEnter = (e)=> show(desc, e.clientX || 10, e.clientY || 10);
      const onLeave = ()=> hide();
      label.addEventListener("mousemove", onMove);
      label.addEventListener("mouseenter", onEnter);
      label.addEventListener("mouseleave", onLeave);
      label.addEventListener("focusin", (e)=> {
        const r = label.getBoundingClientRect();
        show(desc, r.left + 10, r.top + 10);
      });
      label.addEventListener("focusout", onLeave);

      // touch: tap mostra/nasconde
      label.addEventListener("click", (e)=> {
        // evita che il click sul label blocchi il checkbox
        // (non facciamo preventDefault)
        // se tooltip visibile e stesso testo, chiudi
        if(tooltip.style.display === "block" && tooltip.textContent === desc) hide();
      });
    });
  };


  // ---- Volontari: accesso ai dati correnti + helper qualifiche ----
  App.getCurrentVolontario = function(){
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (role !== "volontario") return null;
    const cf = (localStorage.getItem("cf") || localStorage.getItem("userId") || "").toUpperCase().trim();
    if (!cf) return null;
    const list = JSON.parse(localStorage.getItem("volontari") || "[]");
    return list.find(v => (v.cf || "").toUpperCase() === cf) || null;
  };

  App.getQualificheCorrenti = function(){
    const v = App.getCurrentVolontario();
    const arr = (v && Array.isArray(v.qualifiche)) ? v.qualifiche : [];
    return arr.map(x => String(x || "").trim()).filter(Boolean);
  };

  App.hasAnyQualifica = function(quals){
    const have = App.getQualificheCorrenti();
    const norm = s => String(s || "").trim().toUpperCase().replace(/\s+/g, " ");
    const canon = s => norm(s).replace(/[^A-Z0-9]/g, "");
    const setNorm = new Set(have.map(norm));
    const setCanon = new Set(have.map(canon));
    return (quals || []).some(q => setNorm.has(norm(q)) || setCanon.has(canon(q)));
  };

  // ---- Visibilità UI basata su qualifiche (data-qualifiche="TLC 1,TLC 2") ----
  App.applyQualificheVisibility = function(){
    const role = (localStorage.getItem("role") || "").toLowerCase();
    const isVol = role === "volontario";
    document.querySelectorAll("[data-qualifiche]").forEach(el => {
      const raw = (el.getAttribute("data-qualifiche") || "");
      const needed = raw.split(",").map(s => s.trim()).filter(Boolean);
      if (!needed.length) { el.style.display = ""; return; }
      // di default nascosti via CSS; li mostriamo solo se OK
      if (isVol && App.hasAnyQualifica(needed)) {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  };

document.addEventListener("DOMContentLoaded", function(){
    App.bindLogoutButton();
    App.highlightActiveMenu();
      App.applyQualificheVisibility();
});
})();
