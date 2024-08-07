// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCfh8TtSM9EF89OGMb7BzFiIwmhbW8JxRM",
  authDomain: "inventory-management-1f37a.firebaseapp.com",
  projectId: "inventory-management-1f37a",
  storageBucket: "inventory-management-1f37a.appspot.com",
  messagingSenderId: "765551036163",
  appId: "1:765551036163:web:94db557887874111464b36",
  measurementId: "G-W4PES9FCE4"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const firestore = getFirestore(app); 
const auth = getAuth(app);

export const signUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logOut = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export {firestore, auth};

