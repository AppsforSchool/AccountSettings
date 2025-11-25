import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBaVboaz5qf3FnWybRgFmVQ20YHU9cq7T0",
  authDomain: "appsforschool-study.firebaseapp.com",
  projectId: "appsforschool-study",
  storageBucket: "appsforschool-study.firebasestorage.app",
  messagingSenderId: "740735293440",
  appId: "1:740735293440:web:39dfc03096bb5816ec60e5"
};

// 1. Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// 2. AuthとFirestoreのオブジェクトを取得し、windowにアタッチ
window.auth = getAuth(app);
window.db = getFirestore(app);
window.firebaseApp = app;
