import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Notifications from "./Notifications";
import { subscribeToUnreadCount } from "../utils/notifications";
import { requestNotificationPermission } from "../firebase";

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleNotificationsClick = async () => {
    if (!notificationsOpen) {
      await requestNotificationPermission();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  // Assina em tempo real a contagem de notificações não lidas
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeToUnreadCount(
      auth.currentUser.uid,
      setUnreadCount
    );
    return unsubscribe;
  }, []);

  const navigation = [
    { name: "Home", path: "/", icon: "home" },
    { name: "Histórias", path: "/stories", icon: "book" },
    { name: "Sonhos e Metas", path: "/dreams", icon: "star" },
    { name: "Notas Especiais", path: "/notes", icon: "envelope" },
    { name: "Quiz do Casal", path: "/quiz", icon: "question-circle" },
    { name: "Configurações do Casal", path: "/couple-settings", icon: "heart" },
    { name: "Perfil", path: "/profile", icon: "user" },
    { name: "Jogos", path: "/games", icon: "gamepad" },
  ];

  // Função para verificar se está em dispositivo móvel
  const isMobile = () => {
    return window.innerWidth < 768;
  };

  const sidebarWidth = sidebarCollapsed ? "5rem" : "16rem";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar para desktop */}
      <aside
        style={{ width: sidebarWidth }}
        className="hidden md:flex flex-col fixed top-0 left-0 h-full bg-pink-300 text-white shadow-xl transition-[width] duration-300 z-20 shrink-0"
      >
        {/* Logo/Título */}
        <div className="p-4 flex items-center border-b border-white/20 min-h-[64px]">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity overflow-hidden"
            title="Nosso Espaço"
          >
            <div className="bg-white/20 p-2 rounded-full shrink-0">
              <FontAwesomeIcon icon="heart" className="text-white w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-cursive tracking-wider text-lg whitespace-nowrap overflow-hidden">
                Nosso Espaço
              </span>
            )}
          </Link>

          {/* Toggle button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto shrink-0 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <FontAwesomeIcon
              icon={sidebarCollapsed ? "angle-right" : "angle-left"}
            />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow py-4 overflow-y-auto space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={item.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-white text-pink-400 font-semibold shadow"
                  : "text-white hover:bg-white/20"
              } ${sidebarCollapsed ? "justify-center" : ""}`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm whitespace-nowrap overflow-hidden">
                  {item.name}
                </span>
              )}
            </Link>
          ))}

          {/* Notifications Button */}
          <button
            onClick={handleNotificationsClick}
            title="Notificações"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white hover:bg-white/20 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <span className="relative shrink-0">
              <FontAwesomeIcon icon="bell" className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[10px] text-white rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            {!sidebarCollapsed && (
              <span className="text-sm whitespace-nowrap">Notificações</span>
            )}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            title="Sair"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white hover:bg-white/20 mt-2 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <FontAwesomeIcon icon="sign-out-alt" className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm whitespace-nowrap">Sair</span>
            )}
          </button>
        </nav>

        {/* Footer info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-white/20 text-center text-white/80 text-xs">
            <p className="font-cursive mb-1">Nosso Espaço Especial</p>
            <p className="flex justify-center items-center gap-1">
              <FontAwesomeIcon icon="heart" className="text-red-800 animate-pulse" />
              {new Date().getFullYear()}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="bg-pink-300 shadow-lg relative z-20 md:hidden">
        <div className="container mx-auto px-4 relative">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/"
              className="font-bold text-xl text-white flex items-center transition-transform duration-300 hover:scale-105"
            >
              <div className="bg-white/20 p-2 rounded-full mr-2">
                <FontAwesomeIcon icon="heart" className="text-white" />
              </div>
              <span className="font-cursive tracking-wider">Nosso Espaço</span>
            </Link>

            {/* Botão do menu e notificações para mobile */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNotificationsClick}
                className="text-white relative p-2"
              >
                <FontAwesomeIcon icon="bell" size="lg" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-0 -translate-y-1 bg-red-500 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <button
                className="text-white bg-white/20 w-10 h-10 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white/50"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <FontAwesomeIcon
                  icon={isMobileMenuOpen ? "times" : "bars"}
                  size="lg"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dropdown de notificações */}
      {notificationsOpen && (
        <div
          style={{ left: isMobile() ? undefined : sidebarWidth }}
          className={`fixed z-30 ${
            isMobile() ? "right-4 top-[72px]" : "top-4"
          }`}
        >
          <Notifications onClose={() => setNotificationsOpen(false)} />
        </div>
      )}

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-xl border-t border-gray-100 fixed inset-x-0 top-[72px] z-10 animate-slideDown">
          <div className="px-2 pt-2 pb-3 space-y-1 max-h-[70vh] overflow-auto">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-md items-center transition-all duration-200 ${
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-medium border-l-4 border-pink-300"
                    : "hover:bg-gray-50 text-gray-700 hover:translate-x-1"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className={`${
                    location.pathname === item.path
                      ? "bg-pink-300 text-white"
                      : "bg-gray-100 text-pink-300"
                  } p-2 rounded-full mr-3 w-10 h-10 flex items-center justify-center`}
                >
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-50 text-gray-700 flex items-center transition-all duration-200 hover:translate-x-1"
            >
              <div className="bg-gray-100 text-pink-300 p-2 rounded-full mr-3 w-10 h-10 flex items-center justify-center">
                <FontAwesomeIcon icon="sign-out-alt" />
              </div>
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        style={{ marginLeft: sidebarWidth }}
        className="hidden md:block flex-grow min-w-0 py-8 px-6 transition-[margin] duration-300"
        onClick={() => {
          if (notificationsOpen) setNotificationsOpen(false);
        }}
      >
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Mobile main content (sem margin, sem sidebar) */}
      <main
        className="md:hidden flex-grow min-w-0 py-6 px-4"
        onClick={() => {
          if (notificationsOpen) setNotificationsOpen(false);
          if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        }}
      >
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Footer mobile */}
      <footer className="bg-pink-300 py-6 text-white shadow-inner relative md:hidden">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col justify-between items-center">
            <div className="mb-4">
              <p className="font-cursive text-xl">Nosso Espaço Especial</p>
              <p className="text-white/90 text-sm">
                Compartilhe momentos especiais com quem você ama
              </p>
            </div>
            <p className="text-sm flex items-center">
              © {new Date().getFullYear()} | Criado com
              <FontAwesomeIcon
                icon="heart"
                className="mx-1 text-red-800 animate-pulse"
              />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
