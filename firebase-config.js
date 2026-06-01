// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDMKzg3d9-e7twvGHq2xjMUOwmM9uEqQqY",
    authDomain: "acn-landing-login.firebaseapp.com",
    databaseURL: "https://acn-landing-login-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "acn-landing-login",
    storageBucket: "acn-landing-login.firebasestorage.app",
    messagingSenderId: "398411390456",
    appId: "1:398411390456:web:522a91458be1e554a30a0d",
    measurementId: "G-K655SL1GV7"
};

// Check if Firebase is available globally (from CDN)
const fb = window.firebase;

if (!fb) {
    console.error("Firebase CDN scripts not loaded. Check script tags in HTML.");
}

// Initialize Firebase (Compat)
if (fb && !fb.apps.length) {
    fb.initializeApp(firebaseConfig);
}

const auth = fb ? fb.auth() : null;
const db = fb ? fb.firestore() : null;
const analytics = (fb && firebaseConfig.measurementId) ? fb.analytics() : null;

// Export everything for module usage
export { auth, db, analytics };
export default fb;
