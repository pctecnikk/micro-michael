/* Puntos online con Supabase: código de jugador + clasificación mundial.
   Si supabase-config.js no está rellenado, este archivo no hace nada y el juego
   guarda el progreso solo en cada dispositivo. */
(function () {
  const C = window.SUPABASE_CONFIG;
  const box = document.getElementById("cloudBox");
  const world = document.getElementById("worldRank");
  if (!C || !C.url || !C.key) return;

  const base = C.url.replace(/\/+$/, "") + "/rest/v1/rpc/";
  function rpc(fn, args) {
    const h = { "Content-Type": "application/json", apikey: C.key };
    if (/^eyJ/.test(C.key)) h.Authorization = "Bearer " + C.key;
    return fetch(base + fn, { method: "POST", headers: h, body: JSON.stringify(args || {}) })
      .then(async r => {
        const t = await r.text(); let j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) throw new Error((j && (j.message || j.hint)) || ("HTTP " + r.status));
        return j;
      });
  }

  let top = [], msg = "", busy = false;
  const timers = {};
  const normCode = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^MJ/, "").replace(/^(.{4})(.{4}).*$/, "MJ-$1-$2");

  function strip(p) { const d = JSON.parse(JSON.stringify(p)); delete d.code; return d; }
  function save(id, p) {
    if (!p || !p.code) return;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(() => {
      rpc("mm_save", { p_code: p.code, p_name: String(p.name || "Jugador").slice(0, 16), p_total: Math.max(0, Math.round(p.total || 0)), p_medals: (p.medals || []).length, p_data: strip(p) })
        .then(ok => {
          if (ok === false && Store.players[id] && Store.players[id].code === p.code) {
            delete Store.players[id].code; lsSave(); refreshPlayerUI(); renderBox(); renderWorld();
            say("El código de " + esc(p.name) + " ha cambiado en otro dispositivo. Ponlo en «¿Ya tienes un código?» para seguir sumando puntos online.");
          }
          loadTop();
        })
        .catch(e => console.warn("No se pudo guardar online", e));
    }, 800);
  }

  window.Cloud = { owns: id => !!(Store.players[id] && Store.players[id].code), save, renderWorld: () => { loadTop(); renderWorld(); },
    remove: code => rpc("mm_delete", { p_code: code }).then(r => { loadTop(); return r; }),
    load: code => rpc("mm_load", { p_code: code }) };

  function setMsg(t, speak) { msg = t; renderBox(); if (speak) say(esc(t)); }

  function renderBox() {
    if (!box) return;
    const p = cur();
    let h = "<b>🌍 Puntos online</b>";
    if (p && p.code) {
      h += '<span class="note" style="text-align:left">Los puntos de <b id="cName"></b> se guardan online y salen en la clasificación mundial. Tu código para recuperarlos en otro móvil es:</span>' +
        '<div class="codebox"><span id="cCode"></span><button class="btn ghost" id="cCopy" type="button">Copiar</button></div>' +
        '<span class="note" style="text-align:left">Apúntalo en un sitio seguro. Quien tenga tu código puede usar tus puntos.</span>';
    } else if (p) {
      h += '<span class="note" style="text-align:left">Crea un código para <b id="cName"></b>: tus puntos se guardarán online, podrás recuperarlos en cualquier móvil y saldrás en la clasificación mundial con tu nombre de jugador.</span>' +
        '<button class="btn" id="cCreate" type="button">Crear mi código</button>';
    } else {
      h += '<span class="note" style="text-align:left">Elige o escribe tu nombre abajo. Después podrás crear un código para guardar tus puntos online.</span>';
    }
    h += '<details id="cHave"' + (p && p.code ? "" : " open") + '><summary>¿Ya tienes un código?</summary>' +
      '<div class="nrow" style="margin-top:8px"><input id="cIn" maxlength="14" placeholder="MJ-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn" id="cLoad" type="button">Recuperar</button></div></details>';
    if (msg) h += '<p class="note" id="cMsg" role="status" style="text-align:left;color:var(--spot)"></p>';
    box.innerHTML = h;
    if (msg) document.getElementById("cMsg").textContent = msg;
    const nm = document.getElementById("cName"); if (nm && p) nm.textContent = p.name;
    const cc = document.getElementById("cCode"); if (cc && p) cc.textContent = p.code;
    const cp = document.getElementById("cCopy");
    if (cp) cp.onclick = () => {
      const t = p.code;
      const done = () => { cp.textContent = "¡Copiado!"; setTimeout(() => { cp.textContent = "Copiar"; }, 1500); };
      try { navigator.clipboard.writeText(t).then(done, () => selectCode()); } catch (e) { selectCode(); }
    };
    const cr = document.getElementById("cCreate"); if (cr) cr.onclick = createCode;
    document.getElementById("cLoad").onclick = loadCode;
    document.getElementById("cIn").addEventListener("keydown", e => { if (e.key === "Enter") loadCode(); });
  }
  function selectCode() { const el = document.getElementById("cCode"); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

  async function createCode() {
    const p = cur(); if (!p || p.code || busy) return;
    busy = true; setMsg("Creando tu código…");
    try {
      const r = await rpc("mm_create", { p_name: String(p.name).slice(0, 16) });
      p.code = r.code; p.updated = Date.now(); lsSave(); save(ME, p);
      SFX.sparkle();
      setMsg("¡Código creado! Apúntalo: con él recuperas tus puntos en cualquier dispositivo.");
      say("¡Código creado! Apúntalo bien: con él recuperas tus puntos en cualquier móvil.");
      refreshPlayerUI();
    } catch (e) { setMsg("No se ha podido crear el código. Revisa la conexión e inténtalo otra vez. (" + e.message + ")"); }
    busy = false;
  }

  async function loadCode() {
    if (busy) return;
    const input = document.getElementById("cIn");
    const code = normCode(input.value);
    if (!/^MJ-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) { setMsg("Escribe el código completo, por ejemplo MJ-7K3Q-9XPA."); input.focus(); return; }
    busy = true; setMsg("Buscando tu código…");
    try {
      const r = await rpc("mm_load", { p_code: code });
      if (!r) { setMsg("No existe ningún jugador con ese código. Revisa que esté bien escrito."); busy = false; return; }
      const player = normPlayer(Object.assign({}, r.data || {}, { name: r.name || (r.data && r.data.name) || "Jugador" }));
      player.code = code;
      if (typeof r.renames === "number") player.renames = Math.max(player.renames || 0, r.renames);
      let id = Object.keys(Store.players).find(k => Store.players[k].code === code);
      if (!id) {
        id = slug(player.name); if (id.startsWith("g-")) id = "j-" + id;
        if (Store.players[id]) id = id + "-" + code.slice(-4).toLowerCase();
      }
      Store.players[id] = player; lsSave();
      busy = false;
      setMsg("¡Recuperado! Ya tienes aquí los puntos de " + player.name + ".");
      SFX.ok();
      choosePlayer(id);
    } catch (e) { setMsg("No se ha podido recuperar. Revisa la conexión e inténtalo otra vez. (" + e.message + ")"); busy = false; }
  }

  /* make a new code for this player; the old one stops working, points stay */
  function regenUI() {
    const p = cur(), b = document.getElementById("wRegenBox"); if (!p || !p.code || !b) return;
    b.innerHTML = '<p class="note" style="text-align:left">Se creará un código nuevo para <b id="rgName"></b> y <b>el anterior dejará de funcionar</b>. Tus puntos y tu puesto en la clasificación se mantienen. En tus otros dispositivos tendrás que poner el código nuevo en «¿Ya tienes un código?».</p>' +
      '<div class="row" style="justify-content:flex-start"><button class="btn" id="rgOk" type="button">Sí, crear código nuevo</button><button class="btn ghost" id="rgNo" type="button">Cancelar</button></div><p class="note" id="rgMsg" role="status" style="text-align:left;color:var(--spot)"></p>';
    document.getElementById("rgName").textContent = p.name;
    document.getElementById("rgNo").onclick = () => { b.innerHTML = ""; };
    document.getElementById("rgOk").onclick = async () => {
      const ok = document.getElementById("rgOk"); ok.disabled = true;
      try {
        const r = await rpc("mm_regen", { p_code: p.code });
        if (!r || !r.code) { document.getElementById("rgMsg").textContent = "Este código ya no existe en el servidor. Crea uno nuevo al elegir jugador."; ok.disabled = false; return; }
        p.code = r.code; p.updated = Date.now(); lsSave(); savePlayer(ME);
        SFX.sparkle(); renderWorld(); renderBox();
        const m = document.getElementById("wRegenBox"); if (m) m.innerHTML = '<p class="note" style="text-align:left;color:var(--spot)">¡Código nuevo creado! Apúntalo bien.</p>';
        say("¡Código nuevo creado! Apúntalo bien: el anterior ya no funciona.");
      } catch (e) { document.getElementById("rgMsg").textContent = "No se ha podido crear el código nuevo. Revisa la conexión e inténtalo otra vez."; ok.disabled = false; }
    };
  }

  function loadTop() {
    rpc("mm_top", { p_limit: 20 }).then(r => { top = Array.isArray(r) ? r : []; renderWorld(); }).catch(() => {});
  }
  function renderWorld() {
    if (!world) return;
    const p = cur();
    const mine = p && p.code ? '<div class="codebox"><span class="note">Tu código:</span><b id="wCode"></b><button class="linkbtn" id="wRegen" type="button">🔄 Generar código nuevo</button></div><div id="wRegenBox"></div>' : "";
    if (!top.length) {
      world.innerHTML = "<h2>Clasificación mundial</h2><p class=\"note\" style=\"text-align:left\">Todavía no hay nadie. Crea tu código al elegir jugador y sé la primera persona.</p>" + mine;
    } else {
      const medal = ["🥇", "🥈", "🥉"];
      world.innerHTML = "<h2>Clasificación mundial</h2>" + top.map((d, i) => {
        const me = p && p.code && d.name === p.name && Math.round(d.total) === Math.round(p.total);
        return `<div class="wrow${me ? " me" : ""}"><span>${medal[i] || (i + 1) + "º"}</span><span class="n">${esc(d.name || "Jugador")}</span><span>${Math.round(d.total || 0)} pts</span></div>`;
      }).join("") + mine;
    }
    const wc = document.getElementById("wCode"); if (wc && p) wc.textContent = p.code;
    const rg = document.getElementById("wRegen"); if (rg) rg.onclick = regenUI;
  }

  // keep the box in step with the chosen player
  try { new MutationObserver(() => { if (!document.getElementById("v-login").hidden) { msg = ""; renderBox(); } }).observe(document.getElementById("v-login"), { attributes: true, attributeFilter: ["hidden"] }); } catch (e) {}
  try { new MutationObserver(() => { if (!document.getElementById("v-ranking").hidden) loadTop(); }).observe(document.getElementById("v-ranking"), { attributes: true, attributeFilter: ["hidden"] }); } catch (e) {}

  /* tell the owner's dashboard which game is being played (nothing is shown to players) */
  let sid = null;
  try { sid = sessionStorage.getItem("mm-sid"); } catch (e) {}
  if (!sid) { sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); try { sessionStorage.setItem("mm-sid", sid); } catch (e) {} }
  function ping() {
    if (document.hidden) return;
    const p = cur();
    let v = "menu"; try { v = curView; } catch (e) {}
    const game = (typeof GAMES === "object" && GAMES[v]) || ({ menu: "Menú", login: "Eligiendo jugador", ranking: "Puntos y medallas" }[v]) || v;
    rpc("mm_ping", { p_session: sid, p_name: p ? String(p.name).slice(0, 16) : null, p_game: game, p_code: !!(p && p.code) }).catch(() => {});
  }
  setTimeout(ping, 3000); setInterval(ping, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) ping(); });
  window.addEventListener("hashchange", () => setTimeout(ping, 500));
  window.addEventListener("popstate", () => setTimeout(ping, 500));

  renderBox();
  loadTop();
})();
