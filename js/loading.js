/* Écran de chargement — Flotte Aeron
   Logique commune aux deux serveurs. Les textes sont dans config.js
   (un par serveur), rien n'est à modifier ici. */

(function () {
  "use strict";

  var C = window.LS_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- fonds ---------- */
  var slides = document.querySelectorAll(".bg img");
  var cur = 0;
  if (slides.length > 1) {
    setInterval(function () {
      slides[cur].className = "";
      cur = (cur + 1) % slides.length;
      slides[cur].className = "on";
    }, C.bgSeconds ? C.bgSeconds * 1000 : 8000);
  }

  /* ---------- astuces (serveur principal) ---------- */
  var tips = C.tips || [];
  var tipEl = $("tip");
  if (tipEl && tips.length) {
    // ordre mélangé : quelqu'un qui charge souvent ne relit pas toujours la même
    for (var i = tips.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = tips[i];
      tips[i] = tips[j]; tips[j] = t;
    }
    var ti = 0;
    var showTip = function () {
      tipEl.style.opacity = 0;
      setTimeout(function () {
        tipEl.textContent = tips[ti];
        tipEl.style.opacity = 1;
      }, 300);
    };
    showTip();
    setInterval(function () { ti = (ti + 1) % tips.length; showTip(); }, (C.tipSeconds || 9) * 1000);
  }

  if ($("discord")) $("discord").textContent = C.discord || "";

  /* ---------- infos envoyées par GMod ---------- */
  // wiki.facepunch.com/gmod/Loading_URL

  function prettyMap(raw) {
    if (C.maps && C.maps[raw]) return C.maps[raw];
    // rp_venator_v3 -> Venator v3
    var s = raw.replace(/^(rp|gm|ttt|cs|de)_/i, "").replace(/_/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  var gotDetails = false;
  window.GameDetails = function (servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    gotDetails = true;
    if (servername && $("server")) $("server").textContent = servername;
    if (mapname) $("map").textContent = prettyMap(mapname);
  };

  // Étapes envoyées par le moteur (en anglais) -> texte affiché
  var STEPS = [
    [/retrieving server info|sending client info/i, "Connexion au serveur"],
    [/workshop/i,                                   "Contenu du Workshop"],
    [/mounting/i,                                   "Montage des addons"],
    [/downloading|getting/i,                        "Téléchargement des ressources"],
    [/lua|client info|starting/i,                   "Chargement des scripts"],
    [/precach|loading/i,                            "Chargement de la carte"]
  ];

  var stepEl = $("step"), fileEl = $("file"), countEl = $("count"),
      pctEl = $("pct"), fillEl = $("fill");
  var total = 0, needed = 0, real = false;

  function setStep(text) { if (text && stepEl.textContent !== text) stepEl.textContent = text; }

  function draw() {
    var done = total > 0 ? Math.max(0, total - needed) : 0;
    var pct = total > 0 ? Math.min(100, Math.round(done / total * 100)) : 0;
    fillEl.style.width = pct + "%";
    pctEl.textContent = pct + " %";
    countEl.textContent = total > 0 ? done + " / " + total + " fichiers" : "";
  }

  window.SetStatusChanged = function (status) {
    real = true;
    for (var s = 0; s < STEPS.length; s++) {
      if (STEPS[s][0].test(status)) { setStep(STEPS[s][1]); return; }
    }
    setStep(status);
  };
  window.SetFilesTotal = function (n) { real = true; total = n; draw(); };
  window.SetFilesNeeded = function (n) { real = true; needed = n; draw(); };
  window.DownloadingFile = function (name) {
    real = true;
    setStep("Téléchargement des ressources");
    fileEl.textContent = name || "";
  };

  draw();

  /* ---------- aperçu hors jeu (navigateur) ---------- */
  setTimeout(function () {
    if (gotDetails || real) return;
    var P = C.preview || {};
    window.GameDetails(P.server, "", P.map, 64, "", "darkrp");
    var files = [
      "models/aeron/carceral/panneau_carceral.mdl",
      "materials/aeron/accueil/logo_republique.vtf",
      "sound/aeron/debrief/theme_01.mp3",
      "models/weapons/arccw/aeron_charm/rep.mdl",
      "materials/models/aeron/speeder_104th/body.vtf"
    ];
    var T = 412, left = T;
    window.SetStatusChanged("Retrieving server info...");
    window.SetFilesTotal(T); window.SetFilesNeeded(left);
    var timer = setInterval(function () {
      left = Math.max(0, left - Math.floor(Math.random() * 9 + 3));
      window.SetFilesNeeded(left);
      if (left > 0) window.DownloadingFile(files[Math.floor(Math.random() * files.length)]);
      else { window.SetStatusChanged("Starting Lua..."); fileEl.textContent = ""; clearInterval(timer); }
    }, 300);
  }, 400);
})();
