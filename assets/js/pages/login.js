// ✅ Seed UNA VOLTA SOLA (evita duplicazioni)
  const SEED_KEY = "cri_seed_v1";
  if (!localStorage.getItem(SEED_KEY)) {

    const utenti = [
      { id: "admin", nome: "Admin", cognome: "CRI", password: "adminpass", role: "amministratore", comitato: "Tutti" },
      { id: "sop", nome: "SOP", cognome: "Provinciale", password: "soppass", role: "sop", comitato: "Tutti" },
      { id: "tlc.prov", nome:"TLC", cognome:"Provinciale", password:"tlcpass", role:"tlc_provinciale", comitato:"Tutti" },

      { id: "sol.pesaro", nome: "SOL", cognome: "Pesaro", password: "solpass", role: "sol", comitato: "Pesaro" },
      { id: "sol.urbino", nome: "SOL", cognome: "Urbino", password: "solpass", role: "sol", comitato: "Urbino" },
      { id: "sol.fano", nome: "SOL", cognome: "Fano", password: "solpass", role: "sol", comitato: "Fano" },
      { id: "sol.pergola", nome: "SOL", cognome: "Pergola", password: "solpass", role: "sol", comitato: "Pergola" },
      { id: "sol.marotta-mondolfo", nome: "SOL", cognome: "Marotta-Mondolfo", password: "solpass", role: "sol", comitato: "Marotta-Mondolfo" },
      { id: "sol.fossombrone", nome: "SOL", cognome: "Fossombrone", password: "solpass", role: "sol", comitato: "Fossombrone" },
      { id: "sol.cagli", nome: "SOL", cognome: "Cagli", password: "solpass", role: "sol", comitato: "Cagli" },
      { id: "sol.montelabbate", nome: "SOL", cognome: "Montelabbate", password: "solpass", role: "sol", comitato: "Montelabbate" },
      { id: "sol.fermignano", nome: "SOL", cognome: "Fermignano", password: "solpass", role: "sol", comitato: "Fermignano" },
      { id: "sol.santangeloinvado", nome: "SOL", cognome: "Sant'Angelo in Vado", password: "solpass", role: "sol", comitato: "Sant'Angelo in Vado" }
    ];
    localStorage.setItem("utenti", JSON.stringify(utenti));

    // volontario demo (se non già presente)
    const volontari = JSON.parse(localStorage.getItem("volontari")) || [];
    const demoCf = "RSSMRA85M01H501Z";
    const giàPresente = volontari.some(v => (v.cf || "").toUpperCase() === demoCf);

    if (!giàPresente) {
      volontari.push({
        cf: demoCf,
        username: "mario.rossi",
        password: "cri2025",
        nome: "Mario",
        cognome: "Rossi",
        comitato: "Pesaro",
        qualifiche: "OPEM, OPSA" [] // opzionale
      });
      localStorage.setItem("volontari", JSON.stringify(volontari));
    }

    localStorage.setItem(SEED_KEY, "1");
  }

  // Compila credenziali ricordate
  window.addEventListener("load", () => {
    const ricordaUser = localStorage.getItem("ricorda_username");
    const ricordaPass = localStorage.getItem("ricorda_password");
    if (ricordaUser) document.getElementById("username").value = ricordaUser;
    if (ricordaPass) document.getElementById("password").value = ricordaPass;
    if (ricordaUser || ricordaPass) document.getElementById("ricorda").checked = true;
  });

  function showError(message) {
    const erroreDiv = document.getElementById("errore");
    erroreDiv.textContent = message;
    erroreDiv.classList.add("show");
    setTimeout(() => erroreDiv.classList.remove("show"), 5000);
  }

  function setButtonLoading(isLoading) {
    const btnLogin = document.getElementById("btn-login");
    if (isLoading) {
      btnLogin.disabled = true;
      btnLogin.textContent = "⏳ Verifica in corso...";
    } else {
      btnLogin.disabled = false;
      btnLogin.textContent = "🔓 Accedi";
    }
  }

  document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    setButtonLoading(true);

    const userInput = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value;

    if (!userInput || !pass) {
      showError("❌ Compila entrambi i campi");
      setButtonLoading(false);
      return;
    }

    const userLower = userInput.toLowerCase();
    const userUpper = userInput.toUpperCase();

    // 1) SOP/SOL/AMMINISTRATORE (match su id)
    const utenti = JSON.parse(localStorage.getItem("utenti")) || [];
    const utente = utenti.find(u => (u.id || "").toLowerCase() === userLower);

    if (utente && utente.password === pass) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("role", utente.role);
      localStorage.setItem("userId", utente.id);
      localStorage.setItem("comitato", utente.comitato);
      localStorage.setItem("nomeCompleto", `${utente.nome} ${utente.cognome}`);
      localStorage.removeItem("cf"); // ✅ non è un volontario

      if (document.getElementById("ricorda").checked) {
        localStorage.setItem("ricorda_username", userInput);
        localStorage.setItem("ricorda_password", pass);
      } else {
        localStorage.removeItem("ricorda_username");
        localStorage.removeItem("ricorda_password");
      }

      window.location.href = "index.html";
      return;
    }

    // 2) VOLONTARI (CF prioritario, altrimenti username)
    const volontari = JSON.parse(localStorage.getItem("volontari")) || [];
    const volontario = volontari.find(v => {
      const cf = (v.cf || "").toUpperCase();
      const un = (v.username || "").toLowerCase();
      return (cf && cf === userUpper) || (un && un === userLower);
    });

    if (volontario && volontario.password === pass) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("role", "volontario");
      localStorage.setItem("userId", (volontario.cf || "").toUpperCase()); // CF come userId
      localStorage.setItem("cf", (volontario.cf || "").toUpperCase());     // ✅ serve ad app.js
      localStorage.setItem("nomeCompleto", `${volontario.nome} ${volontario.cognome}`);
      localStorage.setItem("comitato", volontario.comitato || "");

      if (document.getElementById("ricorda").checked) {
        localStorage.setItem("ricorda_username", userInput);
        localStorage.setItem("ricorda_password", pass);
      } else {
        localStorage.removeItem("ricorda_username");
        localStorage.removeItem("ricorda_password");
      }

      window.location.href = "index-volontario.html";
      return;
    }

    // 3) Credenziali non valide
    showError("❌ Credenziali non valide. Riprova.");
    setButtonLoading(false);
  });
