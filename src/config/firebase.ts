import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase 配置
// 請替換成你的 Firebase 專案配置
const firebaseConfig = {
  apiKey: "AIzaSyCjLjyb09eGbnJP_rp-d2MAwp3mEzg2Yog",
  authDomain: "bi-dashboard-dd0d2.firebaseapp.com",
  projectId: "bi-dashboard-dd0d2",
  storageBucket: "bi-dashboard-dd0d2.firebasestorage.app",
  messagingSenderId: "79787900073",
  appId: "1:79787900073:web:9c5cbcaf35cb4cbaa37db8",
  measurementId: "G-3YCDW1N4FV"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firebase Authentication 並取得 Auth 的參考
export const auth = getAuth(app);

// Google 登入提供者
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
