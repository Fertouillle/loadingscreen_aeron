<?php
/**
 * Proxy Steam profile lookup.
 *
 * Pourquoi ce fichier existe : Steam exige une clé API privée pour
 * récupérer le pseudo/avatar d'un joueur (endpoint GetPlayerSummaries).
 * Cette clé ne doit JAMAIS être exposée côté client (n'importe qui pourrait
 * la voler et l'utiliser à ta place). Ce script tourne sur TON hébergement
 * web, garde la clé côté serveur, et ne renvoie au loading screen que le
 * strict nécessaire (pseudo + URL d'avatar).
 *
 * Installation :
 *   1. Récupère une clé gratuite : https://steamcommunity.com/dev/apikey
 *   2. Remplace STEAM_API_KEY ci-dessous par ta clé.
 *   3. Dépose ce fichier sur ton hébergement (doit supporter PHP), par ex. :
 *      https://flotte-aeron.net/steam-profile.php
 *   4. Dans js/script.js, mets CONFIG.steamProfileEndpoint sur cette URL.
 */

const STEAM_API_KEY = "METS_TA_CLE_ICI";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$steamid = $_GET["steamid"] ?? "";

if (!preg_match('/^\d{17}$/', $steamid)) {
    http_response_code(400);
    echo json_encode(["error" => "steamid invalide"]);
    exit;
}

if (STEAM_API_KEY === "METS_TA_CLE_ICI") {
    http_response_code(500);
    echo json_encode(["error" => "clé API non configurée"]);
    exit;
}

$url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
     . "?key=" . urlencode(STEAM_API_KEY)
     . "&steamids=" . urlencode($steamid);

$response = @file_get_contents($url);
if ($response === false) {
    http_response_code(502);
    echo json_encode(["error" => "requête Steam échouée"]);
    exit;
}

$data = json_decode($response, true);
$player = $data["response"]["players"][0] ?? null;

if (!$player) {
    http_response_code(404);
    echo json_encode(["error" => "profil introuvable"]);
    exit;
}

echo json_encode([
    "name" => $player["personaname"] ?? "",
    "avatar" => $player["avatarfull"] ?? "",
]);
