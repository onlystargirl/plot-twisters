// ═══════════════════════════════════════════════════════════════
//  PLOT TWISTERS — Firebase Configuration (Compat Mode for file:// & Server)
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey:            "AIzaSyAUHHPTPr1rit12q0QD9EChUzevJtHCRQU",
    authDomain:        "plot-twisters-b092e.firebaseapp.com",
    projectId:         "plot-twisters-b092e",
    storageBucket:     "plot-twisters-b092e.firebasestorage.app",
    messagingSenderId: "988463090567",
    appId:             "1:988463090567:web:05342d72b72d887c30e122",
    measurementId:     "G-H9D93Y4VZY"
};

// Inizializza Firebase usando la libreria compatibile globale (evita errori CORS offline)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.auth = firebase.auth();
    window.db   = firebase.firestore();
    console.log("✦ Firebase inizializzato correttamente!");
} else {
    console.warn("⚠️ Firebase SDK non rilevato. Verifica la connessione a Internet.");
}