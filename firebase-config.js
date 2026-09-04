// استيراد الدوال اللازمة من مكتبات Firebase SDKs عبر ES Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// إعدادات تطبيق الويب الخاصة بك في Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBl3T97XtYrcfVWNjs4phDPaX1ZcRBCZTE",
  authDomain: "saydalaytiapp.firebaseapp.com",
  projectId: "saydalaytiapp",
  storageBucket: "saydalaytiapp.firebasestorage.app",
  messagingSenderId: "429256719896",
  appId: "1:429256719896:web:fc1af183be1152c3840d6d"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ضبط حفظ الجلسة محلياً لتبقى مفعلة دائماً حتى بعد إغلاق المتصفح أو التطبيق
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("خطأ في ضبط جلسة المصادقة:", error);
});

export { auth, db };
