let mediaRecorder;
let audioChunks = [];
let fileName = "";
let fileUrl = "";

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

  mediaRecorder.addEventListener("dataavailable", e => {
    audioChunks.push(e.data);
  });

  mediaRecorder.addEventListener("stop", () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
    fileUrl = URL.createObjectURL(audioBlob);
    fileName = genererNomFichier("mp3");
    player.src = fileUrl;
    majLien();
  });

  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener("click", () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

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

// === Scanner QR Code ===
let scanner;
function onScanSuccess(decodedText) {
  document.getElementById("resultat").innerText = "Résultat : " + decodedText;
  if (decodedText.startsWith("http")) {
    window.open(decodedText, "_blank");
  }
}

function onScanError(errorMessage) {
  // ignore erreurs mineures
}

scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
scanner.render(onScanSuccess, onScanError);

function stopScanner() {
  scanner.clear();
}
