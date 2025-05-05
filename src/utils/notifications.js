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
} from "firebase/firestore";
import { db } from "../firebase";
import { requestNotificationPermission } from "../firebase"; // Change this line

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
  if (!recipientId) return; // Não envia notificação se não houver parceiro vinculado

  try {
    // Criar notificação no Firestore
    const notificationData = {
      recipientId,
      senderId,
      senderName,
      type,
      message,
      itemId,
      read: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "notifications"), notificationData);

    // Enviar notificação push via Cloud Function
    // Isso requer uma Cloud Function configurada no Firebase
    const notificationRef = doc(db, "push_notifications", "queue");
    await addDoc(collection(db, "push_notifications"), {
      recipientId,
      notification: {
        title: senderName,
        body: message,
      },
      data: {
        type,
        itemId: itemId || "",
        url: `/${type}s`, // Rota para onde a notificação deve levar
        clickAction: "FLUTTER_NOTIFICATION_CLICK", // Para apps móveis
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: true,
          priority: "max",
          visibility: "public",
        },
      },
      apns: {
        // Para iOS
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      createdAt: serverTimestamp(),
    });

    console.log("Notificação enviada para o parceiro");
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
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
