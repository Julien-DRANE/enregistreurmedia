let mediaRecorder;
let audioChunks = [];
let fileName = "";
let fileUrl = "";

// Compteur
let timerInterval;
let seconds = 0;
const maxSeconds = 180; // ⏱ Durée max en secondes (3 min)

// === Timer ===
function updateTimer() {
  seconds++;
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  document.getElementById("timer").innerText = `⏱ Temps : ${minutes}:${secs}`;

  if (seconds >= maxSeconds) {
    stopRecordingAuto();
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById("timer").innerText = "⏱ Temps : 00:00";
}

// === Générer nom du fichier ===
function genererNomFichier(extension = "mp3") {
  const nom = document.getElementById("nom").value.trim();
  const prenom = document.getElementById("prenom").value.trim();
  const classe = document.getElementById("classe").value.trim();
  const sujet = document.getElementById("sujet").value.trim();

  if (!nom || !prenom || !classe || !sujet) {
    alert("⚠️ Merci de remplir tous les champs.");
    return null;
  }
  return `${nom}-${prenom}-${classe}-${sujet}.${extension}`;
}

// === Mettre à jour lien téléchargement ===
function majLien() {
  const liens = document.getElementById("liens");
  liens.innerHTML = "";
  if (fileUrl && fileName) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    a.textContent = `📥 Télécharger : ${fileName}`;
    li.appendChild(a);
    liens.appendChild(li);
  }
}

// === Enregistrement audio ===
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const player = document.getElementById("player");

startBtn.addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();
  audioChunks = [];

  resetTimer();
  timerInterval = setInterval(updateTimer, 1000);

  mediaRecorder.addEventListener("dataavailable", e => {
    audioChunks.push(e.data);
  });

  mediaRecorder.addEventListener("stop", () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
    fileUrl = URL.createObjectURL(audioBlob);
    fileName = genererNomFichier("mp3");
    player.src = fileUrl;
    majLien();
    resetTimer();
  });

  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener("click", () => {
  stopRecordingManual();
});

function stopRecordingManual() {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearInterval(timerInterval);
}

function stopRecordingAuto() {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearInterval(timerInterval);
  alert("⏱ Temps maximum atteint (3 minutes). L’enregistrement a été arrêté.");
}

// === Téléversement fichier existant ===
const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processFile");
const uploadedPlayer = document.getElementById("uploadedPlayer");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) processBtn.disabled = false;
});

processBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const audioBlob = new Blob([e.target.result], { type: file.type });
    fileUrl = URL.createObjectURL(audioBlob);
    fileName = genererNomFichier(file.type.split("/")[1] || "mp3");
    uploadedPlayer.src = fileUrl;
    majLien();
  };
  reader.readAsArrayBuffer(file);
});

// === Scanner QR Code : start/stop fiables + relance OK ===
let html5QrCode = null;
let scannerRunning = false;

function onDecoded(decodedText) {
  const res = document.getElementById("resultat");
  res.innerHTML = "Résultat : ";

  if (decodedText.startsWith("http")) {
    const link = document.createElement("a");
    link.href = decodedText;
    link.target = "_blank";
    link.textContent = decodedText;
    res.appendChild(link);
    // Redirection auto
    window.open(decodedText, "_blank");
  } else {
    res.innerHTML += decodedText;
  }
}

function onDecodeError(/* errorMessage */) {
  // erreurs mineures ignorées
}

async function startScanner() {
  const readerId = "reader";

  // (Ré)initialise l'instance si besoin
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode(readerId);
  } else {
    // Nettoie l'UI précédente si elle existe
    try { await html5QrCode.clear(); } catch (_) {}
  }

  // Si déjà en cours, on ne double pas
  if (scannerRunning) return;

  const config = { fps: 10, qrbox: 250 };

  // 1) Tentative avec facingMode "environment" (arrière)
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      onDecoded,
      onDecodeError
    );
    scannerRunning = true;
    return;
  } catch (e) {
    // Poursuit vers le repli si facingMode indisponible
  }

  // 2) Repli : liste les caméras et choisit l'arrière si identifiable
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras || !cameras.length) {
      alert("Aucune caméra détectée.");
      return;
    }
    const back = cameras.find(c => c.label.toLowerCase().includes("back"))
               || cameras[0];

    await html5QrCode.start(back.id, config, onDecoded, onDecodeError);
    scannerRunning = true;
  } catch (err) {
    alert("Erreur au démarrage du scanner : " + err);
  }
}

async function stopScanner() {
  if (html5QrCode && scannerRunning) {
    try { await html5QrCode.stop(); } catch (_) {}
    try { await html5QrCode.clear(); } catch (_) {}
    scannerRunning = false;
    document.getElementById("resultat").innerText =
      "Scanner arrêté. Clique sur 🔄 Relancer pour réactiver.";
  }
}

// Démarrage auto au chargement
startScanner();
