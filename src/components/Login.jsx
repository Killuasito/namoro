import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Falha no login. Verifique suas credenciais.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-pink-300 p-3 w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <FontAwesomeIcon
              icon="heart"
              className="text-3xl sm:text-4xl text-white"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            Nosso Espaço Especial
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Conecte-se para acessar suas memórias compartilhadas
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-5 sm:mb-6 flex items-center animate-shake text-sm">
            <div className="bg-red-100 p-1 sm:p-2 rounded-full mr-2 sm:mr-3">
              <FontAwesomeIcon
                icon="exclamation-circle"
                className="text-red-500"
              />
            </div>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                className="pl-10 sm:pl-12 block w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-gray-50 hover:bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu-email@exemplo.com"
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
                className="pl-10 sm:pl-12 block w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-gray-50 hover:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-pink-300 text-white py-2.5 sm:py-3.5 rounded-lg hover:shadow-lg hover:shadow-primary/20 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 font-medium"
          >
            <FontAwesomeIcon icon="sign-in-alt" />
            Entrar
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center border-t border-gray-200 pt-4 sm:pt-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Ainda não tem uma conta?
          </p>
          <Link
            to="/register"
            className="mt-2 inline-block px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-pink-300 text-pink-300 rounded-lg font-medium hover:bg-pink-300 hover:text-white transition-all duration-300 transform hover:scale-[1.02]"
          >
            <FontAwesomeIcon icon="user-plus" className="mr-2" />
            Criar nova conta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
