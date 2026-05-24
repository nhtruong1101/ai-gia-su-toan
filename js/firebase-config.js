// CẤU HÌNH FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCS5IYJ2F__fiQD4IiR9N6iQkyCa1xzKdk",
  authDomain: "ai-gia-su-toan.firebaseapp.com",
  projectId: "ai-gia-su-toan",
  storageBucket: "ai-gia-su-toan.firebasestorage.app",
  messagingSenderId: "948639287937",
  appId: "1:948639287937:web:6e0d7ebf08c4bd4a68db80",
  measurementId: "G-P1HZL99C0D"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ
const auth = firebase.auth();
const db = firebase.firestore();

// Bật persistence (lưu trữ cache offline) cho Firestore nếu cần
db.enablePersistence().catch(err => {
    console.warn("Lỗi cấu hình Firestore Persistence:", err);
});
