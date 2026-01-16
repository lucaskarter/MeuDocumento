import firebase from "firebase/app";
import "firebase/auth";

// --- CONFIGURAÇÃO DO FIREBASE ---
// SUBSTITUA OS VALORES ABAIXO PELAS SUAS CHAVES DO FIREBASE CONSOLE
// Você encontra isso em: Project Settings -> General -> Your apps -> SDK setup and configuration

const firebaseConfig = {
  apiKey: "AIzaSyBEG1fuG6S4l1y00A-Q80aZObbjoNTUDxU",
  authDomain: "meu-documento-ce1d0.firebaseapp.com",
  projectId: "meu-documento-ce1d0",
  storageBucket: "meu-documento-ce1d0.firebasestorage.app",
  messagingSenderId: "530842550274",
  appId: "1:530842550274:web:a20e3e6beafc3df3c4271b"
};

// Initialize Firebase
// Use existing app if initialized to prevent hot-reload errors
const app = !firebase.apps.length 
  ? firebase.initializeApp(firebaseConfig) 
  : firebase.app();

// Export auth instance
export const auth = app.auth();

// Adapters to match Firebase v9 Modular API signatures used in the application
export const signInWithEmailAndPassword = (authInstance: any, email: string, password: string) => {
  return authInstance.signInWithEmailAndPassword(email, password);
};

export const createUserWithEmailAndPassword = (authInstance: any, email: string, password: string) => {
  return authInstance.createUserWithEmailAndPassword(email, password);
};

export const signOut = (authInstance: any) => {
  return authInstance.signOut();
};

export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  return authInstance.onAuthStateChanged(callback);
};

export const updateProfile = (user: any, profile: { displayName?: string, photoURL?: string }) => {
  return user.updateProfile(profile);
};

export type FirebaseUser = any;
