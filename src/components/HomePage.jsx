import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const HomePage = () => {
  const [recentStories, setRecentStories] = useState([]);
  const [recentDreams, setRecentDreams] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      setUser(auth.currentUser);

      try {
        const currentUserId = auth.currentUser?.uid;

        // Carregar histórias recentes - agora usando where() para filtrar antes
        const storiesQuery = query(
          collection(db, "stories"),
          where("authorId", "==", currentUserId),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const storiesSnapshot = await getDocs(storiesQuery);
        const storiesData = storiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentStories(storiesData);

        // Carregar sonhos recentes
        const dreamsQuery = query(
          collection(db, "dreams"),
          where("authorId", "==", currentUserId),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const dreamsSnapshot = await getDocs(dreamsQuery);
        const dreamsData = dreamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentDreams(dreamsData);

        // Carregar notas recentes
        const notesQuery = query(
          collection(db, "notes"),
          where("authorId", "==", currentUserId),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const notesSnapshot = await getDocs(notesQuery);
        const notesData = notesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentNotes(notesData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Bem-vindo ao Nosso Espaço, {user?.displayName || "Querido(a)"}!
          </h2>
          <p className="text-gray-600">
            Um lugar especial para guardar suas memórias e momentos únicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Histórias Recentes */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
              <h3 className="font-bold text-xl text-white flex items-center">
                <FontAwesomeIcon icon="book" className="mr-3" />
                Histórias Recentes
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {recentStories.length > 0 ? (
                recentStories.map((story) => (
                  <div key={story.id} className="p-4 hover:bg-gray-50">
                    <h4 className="font-medium text-gray-800">{story.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {story.content}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                      <span>
                        {story.date &&
                          new Date(story.date).toLocaleDateString()}
                      </span>
                      <span>{story.authorName || user?.displayName}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <FontAwesomeIcon
                    icon="book-open"
                    className="text-3xl mb-2 text-gray-300"
                  />
                  <p>Nenhuma história adicionada ainda.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <Link
                to="/stories"
                className="text-indigo-600 hover:text-indigo-800 text-sm flex justify-center items-center"
              >
                Ver todas histórias
                <FontAwesomeIcon icon="arrow-right" className="ml-1" />
              </Link>
            </div>
          </div>

          {/* Sonhos e Metas */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4">
              <h3 className="font-bold text-xl text-white flex items-center">
                <FontAwesomeIcon icon="star" className="mr-3" />
                Sonhos e Metas
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {recentDreams.length > 0 ? (
                recentDreams.map((dream) => (
                  <div key={dream.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <div
                        className={`mr-3 p-2 rounded-full ${
                          dream.type === "sonho"
                            ? "bg-blue-100"
                            : "bg-emerald-100"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={dream.type === "sonho" ? "star" : "bullseye"}
                          className={`${
                            dream.type === "sonho"
                              ? "text-blue-500"
                              : "text-emerald-500"
                          }`}
                        />
                      </div>
                      <p
                        className={`${
                          dream.completed
                            ? "line-through text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        {dream.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <FontAwesomeIcon
                    icon="star"
                    className="text-3xl mb-2 text-gray-300"
                  />
                  <p>Nenhum sonho ou meta adicionado ainda.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <Link
                to="/dreams"
                className="text-pink-600 hover:text-pink-800 text-sm flex justify-center items-center"
              >
                Ver todos sonhos e metas
                <FontAwesomeIcon icon="arrow-right" className="ml-1" />
              </Link>
            </div>
          </div>

          {/* Notas Especiais */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
              <h3 className="font-bold text-xl text-white flex items-center">
                <FontAwesomeIcon icon="envelope" className="mr-3" />
                Notas Especiais
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {recentNotes.length > 0 ? (
                recentNotes.map((note) => (
                  <div key={note.id} className="p-4 hover:bg-gray-50">
                    <p className="text-gray-800">{note.text}</p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                      <span>
                        {note.createdAt?.toDate?.()
                          ? note.createdAt.toDate().toLocaleDateString()
                          : new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        {note.isPrivate && (
                          <FontAwesomeIcon icon="lock" className="mr-1" />
                        )}
                        {note.authorName || user?.displayName}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <FontAwesomeIcon
                    icon="envelope"
                    className="text-3xl mb-2 text-gray-300"
                  />
                  <p>Nenhuma nota adicionada ainda.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <Link
                to="/notes"
                className="text-amber-600 hover:text-amber-800 text-sm flex justify-center items-center"
              >
                Ver todas notas
                <FontAwesomeIcon icon="arrow-right" className="ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">Ações rápidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/stories"
              className="bg-white p-4 rounded-xl shadow border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 mx-auto bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                <FontAwesomeIcon icon="book" />
              </div>
              <span className="text-sm font-medium">Nova História</span>
            </Link>
            <Link
              to="/dreams"
              className="bg-white p-4 rounded-xl shadow border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 mx-auto bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-2">
                <FontAwesomeIcon icon="star" />
              </div>
              <span className="text-sm font-medium">Novo Sonho/Meta</span>
            </Link>
            <Link
              to="/notes"
              className="bg-white p-4 rounded-xl shadow border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
                <FontAwesomeIcon icon="envelope" />
              </div>
              <span className="text-sm font-medium">Nova Nota</span>
            </Link>
            <Link
              to="/profile"
              className="bg-white p-4 rounded-xl shadow border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <FontAwesomeIcon icon="user" />
              </div>
              <span className="text-sm font-medium">Meu Perfil</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
