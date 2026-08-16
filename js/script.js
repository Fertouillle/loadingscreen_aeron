/* ============================================================
   Flotte Aeron — Loading Screen logic
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- config ---------------- */

  const CONFIG = {
    // TODO: mets tes vrais liens ici (affichage indicatif uniquement,
    // le loading screen n'est pas cliquable)
    discordTag: "discord.gg/aeron",
    websiteTag: "flotte-aeron.net",

    // La liste des images de fond est dans index.html (balises <img
    // class="bg-slide">), pas ici : ça garantit que la première image
    // s'affiche même si le JS ne tourne pas. Pour changer les images,
    // ajoute/retire des <img> dans index.html.
    backgroundIntervalMs: 7000,

    // Optionnel : endpoint HTTP (ton propre site) qui retourne
    // { "name": "...", "avatar": "https://..." } pour un steamid64 donné.
    // Nécessaire car Steam exige une clé API côté serveur pour récupérer
    // pseudo/avatar — impossible de le faire en JS pur côté client sans
    // exposer ta clé. Laisse vide pour garder le fallback générique.
    // Exemple d'URL appelée : `${steamProfileEndpoint}?steamid=76561198...`
    steamProfileEndpoint: "",

    tips: [
      "Utilisez /calc pour ouvrir la calculatrice holographique.",
      "Chaque faction dispose de sa propre hiérarchie et de ses propres missions.",
      "Le respect du RP et des ordres hiérarchiques est obligatoire sur Aeron.",
      "Rejoignez notre Discord pour suivre les événements de la flotte.",
      "Les clones peuvent personnaliser leur armure une fois promus.",
      "Un doute en jeu ? Un Staff est toujours disponible en support.",
    ],
  };

  /* ---------------- tips carousel ---------------- */

  const tipEl = document.getElementById("tip-text");
  let tipIndex = 0;

  function showTip(index) {
    tipEl.style.opacity = 0;
    setTimeout(() => {
      tipEl.textContent = CONFIG.tips[index % CONFIG.tips.length];
      tipEl.style.opacity = 1;
    }, 220);
  }
  showTip(tipIndex);
  setInterval(() => {
    tipIndex++;
    showTip(tipIndex);
  }, 6000);

  /* ---------------- links (affichage seulement) ---------------- */

  document.getElementById("link-discord").textContent = CONFIG.discordTag;
  document.getElementById("link-web").textContent = CONFIG.websiteTag;

  /* ---------------- rotating full-screen background ---------------- */
  /* Les <img> existent déjà dans le HTML (voir index.html) : la première
     a la classe "is-active" en dur, donc elle s'affiche même sans JS.
     Ce script se contente de faire tourner la classe entre elles.       */

  const bgSlides = Array.from(document.querySelectorAll(".bg-slide"));
  let bgIndex = 0;

  function nextBackground() {
    if (bgSlides.length < 2) return;
    bgSlides[bgIndex].classList.remove("is-active");
    bgIndex = (bgIndex + 1) % bgSlides.length;
    bgSlides[bgIndex].classList.add("is-active");
  }

  if (bgSlides.length > 1) {
    setInterval(nextBackground, CONFIG.backgroundIntervalMs);
  }

  /* ---------------- player identity (top-left) ---------------- */

  const avatarEl = document.getElementById("player-avatar");
  const nameEl = document.getElementById("player-name");

  function setPlayerAvatar(url) {
    if (!url) return;
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    avatarEl.innerHTML = "";
    avatarEl.appendChild(img);
  }

  function loadSteamProfile(steamid64) {
    if (!CONFIG.steamProfileEndpoint || !steamid64) return;
    fetch(`${CONFIG.steamProfileEndpoint}?steamid=${encodeURIComponent(steamid64)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.name) nameEl.textContent = data.name;
        if (data.avatar) setPlayerAvatar(data.avatar);
      })
      .catch(() => {});
  }

  /* ---------------- map (top-right) ---------------- */

  const mapEl = document.getElementById("map-name");

  /* ---------------- progress engine (center) ---------------- */

  const statusEl = document.getElementById("loading-status");
  const percentEl = document.getElementById("percent-value");
  const fillEl = document.getElementById("progress-fill");

  let filesTotal = 0;
  let filesNeeded = 0;
  let usingRealData = false;

  function applyProgress(current, total) {
    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    percentEl.textContent = pct;
    fillEl.style.width = pct + "%";

    if (pct < 15) statusEl.textContent = "Connexion au serveur…";
    else if (pct < 60) statusEl.textContent = "Téléchargement des ressources…";
    else if (pct < 95) statusEl.textContent = "Préparation de la flotte…";
    else statusEl.textContent = "Finalisation…";
  }

  // ---- GMod engine hooks (called directly by the game) ----
  // Noms et signatures officiels (wiki.facepunch.com/gmod/Loading_URL).

  window.SetFilesTotal = function (total) {
    usingRealData = true;
    filesTotal = total;
    applyProgress(filesNeeded === 0 ? 0 : filesTotal - filesNeeded, filesTotal);
  };

  window.SetFilesNeeded = function (needed) {
    usingRealData = true;
    filesNeeded = needed;
    applyProgress(Math.max(0, filesTotal - filesNeeded), filesTotal);
  };

  window.DownloadingFile = function () {
    usingRealData = true;
  };

  let identityReceived = false;

  // GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode)
  window.GameDetails = function (servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    identityReceived = true;
    if (mapname) mapEl.textContent = mapname;
    if (steamid) loadSteamProfile(steamid);
  };

  /* ---------------- browser preview simulation ---------------- */
  /* Ne s'applique que si le moteur GMod n'a pas appelé GameDetails
     après un court délai (c'est-à-dire quand on prévisualise ce
     fichier dans un navigateur, hors du jeu).                      */

  setTimeout(() => {
    if (!identityReceived) {
      mapEl.textContent = "rp_venator_aeron_v3";
      nameEl.textContent = "Ferty (aperçu)";
    }
  }, 500);

  const DEMO_TOTAL = 340;
  let demoCurrent = 0;

  const demoInterval = setInterval(() => {
    if (usingRealData) {
      clearInterval(demoInterval);
      return;
    }
    demoCurrent += Math.random() * 14 + 4;
    if (demoCurrent >= DEMO_TOTAL) {
      demoCurrent = DEMO_TOTAL;
      clearInterval(demoInterval);
    }
    applyProgress(Math.floor(demoCurrent), DEMO_TOTAL);
  }, 260);
})();
