/* ============================================================
   PhotoRetouch Pro — Configuration Firebase (module ES)
   ------------------------------------------------------------
   Ce fichier initialise l'application Firebase et exporte les
   instances (Firestore, Storage, Auth, Analytics) utilisées par
   tout le site : data.js, order.html, admin.html, admin-login.html...

   ⚠️ Ce fichier doit être chargé en tant que module :
      <script type="module" src="js/firebase-config.js"></script>
   ou importé via `import ... from "./firebase-config.js"`.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAnalytics,
  isSupported as analyticsIsSupported
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configuration Firebase du projet (fournie par l'utilisateur)
const firebaseConfig = {
  apiKey: "AIzaSyA3DNdHOAsPj1Lw0eOZf1b-axdMDREXo0A",
  authDomain: "agrimaster-1c248.firebaseapp.com",
  projectId: "agrimaster-1c248",
  storageBucket: "agrimaster-1c248.firebasestorage.app",
  messagingSenderId: "741664844765",
  appId: "1:741664844765:web:e172d74fc333f9a600e434",
  measurementId: "G-D48HJNSX7J"
};

// Initialisation de l'app Firebase
export const app = initializeApp(firebaseConfig);

// Services utilisés par PhotoRetouch Pro
export const db = getFirestore(app);       // Firestore → commandes ("orders") + tarifs ("settings")
export const storage = getStorage(app);    // Storage → photos clients & photos retouchées
export const auth = getAuth(app);          // Authentication → accès sécurisé au panneau admin

// Analytics (optionnel, chargé de façon défensive : ne doit jamais bloquer le site
// si le navigateur/réseau ne le supporte pas, ex: environnement de test hors-ligne)
export let analytics = null;
analyticsIsSupported()
  .then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Firebase Analytics indisponible :", e);
      }
    }
  })
  .catch(() => { /* silencieux : pas bloquant pour le reste du site */ });
