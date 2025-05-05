import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Notifications from "./Notifications";
import { getUnreadNotificationsCount } from "../utils/notifications";
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

  // Carregar contagem de notificações não lidas
  useEffect(() => {
    if (!auth.currentUser) return;

    // Função para carregar contagem de forma segura
    const fetchUnreadCount = async () => {
      const count = await getUnreadNotificationsCount(auth.currentUser.uid);
      setUnreadCount(count);
    };

    // Carregar na inicialização
    fetchUnreadCount();

    // Atualizar periodicamente (a cada 15 segundos)
    const interval = setInterval(fetchUnreadCount, 15000);

    return () => clearInterval(interval);
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar para desktop */}
      <div
        className={`hidden md:flex flex-col fixed h-full bg-pink-300 text-white shadow-xl transition-all duration-300 z-20 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo/Título */}
        <div className="p-5 flex items-center justify-center border-b border-white/20">
          <Link
            to="/"
            className={`font-bold flex items-center transition-transform duration-300 hover:scale-105 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="bg-white/20 p-2 rounded-full">
              <FontAwesomeIcon icon="heart" className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-cursive tracking-wider ml-2 text-xl">
                Nosso Espaço
              </span>
            )}
          </Link>

          {/* Toggle button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto text-white hover:bg-white/20 p-2 rounded-full"
          >
            <FontAwesomeIcon
              icon={sidebarCollapsed ? "angle-right" : "angle-left"}
            />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-grow py-6 overflow-y-auto scrollbar-thin">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-3 rounded-md flex items-center transition-all duration-200 ${
                  location.pathname === item.path
                    ? "bg-white text-pink-300 font-medium shadow-md"
                    : "text-white hover:bg-white/20"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? item.name : ""}
              >
                <div
                  className={`${
                    location.pathname === item.path ? "bg-primary/10" : ""
                  } p-2 rounded-full ${!sidebarCollapsed ? "mr-3" : ""}`}
                >
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            ))}

            {/* Notifications Button */}
            <button
              onClick={handleNotificationsClick}
              className={`px-3 py-3 rounded-md flex items-center transition-all duration-200 text-white hover:bg-white/20 relative ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Notificações" : ""}
            >
              <div className="p-2 rounded-full relative">
                <FontAwesomeIcon icon="bell" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && <span className="ml-3">Notificações</span>}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className={`px-3 py-3 rounded-md flex items-center transition-all duration-200 text-white hover:bg-white/20 mt-4 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Sair" : ""}
            >
              <div className="p-2 rounded-full">
                <FontAwesomeIcon icon="sign-out-alt" />
              </div>
              {!sidebarCollapsed && <span className="ml-3">Sair</span>}
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/20 text-center text-white/90 text-xs">
          {!sidebarCollapsed && (
            <>
              <p className="font-cursive mb-1">Nosso Espaço Especial</p>
              <p className="flex justify-center items-center">
                <FontAwesomeIcon
                  icon="heart"
                  className="mr-1 text-red-800 animate-pulse"
                />
                {new Date().getFullYear()}
              </p>
            </>
          )}
        </div>
      </div>

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
          className={`absolute ${
            isMobile()
              ? "right-4 top-16"
              : sidebarCollapsed
              ? "left-20"
              : "left-64"
          } z-30 md:top-4`}
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
                className={`block px-4 py-3 rounded-md flex items-center transition-all duration-200 ${
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
        className={`flex-grow md:ml-${
          sidebarCollapsed ? "20" : "64"
        } py-8 px-4 transition-all duration-300`}
        onClick={() => {
          if (notificationsOpen) setNotificationsOpen(false);
          if (isMobile() && isMobileMenuOpen) setIsMobileMenuOpen(false);
        }}
      >
        <div className="container mx-auto">{children}</div>
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
