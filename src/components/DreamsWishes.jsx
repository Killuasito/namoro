import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createPartnerNotification } from "../utils/notifications";

const DreamsWishes = () => {
  const [dreams, setDreams] = useState([]);
  const [newDream, setNewDream] = useState("");
  const [dreamType, setDreamType] = useState("meta");
  const [currentUser, setCurrentUser] = useState(null);
  const [targetDate, setTargetDate] = useState("");
  const [editing, setEditing] = useState(null);
  const [isPinned, setIsPinned] = useState(false);

  const adjustDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUser({
            ...userDoc.data(),
            uid: auth.currentUser.uid,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    };

    loadUserData();

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
      const dreamData = {
        text: newDream,
        type: dreamType,
        completed: false,
        createdAt: new Date(),
        authorId: auth.currentUser.uid,
        targetDate: targetDate ? adjustDate(targetDate) : null,
        pinned: isPinned,
      };

      const dreamRef = await addDoc(collection(db, "dreams"), dreamData);

      if (currentUser?.relationship?.partnerId) {
        await createPartnerNotification(
          currentUser.relationship.partnerId,
          auth.currentUser.uid,
          currentUser.displayName ||
            auth.currentUser.displayName ||
            "Seu parceiro(a)",
          dreamType === "meta" ? "goal" : "dream",
          `adicionou ${
            dreamType === "meta" ? "uma nova meta" : "um novo sonho"
          }: ${newDream}`,
          dreamRef.id
        );
      }

      setNewDream("");
      setTargetDate("");
      setIsPinned(false);
    } catch (error) {
      console.error("Erro ao adicionar sonho/meta:", error);
    }
  };

  const startEditing = (dream) => {
    setEditing(dream);
    setNewDream(dream.text);
    setDreamType(dream.type);
    setTargetDate(dream.targetDate || "");
    setIsPinned(dream.pinned || false);
  };

  const updateDream = async () => {
    if (!editing || !newDream.trim()) return;

    try {
      const dreamRef = doc(db, "dreams", editing.id);
      await updateDoc(dreamRef, {
        text: newDream,
        type: dreamType,
        targetDate: targetDate || null,
        pinned: isPinned,
        updatedAt: new Date(),
      });

      setEditing(null);
      setNewDream("");
      setTargetDate("");
      setIsPinned(false);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const togglePin = async (id, currentPinned) => {
    try {
      const dreamRef = doc(db, "dreams", id);
      await updateDoc(dreamRef, {
        pinned: !currentPinned,
      });
    } catch (error) {
      console.error("Erro ao fixar/desafixar:", error);
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

  const sortDreams = (items) => {
    return items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (a.targetDate && b.targetDate) {
        return new Date(a.targetDate) - new Date(b.targetDate);
      }
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;

      return b.createdAt - a.createdAt;
    });
  };

  const renderForm = () => (
    <div className="flex flex-col gap-4">
      {/* Radio buttons para tipo */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="meta"
              checked={dreamType === "meta"}
              onChange={(e) => setDreamType(e.target.value)}
              className="w-4 h-4 text-pink-300 focus:ring-pink-200"
            />
            <span className="text-sm text-gray-600">Meta</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="sonho"
              checked={dreamType === "sonho"}
              onChange={(e) => setDreamType(e.target.value)}
              className="w-4 h-4 text-pink-300 focus:ring-pink-200"
            />
            <span className="text-sm text-gray-600">Sonho</span>
          </label>
        </div>
      </div>

      <input
        type="text"
        placeholder={`${editing ? "Atualizar" : "Adicionar"} ${
          dreamType === "meta" ? "meta" : "sonho"
        }...`}
        value={newDream}
        onChange={(e) => setNewDream(e.target.value)}
        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300"
      />

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <label className="block text-sm text-gray-600 mb-1">Data Alvo</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300"
          />
        </div>

        <div className="w-full">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-4 w-4 border border-gray-300 rounded bg-white peer-checked:bg-pink-300 peer-checked:border-pink-300 transition-colors">
                {isPinned && (
                  <FontAwesomeIcon
                    icon="check"
                    className="h-3 w-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            </div>
            <span className="text-sm text-gray-600 group-hover:text-gray-800">
              Fixar
            </span>
          </label>
        </div>
      </div>

      <button
        onClick={editing ? updateDream : handleAddDream}
        className="px-6 py-3 bg-pink-300 hover:bg-pink-400 text-white rounded-lg transition-all duration-200"
      >
        <FontAwesomeIcon icon={editing ? "edit" : "plus"} className="mr-2" />
        {editing ? "Atualizar" : "Adicionar"}
      </button>
    </div>
  );

  const renderDreamItem = (dream) => {
    const isAuthor = dream.authorId === auth.currentUser?.uid;

    return (
      <li
        key={dream.id}
        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border
          ${
            dream.completed
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }
          ${
            dream.pinned
              ? "border-pink-300 border-2 border-dashed relative"
              : ""
          }
          transition-all duration-200 hover:shadow-md group gap-4`}
      >
        {dream.pinned && (
          <div className="absolute -top-2 left-2 bg-pink-100 px-2 py-0.5 rounded-full text-xs text-pink-500">
            <FontAwesomeIcon icon="thumbtack" className="mr-1" />
            Fixado
          </div>
        )}

        <div className="flex items-center gap-3 flex-1">
          <div
            className={`p-2 rounded-full ${
              dream.completed
                ? "bg-green-100"
                : dream.type === "meta"
                ? "bg-emerald-100"
                : "bg-blue-100"
            }`}
          >
            <FontAwesomeIcon
              icon={
                dream.completed
                  ? "check"
                  : dream.type === "meta"
                  ? "bullseye"
                  : "star"
              }
              className={
                dream.completed
                  ? "text-green-500"
                  : dream.type === "meta"
                  ? "text-emerald-500"
                  : "text-blue-500"
              }
            />
          </div>

          <div className="flex-1">
            <span
              className={
                dream.completed
                  ? "line-through text-gray-500"
                  : "text-gray-700 font-medium"
              }
            >
              {dream.text}
            </span>
            {dream.targetDate && (
              <p className="text-xs text-gray-500 mt-1">
                Data alvo:{" "}
                {new Date(adjustDate(dream.targetDate)).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => togglePin(dream.id, dream.pinned)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              dream.pinned
                ? "bg-pink-300 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            title={dream.pinned ? "Desafixar" : "Fixar"}
          >
            <FontAwesomeIcon icon="thumbtack" />
          </button>

          <button
            onClick={() => toggleComplete(dream.id, dream.completed)}
            className={`p-2 rounded-lg text-white flex items-center transition-all duration-200 ${
              dream.completed
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
            title={dream.completed ? "Reabrir" : "Completar"}
          >
            <FontAwesomeIcon icon={dream.completed ? "redo" : "check"} />
          </button>

          {isAuthor && (
            <>
              <button
                onClick={() => startEditing(dream)}
                className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                title="Editar"
              >
                <FontAwesomeIcon icon="edit" />
              </button>

              <button
                onClick={() => deleteDream(dream.id)}
                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                title="Excluir"
              >
                <FontAwesomeIcon icon="trash" />
              </button>
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
          <div className="bg-primary text-pink-300 p-3 rounded-lg mr-4">
            <FontAwesomeIcon icon="star" />
          </div>
          <span className="text-primary">Nossos Sonhos e Metas</span>
        </h2>

        <div className="mb-10 bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-semibold text-xl mb-6 text-gray-700 flex items-center">
            <FontAwesomeIcon icon="plus" className="mr-3 text-primary" />
            {editing ? "Editar" : "Adicionar Novo"}
          </h3>

          {renderForm()}
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
                {sortDreams(
                  dreams.filter(
                    (dream) => dream.type === "meta" || dream.type === "desejo"
                  )
                ).map((dream) => renderDreamItem(dream))}

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
                {sortDreams(
                  dreams.filter((dream) => dream.type === "sonho")
                ).map((dream) => renderDreamItem(dream))}

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
