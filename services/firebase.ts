import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile
} from "firebase/auth";

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
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Export functions to be used by the app
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
};

// Define type as any to avoid runtime import issues with JS bundles
export type FirebaseUser = any;
