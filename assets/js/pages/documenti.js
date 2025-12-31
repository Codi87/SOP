/* ===== Service Worker (come index) ===== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("✅ Service Worker registrato"))
    .catch(err => console.error("❌ Errore Service Worker:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const comitato = localStorage.getItem("comitato") || "";

  if (!userId) {
    alert("Devi effettuare il login");
    window.location.href = "login.html";
    return;
  }

  const isAdmin = role === "amministratore";

  // ====== helpers ======
  const normalize = (s) => (s || "").toString().toLowerCase().trim();
  const fmtDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return iso || ""; }
  };
  const escapeHtml = (t) => (t || "").toString().replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));

  // ====== LOGO (uguale a index) ======
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

  // ====== MENU (uguale a index) ======
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
    if (href === "documenti.html") a.classList.add("active");
    li.appendChild(a);
    menu.appendChild(li);
  });

  // ====== LOGOUT ======
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // ====== Permessi UI ======
  const rolePill = document.getElementById("role-pill");
  rolePill.textContent = isAdmin ? "👑 Admin: puoi caricare e gestire" : "👀 Solo lettura: puoi aprire/scaricare/stampare";
  document.getElementById("btn-new-folder").disabled = !isAdmin;
  document.getElementById("btn-upload-label").style.display = isAdmin ? "inline-flex" : "none";

  // ====== Storage ======
  const STORE_KEY = "cri_documenti_v1";
  const ROOT_ID = "root";

  const loadStore = () => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };
  const saveStore = (store) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  };

  const ensureStore = () => {
    let s = loadStore();
    if (!s || typeof s !== "object") {
      s = { folders: [{ id: ROOT_ID, name: "Documenti", parentId: null, createdAt: new Date().toISOString() }], files: [] };
      saveStore(s);
      return s;
    }
    if (!Array.isArray(s.folders)) s.folders = [];
    if (!Array.isArray(s.files)) s.files = [];
    if (!s.folders.find(f => f.id === ROOT_ID)) {
      s.folders.unshift({ id: ROOT_ID, name: "Documenti", parentId: null, createdAt: new Date().toISOString() });
    }
    saveStore(s);
    return s;
  };

  let store = ensureStore();
  let currentFolderId = ROOT_ID;

  // ====== DOM ======
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const pathEl = document.getElementById("path");
  const countsPill = document.getElementById("counts-pill");
  const search = document.getElementById("search");
  const btnBack = document.getElementById("btn-back");
  const btnNewFolder = document.getElementById("btn-new-folder");
  const fileInput = document.getElementById("file-input");

  // ====== Folder helpers ======
  const getFolder = (id) => store.folders.find(f => f.id === id) || null;
  const getChildrenFolders = (parentId) => store.folders.filter(f => f.parentId === parentId);
  const getChildrenFiles = (folderId) => store.files.filter(f => f.folderId === folderId);

  const buildBreadcrumb = () => {
    const parts = [];
    let cur = getFolder(currentFolderId);
    while (cur) {
      parts.push(cur);
      cur = cur.parentId ? getFolder(cur.parentId) : null;
    }
    parts.reverse();
    const html = parts.map((f, idx) => {
      const isLast = idx === parts.length - 1;
      if (isLast) return `<strong>${escapeHtml(f.name)}</strong>`;
      return `<a href="#" data-folder="${escapeHtml(f.id)}">${escapeHtml(f.name)}</a>`;
    }).join(" / ");
    pathEl.innerHTML = "Percorso: " + html;
    pathEl.querySelectorAll("a[data-folder]").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openFolder(a.getAttribute("data-folder"));
      });
    });
  };

  const updateBackButton = () => {
    const cur = getFolder(currentFolderId);
    btnBack.disabled = !(cur && cur.parentId);
  };

  const openFolder = (id) => {
    if (!getFolder(id)) return;
    currentFolderId = id;
    render();
  };

  btnBack.addEventListener("click", () => {
    const cur = getFolder(currentFolderId);
    if (cur && cur.parentId) openFolder(cur.parentId);
  });

  // ====== Create folder (admin only) ======
  btnNewFolder.addEventListener("click", () => {
    if (!isAdmin) return;
    const name = prompt("Nome cartella:");
    if (!name) return;
    const clean = name.trim();
    if (!clean) return;

    const id = "fld_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    store.folders.push({ id, name: clean, parentId: currentFolderId, createdAt: new Date().toISOString() });
    saveStore(store);
    render();
  });

  // ====== Upload files (admin only) ======
  const fileToDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Errore lettura file"));
    reader.readAsDataURL(file);
  });

  fileInput.addEventListener("change", async () => {
    if (!isAdmin) return;
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;

    try {
      for (const f of files) {
        const dataUrl = await fileToDataURL(f);
        store.files.push({
          id: "fil_" + Date.now() + "_" + Math.random().toString(16).slice(2),
          folderId: currentFolderId,
          name: f.name,
          type: f.type || "application/octet-stream",
          size: f.size || 0,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId
        });
      }
      saveStore(store);
      fileInput.value = "";
      render();
    } catch (e) {
      alert("Errore durante il caricamento.");
      console.error(e);
    }
  });

  // ====== Viewer modal ======
  const viewerModal = document.getElementById("viewer-modal");
  const viewerTitle = document.getElementById("viewer-title");
  const viewerBody = document.getElementById("viewer-body");
  const viewerClose = document.getElementById("viewer-close");

  const openViewer = (file) => {
    viewerTitle.textContent = file.name || "Documento";
    viewerBody.innerHTML = "";

    const type = (file.type || "").toLowerCase();
    const isPdf = type.includes("pdf") || (file.name || "").toLowerCase().endsWith(".pdf");
    const isImage = type.startsWith("image/");
    const isText = type.startsWith("text/") || ["application/json"].includes(type) ||
      /\.(txt|log|csv|md|json|xml|html|css|js)$/i.test(file.name || "");

    if (isPdf) {
      const iframe = document.createElement("iframe");
      iframe.className = "viewer";
      iframe.src = file.dataUrl;
      iframe.title = file.name || "PDF";
      viewerBody.appendChild(iframe);
    } else if (isImage) {
      const img = document.createElement("img");
      img.className = "viewer-img";
      img.alt = file.name || "Immagine";
      img.src = file.dataUrl;
      viewerBody.appendChild(img);
    } else if (isText) {
      const pre = document.createElement("div");
      pre.className = "viewer-text";
      // Provo a leggere come testo dal dataUrl
      try {
        const comma = (file.dataUrl || "").indexOf(",");
        const b64 = comma >= 0 ? (file.dataUrl || "").slice(comma + 1) : "";
        const txt = atob(b64);
        pre.textContent = txt;
      } catch {
        pre.textContent = "Anteprima non disponibile per questo tipo di file.";
      }
      viewerBody.appendChild(pre);
    } else {
      const box = document.createElement("div");
      box.className = "viewer-text";
      box.textContent = "Anteprima non disponibile per questo tipo di file. Puoi scaricarlo.";
      viewerBody.appendChild(box);
    }

    viewerModal.classList.add("active");
    viewerModal.setAttribute("aria-hidden", "false");
  };

  const closeViewer = () => {
    viewerModal.classList.remove("active");
    viewerModal.setAttribute("aria-hidden", "true");
    viewerBody.innerHTML = "";
  };

  viewerClose.addEventListener("click", closeViewer);
  viewerModal.addEventListener("click", (e) => { if (e.target === viewerModal) closeViewer(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && viewerModal.classList.contains("active")) closeViewer(); });

  // ====== Download / Print ======
  const downloadFile = (file) => {
    const a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name || "documento";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const printFile = (file) => {
    const type = (file.type || "").toLowerCase();
    const isPdf = type.includes("pdf") || (file.name || "").toLowerCase().endsWith(".pdf");
    const isImage = type.startsWith("image/");
    const isText = type.startsWith("text/") || ["application/json"].includes(type) ||
      /\.(txt|log|csv|md|json|xml|html|css|js)$/i.test(file.name || "");

    const w = window.open("", "_blank");
    if (!w) { alert("Popup bloccato: abilita i popup per stampare."); return; }

    if (isPdf) {
      w.document.write(`
        <!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(file.name)}</title></head>
        <body style="margin:0">
          <iframe src="${file.dataUrl}" style="width:100vw;height:100vh;border:0" onload="this.contentWindow.focus(); this.contentWindow.print();"></iframe>
        </body></html>
      `);
      w.document.close();
      return;
    }

    if (isImage) {
      w.document.write(`
        <!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(file.name)}</title></head>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff">
          <img src="${file.dataUrl}" style="max-width:100%;max-height:100%" onload="window.focus(); window.print();" />
        </body></html>
      `);
      w.document.close();
      return;
    }

    if (isText) {
      let text = "";
      try {
        const comma = (file.dataUrl || "").indexOf(",");
        const b64 = comma >= 0 ? (file.dataUrl || "").slice(comma + 1) : "";
        text = atob(b64);
      } catch { text = "Impossibile leggere il testo."; }

      w.document.write(`
        <!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(file.name)}</title>
          <style>body{font-family:Arial,sans-serif;padding:18px;}pre{white-space:pre-wrap;}</style>
        </head>
        <body>
          <h3>${escapeHtml(file.name)}</h3>
          <pre>${escapeHtml(text)}</pre>
          <script>window.focus(); window.print();<\/script>
        </body></html>
      `);
      w.document.close();
      return;
    }

    // fallback: stampa non supportata
    w.close();
    alert("Stampa non disponibile per questo tipo di file. Prova a scaricarlo.");
  };

  // ====== Delete (admin only) ======
  const deleteFolder = (folderId) => {
    if (!isAdmin) return;
    if (folderId === ROOT_ID) return;

    const hasSubFolders = getChildrenFolders(folderId).length > 0;
    const hasFiles = getChildrenFiles(folderId).length > 0;
    if (hasSubFolders || hasFiles) {
      alert("La cartella non è vuota. Sposta o elimina prima contenuti e sottocartelle.");
      return;
    }

    if (!confirm("Eliminare questa cartella?")) return;
    store.folders = store.folders.filter(f => f.id !== folderId);
    saveStore(store);
    render();
  };

  const deleteFile = (fileId) => {
    if (!isAdmin) return;
    const file = store.files.find(x => x.id === fileId);
    if (!file) return;
    if (!confirm(`Eliminare il file "${file.name}"?`)) return;
    store.files = store.files.filter(x => x.id !== fileId);
    saveStore(store);
    render();
  };

  // ====== Render ======
  const render = () => {
    store = ensureStore();

    buildBreadcrumb();
    updateBackButton();

    const q = normalize(search.value);
    const folders = getChildrenFolders(currentFolderId)
      .filter(f => !q || normalize(f.name).includes(q))
      .sort((a,b) => (a.name || "").localeCompare(b.name || "", "it"));

    const files = getChildrenFiles(currentFolderId)
      .filter(f => !q || normalize(f.name).includes(q))
      .sort((a,b) => (a.name || "").localeCompare(b.name || "", "it"));

    countsPill.textContent = `${folders.length} cartelle • ${files.length} file`;

    grid.innerHTML = "";
    empty.style.display = (folders.length === 0 && files.length === 0) ? "block" : "none";

    // folders
    folders.forEach(f => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="title">
          <div>
            <div class="name">📁 ${escapeHtml(f.name)}</div>
            <div class="meta">Creata: ${escapeHtml(fmtDateTime(f.createdAt))}</div>
          </div>
        </div>
        <div class="actions">
          <button class="a open" type="button">Apri</button>
          <button class="a delete" type="button" ${isAdmin ? "" : "disabled"}>Elimina</button>
        </div>
      `;
      div.querySelector(".a.open").addEventListener("click", () => openFolder(f.id));
      div.querySelector(".a.delete").addEventListener("click", () => deleteFolder(f.id));
      grid.appendChild(div);
    });

    // files
    files.forEach(file => {
      const div = document.createElement("div");
      div.className = "card";
      const kb = (file.size || 0) / 1024;
      const sizeStr = kb >= 1024 ? (kb/1024).toFixed(2) + " MB" : kb.toFixed(1) + " KB";
      div.innerHTML = `
        <div class="title">
          <div>
            <div class="name">📄 ${escapeHtml(file.name)}</div>
            <div class="meta">
              Tipo: ${escapeHtml(file.type || "—")}<br>
              Dimensione: ${escapeHtml(sizeStr)}<br>
              Caricato: ${escapeHtml(fmtDateTime(file.uploadedAt))}${file.uploadedBy ? " • da " + escapeHtml(file.uploadedBy) : ""}
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="a view" type="button">Visualizza</button>
          <button class="a download" type="button">Scarica</button>
          <button class="a print" type="button">Stampa</button>
          <button class="a delete" type="button" ${isAdmin ? "" : "disabled"}>Elimina</button>
        </div>
      `;
      div.querySelector(".a.view").addEventListener("click", () => openViewer(file));
      div.querySelector(".a.download").addEventListener("click", () => downloadFile(file));
      div.querySelector(".a.print").addEventListener("click", () => printFile(file));
      div.querySelector(".a.delete").addEventListener("click", () => deleteFile(file.id));
      grid.appendChild(div);
    });
  };

  search.addEventListener("input", render);

  // iniziale
  render();
});
