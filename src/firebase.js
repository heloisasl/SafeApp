import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDJb0g7zwFsCGZkvKr3OsBwwS-Ra7seAqo",
  authDomain: "safeapp-c925b.firebaseapp.com",
  databaseURL: "https://safeapp-c925b-default-rtdb.firebaseio.com",
  projectId: "safeapp-c925b",
  storageBucket: "safeapp-c925b.firebasestorage.app",
  messagingSenderId: "1086422967900",
  appId: "1:1086422967900:web:0fa43db0b2f756048fa899"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);