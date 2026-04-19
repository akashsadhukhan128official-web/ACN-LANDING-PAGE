// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD63IDahWPEXwCHV5VZTHensiJc0GKJvK4",
    authDomain: "landing-final-acn.firebaseapp.com",
    databaseURL: "https://landing-final-acn-default-rtdb.firebaseio.com",
    projectId: "landing-final-acn",
    storageBucket: "landing-final-acn.firebasestorage.app",
    messagingSenderId: "951269356945",
    appId: "1:951269356945:web:0cb9c11201ef0053635630",
    measurementId: "G-MQWFD8RC4C"
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
