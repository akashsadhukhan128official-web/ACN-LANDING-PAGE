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

// Initialize Firebase (Compat)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Note: No export needed if using as simple scripts, 
// but keeping it for structure if script.js remains a module
export { auth, db };
