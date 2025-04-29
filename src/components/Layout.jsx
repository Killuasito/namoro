import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const navigation = [
    { name: "Home", path: "/", icon: "home" },
    { name: "Histórias", path: "/stories", icon: "book" },
    { name: "Sonhos e Metas", path: "/dreams", icon: "star" },
    { name: "Notas Especiais", path: "/notes", icon: "envelope" },
    { name: "Quiz do Casal", path: "/quiz", icon: "question-circle" }, // Nova opção no menu
    { name: "Configurações do Casal", path: "/couple-settings", icon: "heart" },
    { name: "Perfil", path: "/profile", icon: "user" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-pink-300 shadow-lg relative z-20">
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

            {/* Menu para desktop */}
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md flex items-center transition-all duration-300 ${
                    location.pathname === item.path
                      ? "bg-white text-pink-300 font-medium shadow-md translate-y-[-2px]"
                      : "text-white hover:bg-white/20 hover:translate-y-[-2px]"
                  }`}
                >
                  <div
                    className={`${
                      location.pathname === item.path ? "bg-primary/10" : ""
                    } p-1 rounded-full mr-2`}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                  </div>
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-md text-white hover:bg-white/20 flex items-center transition-all duration-300 hover:translate-y-[-2px]"
              >
                <div className="p-1 rounded-full mr-2">
                  <FontAwesomeIcon icon="sign-out-alt" />
                </div>
                Sair
              </button>
            </nav>

            {/* Botão do menu para mobile */}
            <button
              className="md:hidden text-white bg-white/20 w-10 h-10 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white/50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <FontAwesomeIcon
                icon={isMobileMenuOpen ? "times" : "bars"}
                size="lg"
              />
            </button>
          </div>
        </div>
      </header>

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

      <main className="flex-grow py-8 px-4">
        <div className="container mx-auto">{children}</div>
      </main>

      <footer className="bg-pink-300 py-6 text-white shadow-inner relative">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
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
