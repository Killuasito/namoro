import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { requestNotificationPermission } from "../firebase";

/**
 * Adiciona o token FCM do usuário ao Firestore
 *
 * @param {string} userId - ID do usuário
 */
export const saveUserFCMToken = async (userId) => {
  try {
    const token = await requestNotificationPermission();
    if (token) {
      await updateDoc(doc(db, "users", userId), {
        fcmTokens: arrayUnion(token),
      });
    }
  } catch (error) {
    console.error("Erro ao salvar token FCM:", error);
  }
};

/**
 * Cria uma notificação para o parceiro quando um novo item é adicionado
 *
 * @param {string} recipientId - ID do usuário que receberá a notificação
 * @param {string} senderId - ID do usuário que gerou a notificação
 * @param {string} senderName - Nome do usuário que gerou a notificação
 * @param {string} type - Tipo de notificação: 'note', 'quiz', 'dream', 'story', etc
 * @param {string} message - Mensagem da notificação
 * @param {string} itemId - ID do item relacionado (opcional)
 * @returns {Promise} - Promise da operação de adição da notificação
 */
export const createPartnerNotification = async (
  recipientId,
  senderId,
  senderName,
  type,
  message,
  itemId = null
) => {
  if (!recipientId) return;

  try {
    // 1. Criar notificação no Firestore (in-app em tempo real)
    await addDoc(collection(db, "notifications"), {
      recipientId,
      senderId,
      senderName,
      type,
      message,
      itemId,
      read: false,
      createdAt: serverTimestamp(),
    });

    // 2. Disparar push notification via Vercel API (best-effort)
    try {
      await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          title: senderName,
          body: message,
          type,
          itemId: itemId || "",
        }),
      });
    } catch (pushError) {
      console.warn("Push notification não enviado:", pushError);
    }
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
  }
};

/**
 * Obtém notificações não lidas para um usuário
 *
 * @param {string} userId - ID do usuário
 * @returns {Promise<Number>} - Quantidade de notificações não lidas
 */
export const getUnreadNotificationsCount = async (userId) => {
  if (!userId) return 0;

  try {
    // Consulta simples sem orderBy para evitar necessidade de índice composto
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Erro ao obter contagem de notificações:", error);
    return 0;
  }
};

/**
 * Obtém todas as notificações para um usuário
 * Esta função usa uma abordagem alternativa quando o índice composto não está disponível
 *
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} - Array de notificações
 */
export const getNotifications = async (userId) => {
  if (!userId) return [];

  try {
    // Tentativa 1: Consulta com orderBy (requer índice composto)
    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (indexError) {
      console.log("Índice não disponível, usando fallback", indexError);

      // Fallback: Consulta sem orderBy
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId)
      );

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      // Ordenar manualmente
      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch (error) {
    console.error("Erro ao obter notificações:", error);
    return [];
  }
};

/**
 * Assina em tempo real as notificações de um usuário via onSnapshot
 * Retorna a função de unsubscribe para limpeza no useEffect.
 */
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};

  const q = query(
    collection(db, "notifications"),
    where("recipientId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      }));
      callback(notifications);
    },
    (error) => {
      // Índice composto não criado ainda — fallback sem orderBy
      console.warn("onSnapshot com orderBy falhou, usando fallback:", error);
      const qFallback = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId)
      );
      onSnapshot(qFallback, (snapshot) => {
        const notifications = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        callback(notifications);
      });
    }
  );
};

/**
 * Assina em tempo real a contagem de notificações não lidas
 * Retorna a função de unsubscribe para limpeza no useEffect.
 */
export const subscribeToUnreadCount = (userId, callback) => {
  if (!userId) return () => {};

  const q = query(
    collection(db, "notifications"),
    where("recipientId", "==", userId),
    where("read", "==", false)
  );

  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.size),
    (error) => {
      console.warn("Erro ao assinar contagem não lida:", error);
      callback(0);
    }
  );
};
