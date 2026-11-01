import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Existing public Web App configuration. Authorization is enforced by Firestore Rules.
const app = initializeApp({
 apiKey: "AIzaSyBPoMa6phE5NLgiulXslenF1ghkW7e6Iig",
 authDomain: "shinjukugyoensimulate.firebaseapp.com",
 projectId: "shinjukugyoensimulate",
 storageBucket: "shinjukugyoensimulate.firebasestorage.app",
 messagingSenderId: "1045334579409",
 appId: "1:1045334579409:web:46296f34455ec6d92f8df0",
});
export const db = getFirestore(app);
