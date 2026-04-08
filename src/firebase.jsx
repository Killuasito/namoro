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

const VAPID_KEY =
  "BMQVqTJ7pWHmtNKvhdTOvjXfIKFmjwCe6SIyUmmrbYkTkX39pKFn7p02aTtYsaH9M--MF8kAu2hoPxhuGc8ZlN8";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Messaging inicializado de forma lazy para evitar erro em ambientes sem suporte
let _messaging = null;
const getMessagingInstance = () => {
  if (_messaging) return _messaging;
  try {
    _messaging = getMessaging(app);
  } catch (e) {
    console.warn("Firebase Messaging não suportado neste ambiente:", e);
  }
  return _messaging;
};
export { getMessagingInstance as messaging };

// Registra o service worker do Firebase Messaging explicitamente
const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn("Falha ao registrar service worker:", e);
    return null;
  }
};

// Função para solicitar permissão de notificação e obter token FCM
export const requestNotificationPermission = async () => {
  const msg = getMessagingInstance();
  if (!msg) return null;
  if (!("Notification" in window)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const swReg = await registerServiceWorker();
    const tokenOptions = { vapidKey: VAPID_KEY };
    if (swReg) tokenOptions.serviceWorkerRegistration = swReg;

    const token = await getToken(msg, tokenOptions);
    return token || null;
  } catch (error) {
    console.error("Erro ao solicitar permissão de notificação:", error);
    return null;
  }
};

export default app;
