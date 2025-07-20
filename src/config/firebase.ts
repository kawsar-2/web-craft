import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBpOl0omIJnpELy_Gc7NNxqCVFRulsfAOA",
  authDomain: "webcraft-cb011.firebaseapp.com",
  projectId: "webcraft-cb011",
  storageBucket: "webcraft-cb011.firebasestorage.app",
  messagingSenderId: "1031665697201",
  appId: "1:1031665697201:web:991f8dd67319e3ffebbd90",
  measurementId: "G-BS64FJGMKC",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export default app;
