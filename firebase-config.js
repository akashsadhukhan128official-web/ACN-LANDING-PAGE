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

// Initialize Firebase (Compat)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Note: No export needed if using as simple scripts, 
// but keeping it for structure if script.js remains a module
export { auth, db };
