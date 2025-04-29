import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Substituindo foto de perfil por seleção de ícone
  const [preferredIcon, setPreferredIcon] = useState("user");
  const [iconColor, setIconColor] = useState("bg-blue-500");

  // Lista de ícones disponíveis
  const availableIcons = [
    { icon: "user", label: "Perfil" },
    { icon: "heart", label: "Coração" },
    { icon: "star", label: "Estrela" },
    { icon: "smile", label: "Sorriso" },
    { icon: "music", label: "Música" },
    { icon: "book", label: "Livro" },
    { icon: "coffee", label: "Café" },
    { icon: "camera", label: "Câmera" },
    { icon: "moon", label: "Lua" },
    { icon: "sun", label: "Sol" },
  ];

  // Opções de cores disponíveis
  const colorOptions = [
    "bg-pink-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Criar a conta do usuário
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 2. Atualizar o perfil do usuário com o nome
      await updateProfile(user, {
        displayName,
        // Removendo photoURL pois usaremos ícones
      });

      // 3. Criar documento do usuário no Firestore com ícone e cor selecionados
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName,
        email,
        preferredIcon, // Salvando o ícone preferido
        iconColor, // Salvando a cor do ícone
        createdAt: new Date(),
        favorites: [],
        bio: "",
        dateOfBirth: "",
        relationship: {
          partnerId: "", // ID do parceiro, será preenchido depois
          anniversary: "",
          status: "single", // "single", "in-relationship", "engaged", etc.
        },
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      setError("Falha ao criar conta. " + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 py-6 px-4">
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-pink-300 p-3 w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <FontAwesomeIcon
              icon="user-plus"
              className="text-3xl sm:text-4xl text-white"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            Criar Sua Conta
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Junte-se ao seu espaço especial de memórias
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-5 sm:mb-6 flex items-center animate-shake text-sm">
            <div className="bg-red-100 p-1 sm:p-2 rounded-full mr-2 sm:mr-3">
              <FontAwesomeIcon
                icon="exclamation-circle"
                className="text-red-500"
              />
            </div>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">
              Nome
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-gray-400">
                <FontAwesomeIcon icon="user" />
              </div>
              <input
                type="text"
                className="pl-10 sm:pl-12 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-gray-50 hover:bg-white"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-gray-400">
                <FontAwesomeIcon icon="envelope" />
              </div>
              <input
                type="email"
                className="pl-10 sm:pl-12 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-gray-50 hover:bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-gray-400">
                <FontAwesomeIcon icon="lock" />
              </div>
              <input
                type="password"
                className="pl-10 sm:pl-12 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-gray-50 hover:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Substituindo upload de foto por seletor de ícones */}
          <div className="mb-1 sm:mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">
              Escolha seu ícone de perfil
            </label>

            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              {/* Seletor de ícone */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 ${iconColor} rounded-full flex items-center justify-center shadow-md`}
                >
                  <FontAwesomeIcon
                    icon={preferredIcon}
                    className="text-2xl sm:text-3xl text-white"
                  />
                </div>
              </div>

              {/* Grade de ícones */}
              <div className="grid grid-cols-5 gap-1 sm:gap-3 mb-3 sm:mb-4">
                {availableIcons.map((item) => (
                  <div
                    key={item.icon}
                    onClick={() => setPreferredIcon(item.icon)}
                    className={`cursor-pointer flex flex-col items-center p-1 sm:p-2 rounded-lg transition-all ${
                      preferredIcon === item.icon
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-white hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                        preferredIcon === item.icon ? iconColor : "bg-gray-200"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={item.icon}
                        className="text-white text-xs"
                      />
                    </div>
                    <span className="text-[9px] sm:text-xs mt-0.5 sm:mt-1">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Seletor de cores */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 sm:mb-2">
                  Cor do ícone
                </label>
                <div className="grid grid-cols-8 gap-1 sm:gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setIconColor(color)}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${color} ${
                        iconColor === color
                          ? "ring-2 ring-offset-1 sm:ring-offset-2 ring-gray-700"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 sm:py-3 rounded-lg text-white flex items-center justify-center gap-2 font-medium ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transform hover:scale-[1.02] transition-all duration-300"
            }`}
          >
            <FontAwesomeIcon
              icon={loading ? "spinner" : "user-plus"}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>

          <div className="text-center border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
            <p className="text-gray-600 mb-2 text-sm sm:text-base">
              Já tem uma conta?
            </p>
            <Link
              to="/login"
              className="inline-block px-4 sm:px-6 py-1.5 sm:py-2.5 border-2 border-pink-300 text-pink-300 rounded-lg font-medium hover:bg-pink-300 hover:text-white transition-all duration-300"
            >
              <FontAwesomeIcon icon="sign-in-alt" className="mr-2" />
              Fazer login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
