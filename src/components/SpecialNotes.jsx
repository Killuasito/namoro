import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SpecialNotes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentUserId = auth.currentUser?.uid;

      const filteredNotes = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (note) =>
            !note.isPrivate ||
            note.authorId === currentUserId ||
            note.recipientId === currentUserId
        );

      setNotes(filteredNotes);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addDoc(collection(db, "notes"), {
        text: newNote,
        isPrivate: isPrivate,
        authorId: auth.currentUser?.uid,
        authorName: auth.currentUser?.displayName || "Anônimo",
        createdAt: new Date(),
      });
      setNewNote("");
      setIsPrivate(false);
    } catch (error) {
      console.error("Erro ao adicionar nota:", error);
    }
  };

  const deleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (error) {
      console.error("Erro ao deletar nota:", error);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
          <div className="bg-primary text-pink-300 p-3 rounded-lg shadow-md mr-4">
            <FontAwesomeIcon icon="envelope" />
          </div>
          <span className="text-primary">Nossas Notas Especiais</span>
        </h2>

        <div className="mb-10 bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-semibold text-xl mb-6 text-gray-700 flex items-center">
            <div className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
              <FontAwesomeIcon icon="envelope" />
            </div>
            Adicionar Nova Nota
          </h3>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              <FontAwesomeIcon icon="comment-dots" className="mr-2" /> Sua
              mensagem
            </label>
            <textarea
              placeholder="Escreva uma mensagem especial para guardar ou compartilhar..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 h-32"
            />
          </div>

          <div className="flex items-center mb-5 bg-gray-50 p-4 rounded-lg">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mr-3 h-5 w-5 accent-primary cursor-pointer"
            />
            <label
              htmlFor="isPrivate"
              className="text-gray-700 flex items-center cursor-pointer"
            >
              <FontAwesomeIcon icon="lock" className="mr-2 text-primary" />
              Nota privada (somente você e seu par podem ver)
            </label>
          </div>

          <button
            onClick={handleAddNote}
            className="px-6 py-3 bg-pink-300 text-white rounded-lg hover:shadow-lg hover:shadow-primary/20 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon="envelope" />
            Enviar Nota
          </button>
        </div>

        <div className="space-y-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-6 rounded-xl shadow-md border transition-all duration-300 ${
                note.isPrivate
                  ? "bg-rose-50 border-pink-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  {note.isPrivate && (
                    <div className="mb-3 inline-flex items-center bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded-full">
                      <FontAwesomeIcon icon="lock" className="mr-1" size="xs" />
                      Privado
                    </div>
                  )}

                  <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                    {note.text}
                  </p>

                  <div className="mt-4 flex items-center">
                    {note.authorId === auth.currentUser?.uid ? (
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center">
                        <FontAwesomeIcon icon="user" className="mr-1" />
                        Você
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs flex items-center">
                        <FontAwesomeIcon icon="user" className="mr-1" />
                        {note.authorName}
                      </div>
                    )}

                    <span className="text-gray-400 mx-2">•</span>

                    <div className="text-xs text-gray-500 flex items-center">
                      <FontAwesomeIcon icon="calendar-alt" className="mr-1" />
                      {note.createdAt?.toDate().toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {note.authorId === auth.currentUser?.uid && (
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors p-2 rounded-full"
                    title="Excluir nota"
                  >
                    <FontAwesomeIcon icon="trash" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon
                  icon="envelope"
                  className="text-4xl text-gray-400"
                />
              </div>
              <p className="text-gray-500 text-lg mb-4">
                Nenhuma nota adicionada ainda.
              </p>
              <p className="text-gray-400">
                Compartilhe pensamentos especiais com seu par!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialNotes;
