// Firebase Configuration
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
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
