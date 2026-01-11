
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCKGbzufmkvApb6YPzBmk5ngI5jeb_itZ8",
  authDomain: "bolo-india-13b72.firebaseapp.com",
  projectId: "bolo-india-13b72",
  storageBucket: "bolo-india-13b72.firebasestorage.app",
  messagingSenderId: "762390212484",
  appId: "1:762390212484:web:60f18aa3069a47214337d1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
