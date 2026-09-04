// استيراد مكتبات Firebase عبر ES Modules (بدون الحاجة لـ Build System)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// ضع بيانات مشروعك هنا لاحقاً من Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ضبط الحفاظ على الجلسة محلياً (البقاء مسجلاً للدخول)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("خطأ في حفظ جلسة المصادقة:", error);
});

export { auth, db };
