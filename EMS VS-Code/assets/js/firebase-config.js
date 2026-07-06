import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const firebaseConfig = {
    apiKey: "AIzaSyANAdj0t2xa0nAHDDH9sdxSXsAuTEZKOro",
    authDomain: "employee-management-syst-bb5ff.firebaseapp.com",
    projectId: "employee-management-syst-bb5ff",
    storageBucket: "employee-management-syst-bb5ff.firebasestorage.app",
    messagingSenderId: "399566845235",
    appId: "1:399566845235:web:b51f5060b1f558bebf3a46"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
