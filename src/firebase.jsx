import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCk4nzkwe_frQDG3IIPtIF2YJWbHvmO3GQ",
  authDomain: "namoro-5256c.firebaseapp.com",
  projectId: "namoro-5256c",
  storageBucket: "namoro-5256c.firebasestorage.app",
  messagingSenderId: "915577104850",
  appId: "1:915577104850:web:7684c219dbe451b8a3000b",
  measurementId: "G-L470JCEMZ4",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// Função para obter token FCM
export const getFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BMQVqTJ7pWHmtNKvhdTOvjXfIKFmjwCe6SIyUmmrbYkTkX39pKFn7p02aTtYsaH9M--MF8kAu2hoPxhuGc8ZlN8", // Substitua pela sua chave VAPID
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter token FCM:", error);
    return null;
  }
};

export default app;
