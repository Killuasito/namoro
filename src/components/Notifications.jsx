import React, { useState, useEffect } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getNotifications } from "../utils/notifications";

const Notifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!auth.currentUser) return;

      try {
        setLoading(true);
        const notificationData = await getNotifications(auth.currentUser.uid);
        setNotifications(notificationData);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar notificações:", err);
        setError(
          "Não foi possível carregar as notificações. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });

      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);

      const promises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id), {
          read: true,
        })
      );

      await Promise.all(promises);

      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
    }
  };

  const renderNotificationIcon = (type) => {
    switch (type) {
      case "note":
        return <FontAwesomeIcon icon="envelope" className="text-blue-500" />;
      case "quiz":
        return (
          <FontAwesomeIcon icon="question-circle" className="text-purple-500" />
        );
      case "dream":
        return <FontAwesomeIcon icon="star" className="text-amber-500" />;
      case "story":
        return <FontAwesomeIcon icon="book" className="text-green-500" />;
      case "goal":
        return <FontAwesomeIcon icon="bullseye" className="text-emerald-500" />;
      default:
        return <FontAwesomeIcon icon="bell" className="text-gray-500" />;
    }
  };

  const getNotificationLink = (type, itemId) => {
    switch (type) {
      case "note":
        return "/notes";
      case "quiz":
        return "/quiz";
      case "dream":
      case "goal":
        return "/dreams";
      case "story":
        return "/stories";
      default:
        return "/";
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "agora";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d atrás`;

    const months = Math.floor(days / 30);
    return `${months} meses atrás`;
  };

  if (loading) {
    return (
      <div className="w-80 sm:w-96 max-h-[70vh] flex flex-col bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-3 bg-white flex justify-between items-center sticky top-0">
          <h3 className="font-semibold text-pink-500">Notificações</h3>
          <button onClick={onClose} className="text-pink-500">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
        <div className="p-4 flex justify-center">
          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-pink-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 sm:w-96 max-h-[70vh] flex flex-col bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-3 bg-white flex justify-between items-center sticky top-0">
          <h3 className="font-semibold text-pink-500">Notificações</h3>
          <button onClick={onClose} className="text-pink-500">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
        <div className="p-8 text-center text-gray-500">
          <FontAwesomeIcon
            icon="exclamation-circle"
            className="text-3xl mb-2 text-red-300"
          />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 sm:w-96 max-h-[70vh] flex flex-col bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      <div className="p-3 bg-white flex justify-between items-center sticky top-0">
        <h3 className="font-semibold text-pink-500">Notificações</h3>
        <div className="flex space-x-2">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-pink-500 text-xs bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded"
            >
              Marcar todas como lidas
            </button>
          )}
          <button onClick={onClose} className="text-pink-500">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FontAwesomeIcon
              icon="bell-slash"
              className="text-3xl mb-2 text-gray-300"
            />
            <p>Você não tem notificações</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationLink(notification.type, notification.itemId)}
                className={`block p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div
                    className={`p-2 mr-3 rounded-full ${
                      !notification.read ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {renderNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {notification.senderName}
                    </p>
                    <p className="text-sm text-gray-700">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.read && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
