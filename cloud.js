/* Guardado online con Firebase (cuenta de Google + Firestore) y clasificación mundial.
   Si firebase-config.js no está rellenado, este archivo no hace nada y el juego
   guarda el progreso solo en cada dispositivo. */
(function () {
  const box = document.getElementById("cloudBox");
  const world = document.getElementById("worldRank");
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || !window.firebase) return;

  firebase.initializeApp(cfg);
  const auth = firebase.auth();
  const fs = firebase.firestore();
  const provider = new firebase.auth.GoogleAuthProvider();

  let uid = null, wantPick = false, needsName = false, top = [], timer = null;
  const pid = () => (uid ? "g-" + uid : null);

  function cloudSave(id, p) {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (!uid || id !== pid() || !p) return;
      try {
        await fs.doc("users/" + uid).set(JSON.parse(JSON.stringify(p)));
        await fs.doc("leaderboard/" + uid).set({
          name: String(p.name || "Jugador").slice(0, 16),
          total: Math.max(0, Math.round(p.total || 0)),
          medals: (p.medals || []).length,
          updated: Date.now()
        });
      } catch (e) { console.warn("No se pudo guardar online", e); }
    }, 700);
  }

  window.Cloud = { owns: id => !!uid && id === pid(), save: cloudSave, renderWorld };

  function dropCachedCloudPlayers(keep) {
    Object.keys(Store.players).forEach(k => {
      if (k.startsWith("g-") && k !== keep) {
        delete Store.players[k];
        if (ME === k) { ME = null; try { localStorage.removeItem(LS + "-me"); } catch (e) {} }
      }
    });
    lsSave();
  }

  const INAPP = /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)|GSA\//i.test(navigator.userAgent);
  const STANDALONE = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  let lastErr = "";
  function authMsg(e) {
    const c = (e && e.code) || "";
    const m = {
      "auth/unauthorized-domain": "Firebase todavía no permite entrar desde esta web. En Firebase, ve a Authentication → Configuración → Dominios autorizados y añade pctecnikk.github.io.",
      "auth/operation-not-allowed": "El inicio de sesión con Google no está activado. En Firebase, ve a Authentication → Método de acceso y activa Google.",
      "auth/configuration-not-found": "Falta activar Authentication en Firebase: Authentication → Comenzar, y después activar Google.",
      "auth/network-request-failed": "No hay conexión a internet. Inténtalo otra vez.",
      "auth/web-storage-unsupported": "Este navegador bloquea el inicio de sesión. Abre la web en Chrome o Safari.",
      "auth/internal-error": "Google no ha dejado entrar desde este navegador. Abre la web en Chrome o Safari.",
      "auth/popup-blocked": "El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes e inténtalo otra vez."
    }[c];
    let t = m || "No se ha podido entrar con Google.";
    if (!m && STANDALONE) t += " Si abriste el juego desde el icono de la pantalla de inicio, prueba a abrirlo en Safari o Chrome.";
    return t + (c ? " (código: " + c + ")" : "");
  }
  function showErr(t) { lastErr = t; renderBox(); say(t); }

  function signIn() {
    if (INAPP) { showErr("Estás dentro del navegador de otra app, como WhatsApp o Instagram, y Google no deja entrar desde ahí. Pulsa el menú ⋮ o el botón de compartir y elige «Abrir en Chrome» o «Abrir en Safari»."); return; }
    lastErr = ""; wantPick = true;
    auth.signInWithPopup(provider).catch(e => {
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
      if (e.code === "auth/operation-not-supported-in-this-environment") { auth.signInWithRedirect(provider).catch(err => showErr(authMsg(err))); return; }
      console.warn(e); showErr(authMsg(e));
    });
  }
  auth.getRedirectResult().catch(e => { if (e && e.code) showErr(authMsg(e)); });
  function signOut() { auth.signOut(); }

  function renderBox() {
    if (!box) return;
    if (!uid) {
      box.innerHTML = '<b>Guarda tu progreso online</b>' +
        '<span class="note" style="text-align:left">Entra con Google para no perder tus puntos en ningún móvil y salir en la clasificación mundial. Si no, se guarda solo en este dispositivo.</span>' +
        '<button class="btn" id="gIn" type="button">Entrar con Google</button>' +
        (lastErr ? '<p class="note" id="gErr" role="alert" style="text-align:left;color:var(--bad)"></p>' : '');
      if (lastErr) document.getElementById("gErr").textContent = lastErr;
      document.getElementById("gIn").onclick = signIn;
      return;
    }
    if (needsName) {
      box.innerHTML = '<b>¡Ya has entrado con Google!</b>' +
        '<label for="gNick" class="note" style="text-align:left">Elige un apodo para la clasificación mundial. Mejor no pongas tu nombre y apellidos.</label>' +
        '<div class="nrow"><input id="gNick" maxlength="16" placeholder="Tu apodo" autocomplete="off"><button class="btn" id="gNickGo" type="button">Crear</button></div>' +
        '<button class="linkbtn" id="gOut" type="button">Salir de Google</button>';
      document.getElementById("gNickGo").onclick = createProfile;
      document.getElementById("gNick").addEventListener("keydown", e => { if (e.key === "Enter") createProfile(); });
      document.getElementById("gOut").onclick = signOut;
      return;
    }
    const p = Store.players[pid()];
    box.innerHTML = '<span>Has entrado con Google como <b id="gName"></b>. Tu progreso se guarda online.</span>' +
      '<div class="row" style="justify-content:flex-start"><button class="btn" id="gPlay" type="button"></button>' +
      '<button class="linkbtn" id="gOut" type="button">Salir de Google</button></div>';
    document.getElementById("gName").textContent = p ? p.name : "";
    document.getElementById("gPlay").textContent = "Jugar como " + (p ? p.name : "yo");
    document.getElementById("gPlay").onclick = () => choosePlayer(pid());
    document.getElementById("gOut").onclick = signOut;
  }

  function createProfile() {
    const input = document.getElementById("gNick");
    const name = (input.value || "").trim().slice(0, 16);
    if (!name) { say("Escribe un apodo primero."); input.focus(); return; }
    Store.players[pid()] = normPlayer({ name, updated: Date.now() });
    needsName = false;
    lsSave();
    cloudSave(pid(), Store.players[pid()]);
    renderBox();
    choosePlayer(pid());
  }

  auth.onAuthStateChanged(async u => {
    if (!u) {
      uid = null; needsName = false;
      dropCachedCloudPlayers(null);
      renderBox(); refreshPlayerUI(); renderWorld();
      return;
    }
    uid = u.uid;
    dropCachedCloudPlayers(pid());
    try {
      const snap = await fs.doc("users/" + uid).get();
      if (snap.exists) {
        const remote = normPlayer(snap.data()), local = Store.players[pid()];
        const useLocal = local && (local.updated || 0) > (remote.updated || 0);
        Store.players[pid()] = useLocal ? local : remote;
        if (useLocal) cloudSave(pid(), local);
        needsName = false;
        lsSave(); refreshPlayerUI(); renderBox(); renderWorld();
        if (wantPick) { wantPick = false; choosePlayer(pid()); }
      } else {
        needsName = true;
        renderBox();
        say("¡Has entrado con Google! Ahora elige un apodo para la clasificación.");
      }
    } catch (e) {
      renderBox();
      say("No se ha podido cargar tu progreso online. Revisa la conexión.");
    }
  });

  function renderWorld() {
    if (!world) return;
    if (!top.length) {
      world.innerHTML = '<h2>Clasificación mundial</h2><p class="note" style="text-align:left">Todavía no hay nadie. ¡Entra con Google y sé la primera persona!</p>';
      return;
    }
    const medal = ["🥇", "🥈", "🥉"];
    world.innerHTML = '<h2>Clasificación mundial</h2>' + top.map((d, i) =>
      `<div class="wrow${d.id === uid ? " me" : ""}"><span>${medal[i] || (i + 1) + "º"}</span><span class="n">${esc(d.name || "Jugador")}</span><span>${Math.round(d.total || 0)} pts</span></div>`
    ).join("");
  }

  fs.collection("leaderboard").orderBy("total", "desc").limit(20).onSnapshot(s => {
    top = s.docs.map(d => Object.assign({ id: d.id }, d.data()));
    renderWorld();
  }, () => {});

  renderBox();
  renderWorld();
})();
