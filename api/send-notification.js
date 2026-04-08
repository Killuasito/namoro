const admin = require("firebase-admin");

// Inicializa o Admin SDK uma única vez (warm starts reutilizam a instância)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
  );

  if (!serviceAccount.project_id) {
    console.warn(
      "FIREBASE_SERVICE_ACCOUNT não configurada — push notifications desabilitadas"
    );
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

module.exports = async (req, res) => {
  // Apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Verificar se o Admin SDK foi inicializado
  if (!admin.apps.length) {
    return res
      .status(503)
      .json({ error: "Push notifications não configuradas no servidor" });
  }

  const { recipientId, title, body, type, itemId } = req.body || {};

  if (!recipientId || !title || !body) {
    return res.status(400).json({ error: "recipientId, title e body são obrigatórios" });
  }

  try {
    // Buscar tokens FCM do destinatário no Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(recipientId)
      .get();

    const fcmTokens = userDoc.data()?.fcmTokens || [];

    if (!fcmTokens.length) {
      return res
        .status(200)
        .json({ message: "Usuário sem tokens FCM registrados" });
    }

    // Enviar notificação multicast
    const message = {
      notification: { title, body },
      data: {
        type: type || "general",
        itemId: itemId || "",
        url: type ? `/${type}s` : "/",
      },
      webpush: {
        notification: {
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          requireInteraction: true,
          vibrate: [200, 100, 200],
        },
        fcm_options: { link: type ? `/${type}s` : "/" },
      },
      tokens: fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Remover tokens inválidos/expirados automaticamente
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        (resp.error?.code === "messaging/invalid-registration-token" ||
          resp.error?.code === "messaging/registration-token-not-registered")
      ) {
        invalidTokens.push(fcmTokens[idx]);
      }
    });

    if (invalidTokens.length > 0) {
      const { FieldValue } = admin.firestore;
      await admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .update({ fcmTokens: FieldValue.arrayRemove(...invalidTokens) });
    }

    return res.status(200).json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error) {
    console.error("Erro ao enviar push notification:", error);
    return res.status(500).json({ error: "Erro interno ao enviar notificação" });
  }
};
