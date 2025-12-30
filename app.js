/* app.js
   ✅ Fix principali:
   - Menu coerente: usa "approvazioni.html" ovunque (niente "iscrizioni-in-attesa.html")
   - Logo mapping unico riusabile
   - Active link più robusto
   - Non rompe le pagine volontario (che spesso hanno id diversi)
*/

document.addEventListener("DOMContentLoaded", () => {
  const userId   = localStorage.getItem("userId");
  const role     = localStorage.getItem("role");
  const comitato = localStorage.getItem("comitato");

  // Se la pagina è login.html non forzare redirect
  if (location.pathname.endsWith("login.html")) return;

  if (!userId || !role) {
    alert("Devi effettuare il login");
    window.location.href = "login.html";
    return;
  }

  // ==== HELPERS ==============================================================
  const logoMapSOL = {
    "pesaro": "logo-pesaro.svg",
    "urbino": "logo-urbino.svg",
    "fano": "logo-fano.svg",
    "pergola": "logo-pergola.svg",
    "marotta-mondolfo": "logo-marotta-mondolfo.svg",
    "fossombrone": "logo-fossombrone.svg",
    "cagli": "logo-cagli.svg",
    "montelabbate": "logo-montelabbate.svg",
    "fermignano": "logo-fermignano.svg",
    "sant'angelo in vado": "logo-santangelinvado.svg",
    "santangelo in vado": "logo-santangelinvado.svg",
    "sant-angelo-in-vado": "logo-santangelinvado.svg"
  };

  function setLogo() {
    const logoImg = document.getElementById("logo-cri") || document.getElementById("logo-volontario");
    if (!logoImg) return;

    let src = "logo.svg";

    if (role === "sop" || role === "amministratore") {
      src = "logo-sop.svg";
    } else if (role === "sol") {
      const c = (comitato || "").toLowerCase();
      src = logoMapSOL[c] || "logo-sop.svg";
    } else if (role === "volontario") {
      // sulle pagine volontario spesso gestisci già il logo dinamico specifico,
      // quindi qui non forziamo nulla se non esiste un mapping.
      const volComitato = (comitato || "").toLowerCase();
      src = logoMapSOL[volComitato] || logoImg.getAttribute("src") || "logo.svg";
    }

    logoImg.src = src;
  }

  function logout() {
    localStorage.clear();
    window.location.href = "login.html";
  }

  function setActiveLinkByPath(a) {
    const current = location.pathname.split("/").pop() || "index.html";
    const target = (a.getAttribute("href") || "").split("/").pop();
    if (target && current === target) a.classList.add("active");
  }

  // ==== LOGO + LOGOUT =========================================================
  setLogo();

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // ==== MENU SOP/SOL/ADMIN (se presente) ======================================
  const menu = document.getElementById("menu-sidebar");
  if (menu) {
    const menuItems = [
      { text: "🏠 Home", href: "index.html" },
      { text: "✅ Approvazioni", href: "approvazioni.html" }, // ✅ coerente
      { text: "👥 Volontari", href: "volontari.html" },
      { text: "🚗 Mezzi", href: "mezzi.html" },
      { text: "📦 Materiali", href: "materiali.html" },
      { text: "🚨 Emergenze", href: "emergenze.html" },
      { text: "📅 Eventi", href: "eventi.html" },
      { text: "📄 Documenti", href: "documenti.html" }
    ];

    if (role === "sop" || role === "amministratore" || role === "sol") {
      menuItems.push({ text: "⚙️ Admin", href: "admin.html" });
    }

    menu.innerHTML = "";
    menuItems.forEach(({ text, href }) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      setActiveLinkByPath(a);
      li.appendChild(a);
      menu.appendChild(li);
    });
  }

  // ==== Utility globali =======================================================
  window.escapeHtml = function (text) {
    if (!text) return "";
    return text.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[m]);
  };

  window.formatDate = function (dateStr) {
    if (!dateStr) return "";
    const parts = String(dateStr).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  window.getVolontari = () => JSON.parse(localStorage.getItem("volontari") || "[]");
  window.setVolontari = (v) => localStorage.setItem("volontari", JSON.stringify(v));

  window.getEventi = () => JSON.parse(localStorage.getItem("eventi") || "[]");
  window.setEventi = (e) => localStorage.setItem("eventi", JSON.stringify(e));
});
