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
      <header className="bg-pink-300 shadow-lg fixed top-0 inset-x-0 z-20 md:hidden h-16 flex items-center px-4">
        <button
          className="text-white bg-white/20 w-10 h-10 flex items-center justify-center rounded-full focus:outline-none"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <FontAwesomeIcon icon="bars" />
        </button>

        <Link
          to="/"
          className="flex-1 flex items-center justify-center gap-2 font-bold text-white"
        >
          <div className="bg-white/20 p-1.5 rounded-full">
            <FontAwesomeIcon icon="heart" />
          </div>
          <span className="font-cursive tracking-wider text-lg">Nosso Espaço</span>
        </Link>

        <button
          onClick={handleNotificationsClick}
          className="text-white relative w-10 h-10 flex items-center justify-center"
          aria-label="Notificações"
        >
          <FontAwesomeIcon icon="bell" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-[10px] text-white rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Mobile: Overlay escuro */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile: Drawer deslizante */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-pink-300 text-white shadow-2xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabeçalho do drawer */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/20 shrink-0">
          <div className="flex items-center gap-2 font-bold">
            <div className="bg-white/20 p-2 rounded-full">
              <FontAwesomeIcon icon="heart" />
            </div>
            <span className="font-cursive tracking-wider text-lg">Nosso Espaço</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Fechar menu"
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="flex-grow overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-white text-pink-400 font-semibold shadow"
                  : "text-white hover:bg-white/20"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Notificações */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNotificationsClick();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
          >
            <span className="relative shrink-0 w-4 h-4">
              <FontAwesomeIcon icon="bell" className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[10px] text-white rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <span>Notificações</span>
          </button>
        </nav>

        {/* Rodapé do drawer */}
        <div className="shrink-0 border-t border-white/20 p-4">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
          >
            <FontAwesomeIcon icon="sign-out-alt" className="w-4 h-4 shrink-0" />
            <span>Sair</span>
          </button>
          <p className="text-center text-white/60 text-xs mt-3">
            © {new Date().getFullYear()} Nosso Espaço
          </p>
        </div>
      </div>

      {/* Dropdown de notificações */}
      {notificationsOpen && (
        <div
          style={{ left: isMobile() ? undefined : sidebarWidth }}
          className={`fixed z-50 ${
            isMobile() ? "right-2 top-[68px]" : "top-4"
          }`}
        >
          <Notifications onClose={() => setNotificationsOpen(false)} />
        </div>
      )}
      <main
        style={{ marginLeft: sidebarWidth }}
        className="hidden md:block flex-grow min-w-0 py-8 px-6 transition-[margin] duration-300"
        onClick={() => {
          if (notificationsOpen) setNotificationsOpen(false);
        }}
      >
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Mobile main content */}
      <main
        className="md:hidden flex-grow min-w-0 pt-20 pb-6 px-4"
        onClick={() => {
          if (notificationsOpen) setNotificationsOpen(false);
        }}
      >
        <div className="max-w-5xl mx-auto">{children}</div>

        {/* Footer mobile */}
        <footer className="mt-10 pt-6 border-t border-pink-200 text-center text-gray-400 text-xs">
          <p className="font-cursive text-sm text-pink-400 mb-1">Nosso Espaço Especial</p>
          <p className="flex items-center justify-center gap-1">
            © {new Date().getFullYear()} | Criado com
            <FontAwesomeIcon icon="heart" className="text-pink-300 animate-pulse" />
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
