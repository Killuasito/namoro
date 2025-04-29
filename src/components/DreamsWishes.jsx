import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const DreamsWishes = () => {
  const [dreams, setDreams] = useState([]);
  const [newDream, setNewDream] = useState("");
  const [dreamType, setDreamType] = useState("meta"); // meta ou sonho

  useEffect(() => {
    const q = query(collection(db, "dreams"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDreams(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  const handleAddDream = async () => {
    if (!newDream.trim()) return;

    try {
      await addDoc(collection(db, "dreams"), {
        text: newDream,
        type: dreamType,
        completed: false,
        createdAt: new Date(),
      });
      setNewDream("");
    } catch (error) {
      console.error("Erro ao adicionar sonho/meta:", error);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      const dreamRef = doc(db, "dreams", id);
      await updateDoc(dreamRef, {
        completed: !currentStatus,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const deleteDream = async (id) => {
    try {
      await deleteDoc(doc(db, "dreams", id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
          <div className="bg-primary text-pink-300 p-3 rounded-lg shadow-md mr-4">
            <FontAwesomeIcon icon="star" />
          </div>
          <span className="text-primary">Nossos Sonhos e Metas</span>
        </h2>

        <div className="mb-10 bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-semibold text-xl mb-6 text-gray-700 flex items-center">
            <FontAwesomeIcon icon="plus" className="mr-3 text-primary" />
            Adicionar Novo
          </h3>

          <div className="flex flex-col gap-5">
            {/* Modificando para colocar os tipos um abaixo do outro em vez de lado a lado */}
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-4">
              {/* Primeiro a Meta */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="tipoMeta"
                  name="tipo"
                  value="meta"
                  checked={dreamType === "meta"}
                  onChange={() => setDreamType("meta")}
                  className="mr-3 h-5 w-5 accent-primary cursor-pointer"
                />
                <label
                  htmlFor="tipoMeta"
                  className="text-gray-700 font-medium cursor-pointer flex items-center"
                >
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mr-2">
                    <FontAwesomeIcon icon="bullseye" />
                  </div>
                  Meta
                </label>
              </div>

              {/* Depois o Sonho */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="tipoSonho"
                  name="tipo"
                  value="sonho"
                  checked={dreamType === "sonho"}
                  onChange={() => setDreamType("sonho")}
                  className="mr-3 h-5 w-5 accent-primary cursor-pointer"
                />
                <label
                  htmlFor="tipoSonho"
                  className="text-gray-700 font-medium cursor-pointer flex items-center"
                >
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-2">
                    <FontAwesomeIcon icon="star" />
                  </div>
                  Sonho
                </label>
              </div>
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="text"
                placeholder={`Adicione ${dreamType === "meta" ? "uma" : "um"} ${
                  dreamType === "meta" ? "meta" : "sonho"
                }...`}
                value={newDream}
                onChange={(e) => setNewDream(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
              <button
                onClick={handleAddDream}
                className={`px-6 py-3 bg-gradient-to-r ${
                  dreamType === "meta"
                    ? "from-emerald-500 to-green-600"
                    : "from-blue-500 to-indigo-500"
                } text-white rounded-lg hover:shadow-lg hover:shadow-primary/20 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 sm:w-auto w-full`}
              >
                <FontAwesomeIcon icon="plus" />
                Adicionar {dreamType === "meta" ? "Meta" : "Sonho"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4">
              <h3 className="font-bold text-xl text-white flex items-center">
                <FontAwesomeIcon icon="bullseye" className="mr-3" />
                Nossas Metas
              </h3>
            </div>

            <div className="p-5">
              <ul className="space-y-4">
                {dreams
                  .filter(
                    (dream) => dream.type === "meta" || dream.type === "desejo"
                  )
                  .map((dream) => (
                    <li
                      key={dream.id}
                      className={`flex justify-between items-center p-4 rounded-lg border ${
                        dream.completed
                          ? "bg-green-50 border-green-200 text-gray-600"
                          : "bg-gray-50 border-gray-200"
                      } transition-all duration-200 hover:shadow-md group`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-3 p-2 rounded-full ${
                            dream.completed ? "bg-green-100" : "bg-emerald-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={dream.completed ? "check" : "bullseye"}
                            className={
                              dream.completed
                                ? "text-green-500"
                                : "text-emerald-500"
                            }
                          />
                        </div>
                        <span
                          className={
                            dream.completed
                              ? "line-through text-gray-500"
                              : "text-gray-700 font-medium"
                          }
                        >
                          {dream.text}
                        </span>
                      </div>

                      <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            toggleComplete(dream.id, dream.completed)
                          }
                          className={`p-2 rounded-lg text-white flex items-center transition-all duration-200 ${
                            dream.completed
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                          title={dream.completed ? "Reabrir" : "Completar"}
                        >
                          <FontAwesomeIcon
                            icon={dream.completed ? "redo" : "check"}
                          />
                        </button>
                        <button
                          onClick={() => deleteDream(dream.id)}
                          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 flex items-center"
                          title="Excluir"
                        >
                          <FontAwesomeIcon icon="trash" />
                        </button>
                      </div>
                    </li>
                  ))}

                {dreams.filter(
                  (dream) => dream.type === "meta" || dream.type === "desejo"
                ).length === 0 && (
                  <li className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon
                        icon="bullseye"
                        className="text-2xl text-emerald-300"
                      />
                    </div>
                    <p className="text-gray-500">
                      Nenhuma meta adicionada ainda.
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
              <h3 className="font-bold text-xl text-white flex items-center">
                <FontAwesomeIcon icon="star" className="mr-3" />
                Nossos Sonhos
              </h3>
            </div>

            <div className="p-5">
              <ul className="space-y-4">
                {dreams
                  .filter((dream) => dream.type === "sonho")
                  .map((dream) => (
                    <li
                      key={dream.id}
                      className={`flex justify-between items-center p-4 rounded-lg border ${
                        dream.completed
                          ? "bg-green-50 border-green-200 text-gray-600"
                          : "bg-gray-50 border-gray-200"
                      } transition-all duration-200 hover:shadow-md group`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-3 p-2 rounded-full ${
                            dream.completed ? "bg-green-100" : "bg-blue-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={dream.completed ? "check" : "star"}
                            className={
                              dream.completed
                                ? "text-green-500"
                                : "text-blue-500"
                            }
                          />
                        </div>
                        <span
                          className={
                            dream.completed
                              ? "line-through text-gray-500"
                              : "text-gray-700 font-medium"
                          }
                        >
                          {dream.text}
                        </span>
                      </div>

                      <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            toggleComplete(dream.id, dream.completed)
                          }
                          className={`p-2 rounded-lg text-white flex items-center transition-all duration-200 ${
                            dream.completed
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                          title={dream.completed ? "Reabrir" : "Completar"}
                        >
                          <FontAwesomeIcon
                            icon={dream.completed ? "redo" : "check"}
                          />
                        </button>
                        <button
                          onClick={() => deleteDream(dream.id)}
                          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 flex items-center"
                          title="Excluir"
                        >
                          <FontAwesomeIcon icon="trash" />
                        </button>
                      </div>
                    </li>
                  ))}

                {dreams.filter((dream) => dream.type === "sonho").length ===
                  0 && (
                  <li className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon
                        icon="star"
                        className="text-2xl text-blue-300"
                      />
                    </div>
                    <p className="text-gray-500">
                      Nenhum sonho adicionado ainda.
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamsWishes;
