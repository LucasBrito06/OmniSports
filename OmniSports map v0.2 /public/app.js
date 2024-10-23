import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn-QjHh9GTBVap2g8dQ30Apukmo2ZGmY8",
  authDomain: "omnisport-e5b1b.firebaseapp.com",
  projectId: "omnisport-e5b1b",
  storageBucket: "omnisport-e5b1b.appspot.com",
  messagingSenderId: "857774118262",
  appId: "1:857774118262:web:3aec65c7442d60d67a5657",
  measurementId: "G-04PWV38R02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("Firebase App:", app);
console.log("Firebase Analytics:", analytics);
console.log("App running without localhost.");