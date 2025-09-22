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

// === Scanner QR Code avec caméra arrière forcée ===
let html5QrCode;

function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      // Cherche la caméra arrière
      let backCamera = cameras.find(cam => cam.label.toLowerCase().includes("back"));
      let cameraId = backCamera ? backCamera.id : cameras[0].id;

      html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        decodedText => {
          const res = document.getElementById("resultat");
          res.innerHTML = "Résultat : ";

          if (decodedText.startsWith("http")) {
            const link = document.createElement("a");
            link.href = decodedText;
            link.target = "_blank";
            link.textContent = decodedText;
            res.appendChild(link);

            // 🚀 Redirection auto
            window.open(decodedText, "_blank");
          } else {
            res.innerHTML += decodedText;
          }
        },
        errorMessage => {
          // ignore les erreurs mineures
        }
      );
    }
  }).catch(err => {
    alert("Impossible d’accéder à la caméra : " + err);
  });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      document.getElementById("resultat").innerText = "Scanner arrêté.";
    });
  }
}

// Démarre automatiquement le scanner à l'ouverture de la page
startScanner();
