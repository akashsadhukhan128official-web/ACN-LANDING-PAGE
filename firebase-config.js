// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYbs9e0aiN7UpD65R2eOLLK7AMhg0aazQ",
    authDomain: "acn-landing-page-8eac8.firebaseapp.com",
    projectId: "acn-landing-page-8eac8",
    storageBucket: "acn-landing-page-8eac8.firebasestorage.app",
    messagingSenderId: "833555392942",
    appId: "1:833555392942:web:215c1e04181dbee4fb803f",
    measurementId: "G-P370MFW18S"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
